/**
 * Classify and parse a Bulgarian waste-schedule address string.
 *
 * Based on analysis of the Triaditsa 1100L February 2026 XLS (555 entries):
 *
 *   TYPE_A — street + house number   (50%)  e.g. "бул. Витоша №74"
 *   TYPE_B — street + block number   (21%)  e.g. "ул. Бурел бл. 74"
 *   TYPE_C — intersection            (13%)  e.g. "бул. Витоша с ул. \"Гургулят\""
 *                                           e.g. "ул. Тунджа ъгъла с ул. Удово"
 *   TYPE_D — street + "срещу №X"     ( 8%)  e.g. "ул. Цар Асен срещу №112"
 *   TYPE_E — street + positional     ( 7%)  e.g. "ул. Хан Пресиян пред хотел Медик"
 *   TYPE_F — no recognisable street  ( 1%)  e.g. "Южен парк II пред автокъща Евроауто"
 *
 * The `radius` field is the recommended PostGIS ST_DWithin search radius in metres
 * for each type.
 */

const STREET_PREFIX_RE = /^(?:ул\.|бул\.|пл\.|пр\.|кв\.|ж\.к\.|жк)\s*/i

/** Strip Bulgarian street-type prefix and surrounding quotes/whitespace. */
function stripPrefix(s: string): string {
  return s
    .replace(STREET_PREFIX_RE, '')
    .replace(/^["«»]|["«»]$/g, '')
    .trim()
}

/**
 * Strip everything from a known noise keyword onwards.
 * Used to isolate the bare street name from positional suffixes.
 */
function stripPositional(s: string): string {
  return s
    .replace(/\s+(?:пред|вход|до\s|зад|при\s|колелото|паркинг|пяцце|в\s+двора).*$/i, '')
    .replace(/\s+(?:ВМА|НДК|ОДЗ|СОУ|ДКЦ|ПИБ)\b.*/i, '')
    .trim()
}

/** Parse a house/block number from a raw string — returns the numeric part or null. */
function parseNumber(raw: string): string | null {
  const m = raw.match(/\d+[\s]*[А-ЯA-Z]?/)
  return m ? m[0].trim() : null
}

// ── detector regexes ──────────────────────────────────────────────────────────

/** Intersection keyword: "с ул.", "с бул.", "ъгъла с", "ъгъл с" */
const INTERSECTION_RE =
  /\s+(?:ъгъла?\s+с\s+|с\s+)(?:ул\.|бул\.|пл\.|пр\.)\s*["«»]?([^,\n(]+?)["«»]?(?:\s*[\(,]|$)/i

/** Block number: "бл. 74", "бл.74" */
const BLOCK_RE = /\bбл\.?\s*(\d+)/i

/** House number: "№74", "#74", or plain "74" after the street name */
const HOUSE_RE = /[№#]\s*(\d+[А-ЯA-Z]?(?:-\d+[А-ЯA-Z]?)?)|(?<=\s)(\d+[А-ЯA-Z]?)(?:\s|$)/

/** "срещу", meaning opposite/across from */
const SRESHTU_RE = /срещу\s+(?:[№#]\s*)?(\d+)/i

export type AddressType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export interface ClassifiedAddress {
  /** Detected address type — drives geocoding strategy. */
  type: AddressType
  /** Primary street name, prefix-stripped. */
  street: string
  /** House number string (TYPE_A, TYPE_D). */
  houseNumber: string | null
  /** Block number string (TYPE_B). */
  blockNumber: string | null
  /** Secondary / cross street name, prefix-stripped (TYPE_C). */
  crossStreet: string | null
  /** Recommended spatial search radius in metres. */
  radius: number
  /** Nominatim `street` parameter — street name [+ number] ready for querying. */
  nominatimStreet: string
}

/**
 * Classify a raw XLS schedule address and extract all queryable components.
 * Never throws; always returns a result (degrades to TYPE_F on unparseable input).
 */
export function classifyScheduleAddress(raw: string): ClassifiedAddress {
  const addr = raw
    .replace(/\s*\([^)]*\)/g, ' ') // strip parenthetical notes — keep for analysis but remove from tokens
    .replace(/[""«»]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()

  const hasStreetPrefix = STREET_PREFIX_RE.test(addr)

  // ── TYPE_C: intersection ──────────────────────────────────────────────────
  const interMatch = INTERSECTION_RE.exec(addr)
  if (interMatch) {
    const primaryRaw = addr.slice(0, interMatch.index).trim()
    const crossRaw = interMatch[1]!.trim()
    const street = stripPrefix(primaryRaw)
    const crossStreet = stripPrefix(crossRaw)

    // TYPE_C may also carry a house number before the intersection keyword
    // e.g. "бул. Ген. Скобелев 8, ъгъла с ул. Цар Асен"
    const houseMatch = HOUSE_RE.exec(street)
    const houseNumber = houseMatch ? (houseMatch[1] ?? houseMatch[2] ?? null) : null
    const bareStreet = houseNumber ? street.replace(HOUSE_RE, '').trim() : street

    return {
      type: 'C',
      street: bareStreet,
      houseNumber,
      blockNumber: null,
      crossStreet,
      radius: 150,
      nominatimStreet: transliterateForQuery(bareStreet),
    }
  }

  // ── TYPE_D: срещу (opposite a number) ────────────────────────────────────
  const sreshtuMatch = SRESHTU_RE.exec(addr)
  if (sreshtuMatch) {
    const street = stripPrefix(addr.replace(SRESHTU_RE, '').trim())
    const houseNumber = sreshtuMatch[1]!
    return {
      type: 'D',
      street,
      houseNumber,
      blockNumber: null,
      crossStreet: null,
      radius: 80,
      nominatimStreet: transliterateForQuery(street + ' ' + houseNumber),
    }
  }

  if (!hasStreetPrefix && !BLOCK_RE.test(addr) && !HOUSE_RE.test(addr)) {
    // ── TYPE_F: no recognisable street ───────────────────────────────────────
    return {
      type: 'F',
      street: addr,
      houseNumber: null,
      blockNumber: null,
      crossStreet: null,
      radius: 200,
      nominatimStreet: transliterateForQuery(addr),
    }
  }

  // ── TYPE_B: block number ──────────────────────────────────────────────────
  const blockMatch = BLOCK_RE.exec(addr)
  if (blockMatch) {
    const street = stripPrefix(addr.slice(0, blockMatch.index).trim())
    const blockNumber = parseNumber(blockMatch[1]!)
    return {
      type: 'B',
      street,
      houseNumber: null,
      blockNumber,
      crossStreet: null,
      radius: 100,
      nominatimStreet: transliterateForQuery(street + (blockNumber ? ' ' + blockNumber : '')),
    }
  }

  // ── TYPE_A: street + house number ─────────────────────────────────────────
  const houseMatch = HOUSE_RE.exec(addr)
  if (houseMatch) {
    const houseNumber = (houseMatch[1] ?? houseMatch[2] ?? '').trim()
    const beforeNumber = addr.slice(0, houseMatch.index).trim()
    const street = stripPrefix(beforeNumber)
    return {
      type: 'A',
      street,
      houseNumber,
      blockNumber: null,
      crossStreet: null,
      radius: 60,
      nominatimStreet: transliterateForQuery(street + ' ' + houseNumber),
    }
  }

  // ── TYPE_E: street only / positional ─────────────────────────────────────
  const street = stripPrefix(stripPositional(addr))
  return {
    type: 'E',
    street,
    houseNumber: null,
    blockNumber: null,
    crossStreet: null,
    radius: 150,
    nominatimStreet: transliterateForQuery(street),
  }
}

// ── Transliteration (BDS ISO 9) ───────────────────────────────────────────────

const CYR_MAP: Record<string, string> = {
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

function transliterateForQuery(text: string): string {
  return text
    .split('')
    .map((c) => CYR_MAP[c] ?? c)
    .join('')
}
