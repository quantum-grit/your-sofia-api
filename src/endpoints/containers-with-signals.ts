import type { Endpoint } from 'payload'
import { sql } from '@payloadcms/db-postgres'

// Zoom level at which we switch from clusters to individual markers
const INDIVIDUAL_ZOOM = 16

// Grid cell size in degrees for each zoom level (ST_SnapToGrid clustering)
function getGridSize(zoom: number): number {
  const sizes: Record<number, number> = {
    10: 0.5,
    11: 0.25,
    12: 0.1,
    13: 0.05,
    14: 0.02,
    15: 0.01,
  }
  return sizes[Math.min(Math.max(zoom, 10), 15)] ?? 0.5
}

export const containersWithSignalCount: Endpoint = {
  path: '/containers-with-signal-count',
  method: 'get',
  handler: async (req) => {
    const { payload } = req

    try {
      const zoom = parseInt((req.query?.zoom as string) || '12')
      const status = req.query?.status as string | undefined
      const minLat = parseFloat((req.query?.minLat as string) || '')
      const maxLat = parseFloat((req.query?.maxLat as string) || '')
      const minLng = parseFloat((req.query?.minLng as string) || '')
      const maxLng = parseFloat((req.query?.maxLng as string) || '')
      const hasBounds = !isNaN(minLat) && !isNaN(maxLat) && !isNaN(minLng) && !isNaN(maxLng)

      const allowedStatuses = ['active', 'full', 'maintenance', 'inactive', 'pending'] as const
      const hasStatusFilter =
        typeof status === 'string' && (allowedStatuses as readonly string[]).includes(status)

      const db = payload.db

      const boundsFilter = hasBounds
        ? sql`AND wc.location && ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)`
        : sql``
      const statusFilter = hasStatusFilter ? sql`AND wc.status = ${status}` : sql``

      if (zoom >= INDIVIDUAL_ZOOM) {
        // Return individual markers for the visible viewport (capped at 2000)
        const limit = 2000
        const query = sql`
          SELECT
            wc.id,
            wc.legacy_id,
            wc.public_number,
            wc.image_id,
            ST_X(wc.location::geometry)::float AS longitude,
            ST_Y(wc.location::geometry)::float AS latitude,
            wc.capacity_size,
            wc.capacity_volume,
            wc.waste_type,
            wc.status,
            wc.serviced_by,
            wc.notes,
            wc.address,
            wc.last_cleaned,
            wc.bin_count,
            wc.district_id,
            wc.created_at,
            wc.updated_at,
            COALESCE(COUNT(s.id), 0)::int AS signal_count,
            COALESCE(COUNT(s.id) FILTER (
              WHERE s.status NOT IN ('resolved', 'rejected')
            ), 0)::int AS active_signal_count
          FROM waste_containers wc
          LEFT JOIN signals s ON (
            s.city_object_reference_id = wc.public_number
            AND s.city_object_type = 'waste-container'
          )
          WHERE wc.location IS NOT NULL
            ${boundsFilter}
            ${statusFilter}
          GROUP BY wc.id
          ORDER BY active_signal_count DESC
          LIMIT ${limit}
        `

        const resultRows = await db.drizzle.execute(query)
        const rows = resultRows.rows as Record<string, unknown>[]

        const docs = rows.map((row) => ({
          type: 'marker' as const,
          id: row.id,
          legacyId: row.legacy_id,
          publicNumber: row.public_number,
          imageId: row.image_id,
          location: [Number(row.longitude), Number(row.latitude)] as [number, number],
          capacitySize: row.capacity_size,
          capacityVolume: row.capacity_volume,
          wasteType: row.waste_type,
          status: row.status,
          servicedBy: row.serviced_by,
          notes: row.notes,
          address: row.address,
          lastCleaned: row.last_cleaned,
          binCount: row.bin_count,
          districtId: row.district_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          signalCount: row.signal_count,
          activeSignalCount: row.active_signal_count,
        }))

        return Response.json({ type: 'markers', docs, zoom })
      } else {
        // Return clusters using PostGIS ST_SnapToGrid
        const gridSize = getGridSize(zoom)
        const query = sql`
          SELECT
            ST_X(ST_Centroid(ST_Collect(wc.location::geometry)))::float AS lng,
            ST_Y(ST_Centroid(ST_Collect(wc.location::geometry)))::float AS lat,
            COUNT(DISTINCT wc.id)::int AS count,
            MODE() WITHIN GROUP (ORDER BY wc.status) AS dominant_status,
            COUNT(DISTINCT s.id) FILTER (
              WHERE s.id IS NOT NULL AND s.status NOT IN ('resolved', 'rejected')
            )::int AS active_signal_count
          FROM waste_containers wc
          LEFT JOIN signals s ON (
            s.city_object_reference_id = wc.public_number
            AND s.city_object_type = 'waste-container'
          )
          WHERE wc.location IS NOT NULL
            ${boundsFilter}
            ${statusFilter}
          GROUP BY ST_SnapToGrid(wc.location::geometry, ${gridSize})
          ORDER BY count DESC
        `

        const resultRows = await db.drizzle.execute(query)
        const rows = resultRows.rows as Record<string, unknown>[]

        const docs = rows.map((row) => ({
          type: 'cluster' as const,
          lat: Number(row.lat),
          lng: Number(row.lng),
          count: Number(row.count),
          dominantStatus: String(row.dominant_status ?? 'active'),
          activeSignalCount: Number(row.active_signal_count ?? 0),
        }))

        return Response.json({ type: 'clusters', docs, zoom })
      }
    } catch (error) {
      console.error('Error fetching containers with signals:', error)
      return Response.json(
        {
          error: 'Failed to fetch containers with signal counts',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  },
}
