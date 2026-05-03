import type { Endpoint } from 'payload'
import { sql } from '@payloadcms/db-postgres'

const PERIOD_DAYS = 30

function parseDate(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

export const newlyCreatedMetrics: Endpoint = {
  path: '/newly-created-metrics',
  method: 'get',
  handler: async (req) => {
    const { payload } = req

    try {
      const todayUtc = startOfUtcDay(new Date())
      const defaultFrom = addUtcDays(todayUtc, -(PERIOD_DAYS - 1))

      const from = startOfUtcDay(parseDate(req.query?.from as string | undefined, defaultFrom))
      const toInclusive = startOfUtcDay(parseDate(req.query?.to as string | undefined, todayUtc))

      const normalizedToInclusive = toInclusive >= from ? toInclusive : from
      const toExclusive = addUtcDays(normalizedToInclusive, 1)

      const fromIso = from.toISOString()
      const toExclusiveIso = toExclusive.toISOString()

      const trendQuery = sql`
				WITH day_series AS (
					SELECT generate_series(
						${fromIso}::date,
						(${toExclusiveIso}::date - INTERVAL '1 day')::date,
						INTERVAL '1 day'
					)::date AS day
				),
				pending_created AS (
					SELECT
						(wc.created_at AT TIME ZONE 'Europe/Sofia')::date AS day,
						COUNT(*)::int                                     AS container_count
					FROM waste_containers wc
					LEFT JOIN city_districts cd ON cd.id = wc.district_id
					WHERE wc.status = 'pending'
						AND wc.created_at >= ${fromIso}::timestamptz
						AND wc.created_at < ${toExclusiveIso}::timestamptz
						AND cd.code = 'RTR'
						AND wc.capacity_volume = 1.1
					GROUP BY (wc.created_at AT TIME ZONE 'Europe/Sofia')::date
				)
				SELECT
					ds.day::text                           AS day_iso,
					COALESCE(pc.container_count, 0)::int   AS container_count
				FROM day_series ds
				LEFT JOIN pending_created pc ON pc.day = ds.day
				ORDER BY ds.day
			`

      const result = await payload.db.drizzle.execute(trendQuery)
      const byDay = (
        result.rows as {
          day_iso: string
          container_count: number
        }[]
      ).map((row) => ({
        date: row.day_iso,
        count: row.container_count,
      }))

      return Response.json({
        from: fromIso,
        to: normalizedToInclusive.toISOString(),
        byDay,
      })
    } catch (error) {
      console.error('Error fetching newly created container metrics:', error)
      return Response.json(
        {
          error: 'Failed to fetch newly created container metrics',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  },
}
