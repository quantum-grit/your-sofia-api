import type { BasePayload } from 'payload'
import { classifyScheduleAddress } from './classifyScheduleAddress'

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search'
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const USER_AGENT = 'YourSofia/1.0 (sofia-municipality@sofia.bg)'

/** Sofia bounding box for Overpass queries (south,west,north,east). */
const SOFIA_BBOX = '42.5,23.1,42.9,23.6'

export type GeoPoint = { lat: number; lng: number }

export interface GeoResult {
  point: GeoPoint
  /** PostGIS ST_DWithin search radius in metres appropriate for this address type. */
  radius: number
  /** Address type from classifier — useful for logging. */
  type: string
}

// ── Nominatim ─────────────────────────────────────────────────────────────────

async function queryNominatim(street: string, districtHint: string): Promise<GeoPoint | null> {
  const params = new URLSearchParams({
    street,
    city: 'Sofia',
    country: 'bg',
    format: 'json',
    limit: '1',
  })
  if (districtHint) params.set('county', districtHint)

  const resp = await fetch(`${NOMINATIM_BASE}?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(15_000),
  })
  if (!resp.ok) return null

  const results: { lat: string; lon: string }[] = await resp.json()
  if (!results.length) return null

  const lat = parseFloat(results[0]!.lat)
  const lng = parseFloat(results[0]!.lon)
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}

// ── Overpass ──────────────────────────────────────────────────────────────────

function cyrToLatin(text: string): string {
  const MAP: Record<string, string> = {
    А: 'A',
    Б: 'B',
    В: 'V',
    Г: 'G',
    Д: 'D',
    Е: 'E',
    Ж: 'Zh',
    З: 'Z',
    И: 'I',
    Й: 'Y',
    К: 'K',
    Л: 'L',
    М: 'M',
    Н: 'N',
    О: 'O',
    П: 'P',
    Р: 'R',
    С: 'S',
    Т: 'T',
    У: 'U',
    Ф: 'F',
    Х: 'H',
    Ц: 'Ts',
    Ч: 'Ch',
    Ш: 'Sh',
    Щ: 'Sht',
    Ъ: 'A',
    Ь: 'Y',
    Ю: 'Yu',
    Я: 'Ya',
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'h',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'sht',
    ъ: 'a',
    ь: 'y',
    ю: 'yu',
    я: 'ya',
  }
  return text
    .split('')
    .map((c) => MAP[c] ?? c)
    .join('')
}

async function queryOverpassIntersection(
  streetA: string,
  streetB: string
): Promise<GeoPoint | null> {
  const aLatin = cyrToLatin(streetA)
  const bLatin = cyrToLatin(streetB)

  // Query nodes shared by ways matching either the Cyrillic or Latin name of both streets
  const query = `
[out:json][timeout:30][bbox:${SOFIA_BBOX}];
(
  way["name"~"${streetA}",i];
  way["name:en"~"${aLatin}",i];
)->.a;
(
  way["name"~"${streetB}",i];
  way["name:en"~"${bLatin}",i];
)->.b;
node(w.a)(w.b);
out body;
`.trim()

  const resp = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(35_000),
  })
  if (!resp.ok) return null

  const json: { elements?: { type: string; lat: number; lon: number }[] } = await resp.json()
  const nodes = (json.elements ?? []).filter((e) => e.type === 'node')
  if (!nodes.length) return null

  // Use median node to avoid endpoints of very long streets
  const mid = nodes[Math.floor(nodes.length / 2)]!
  return { lat: mid.lat, lng: mid.lon }
}

// ── Cache helpers ─────────────────────────────────────────────────────────────

/**
 * Look up a cache key in geocode-addresses; returns the cached point or
 * `undefined` if not yet cached, `null` for a confirmed miss.
 */
async function getCached(
  cacheKey: string,
  districtHint: string,
  payload: BasePayload
): Promise<GeoPoint | null | undefined> {
  const cached = await payload.find({
    collection: 'geocode-addresses',
    where: {
      and: [{ address: { equals: cacheKey } }, { districtHint: { equals: districtHint } }],
    },
    limit: 1,
    overrideAccess: true,
  })
  if (!cached.docs.length) return undefined // not in cache

  const loc = cached.docs[0]!.location as [number, number] | null | undefined
  if (Array.isArray(loc)) return { lat: loc[1]!, lng: loc[0]! }
  return null // cached miss
}

async function saveCache(
  cacheKey: string,
  districtHint: string,
  point: GeoPoint | null,
  payload: BasePayload
): Promise<void> {
  await payload.create({
    collection: 'geocode-addresses',
    data: {
      address: cacheKey,
      districtHint,
      ...(point ? { location: [point.lng, point.lat] } : {}),
    },
    overrideAccess: true,
  })
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Geocode a single waste-schedule address using a type-aware strategy:
 *
 *   TYPE_A (street+number)  → Nominatim structured, 60 m radius
 *   TYPE_B (street+block)   → Nominatim with block as housenumber, 100 m radius
 *   TYPE_C (intersection)   → Overpass intersection node, 150 m radius
 *   TYPE_D (срещу/opposite) → Nominatim with opposing number, 80 m radius
 *   TYPE_E (positional)     → Nominatim street only, 150 m radius
 *   TYPE_F (no street)      → Nominatim free-text, 200 m radius
 *
 * Results are cached in the geocode-addresses collection. Returns null on miss
 * or transient error. Never throws.
 *
 * Callers MUST call sleep(1100) between invocations for Nominatim rate limiting.
 * For TYPE_C an additional sleep(2000) is needed for Overpass.
 */
export async function geocodeScheduleEntry(
  raw: string,
  districtHint: string,
  payload: BasePayload
): Promise<GeoResult | null> {
  const classified = classifyScheduleAddress(raw)
  const { type, street, crossStreet, radius, nominatimStreet } = classified

  let point: GeoPoint | null = null

  if (type === 'C' && crossStreet) {
    // ── Overpass intersection ────────────────────────────────────────────────
    const key = `intersection:${[street, crossStreet].sort().join('|')}`
    const cached = await getCached(key, districtHint, payload)

    if (cached !== undefined) {
      if (!cached) return null
      return { point: cached, radius, type }
    }

    try {
      point = await queryOverpassIntersection(street, crossStreet)
    } catch {
      return null // transient — not cached
    }

    await saveCache(key, districtHint, point, payload)
    if (!point) return null
    return { point, radius, type }
  }

  // ── Nominatim (all other types) ───────────────────────────────────────────
  const key = nominatimStreet
  const cached = await getCached(key, districtHint, payload)

  if (cached !== undefined) {
    if (!cached) return null
    return { point: cached, radius, type }
  }

  try {
    point = await queryNominatim(nominatimStreet, districtHint)
  } catch {
    return null // transient — not cached
  }

  await saveCache(key, districtHint, point, payload)
  if (!point) return null
  return { point, radius, type }
}
