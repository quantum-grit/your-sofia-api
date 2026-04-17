import type { TaskConfig, TaskHandler } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { parseWasteScheduleXLS } from '../../utilities/parseWasteScheduleXLS'
import { sleep } from '../../utilities/geocodeAddress'
import { geocodeScheduleEntry } from '../../utilities/geocodeScheduleEntry'
import { buildXlsUrl } from '../../utilities/wasteScheduleUrl'

const DISTRICTS = [
  // Confirmed present on inspectorat-so.org Feb 2026:
  'BANKIA',
  'ILINDEN',
  'ISKAR',
  'KRASNA_POLIANA',
  'KREMIKOVCI',
  'LOZENEC',
  'MLADOST',
  'NADEJDA',
  'NOVI_ISKUR',
  'OBORISHTE',
  'OVCHA_KUPEL',
  'PANCHAREVO',
  'SERDIKA',
  'SREDEC',
  'STUDENTSKI',
  'TRIADICA',
  // Remaining Sofia districts — gracefully skipped on 404:
  'VITOSHA',
  'VRUBNITSA',
  'VAZRAJDANE',
  'IZGREV',
  'KRASNO_SELO',
  'LYULIN',
  'SLATINA',
]

const BIN_SIZES = ['110', '240', '1100', '2250', '3000', '3750', '4m3']
const MATCH_LIMIT = 5

const handler: TaskHandler<'syncWasteCollectionSchedules'> = async ({ input, req }) => {
  const { payload } = req
  const now = new Date()
  const year = input?.year ?? now.getFullYear()
  const month = input?.month ?? now.getMonth()
  const scheduleSourcePrefix = `${year}-${String(month).padStart(2, '0')}`

  const districtsToRun = input?.district ? [input.district] : DISTRICTS
  const sizesToRun = input?.size ? [input.size] : BIN_SIZES

  let filesDownloaded = 0
  let streetsMatched = 0
  let containersUpdated = 0
  let streetsUnmatched = 0
  let districtsProcessed = 0

  for (const district of districtsToRun) {
    const districtHint = district.replace(/_/g, ' ')
    const prefixes = district === 'TRIADICA' ? ['', 'centar_'] : ['']

    for (const prefix of prefixes) {
      for (const size of sizesToRun) {
        const url = buildXlsUrl(year, month, district, size, prefix)

        let buffer: Buffer
        try {
          const resp = await fetch(url, { signal: AbortSignal.timeout(30_000) })
          if (resp.status === 404) continue
          if (!resp.ok) {
            payload.logger.warn(`[syncSchedules] ${url} → ${resp.status}`)
            continue
          }
          buffer = Buffer.from(await resp.arrayBuffer())
          filesDownloaded++
        } catch (err) {
          if (err instanceof Error && err.name === 'TimeoutError') {
            payload.logger.warn(`[syncSchedules] fetch timed out: ${url}`)
          } else {
            payload.logger.warn(`[syncSchedules] fetch failed: ${url}: ${String(err)}`)
          }
          continue
        }

        let entries
        try {
          entries = parseWasteScheduleXLS(buffer, year, month)
        } catch (err) {
          payload.logger.error(`[syncSchedules] parse failed: ${url}: ${String(err)}`)
          continue
        }

        payload.logger.info(`[syncSchedules] ${district}/${size}: ${entries.length} entries`)

        let fileMatched = 0
        let fileUnmatched = 0

        for (const entry of entries) {
          const geo = await geocodeScheduleEntry(entry.address, districtHint, payload)

          // Always sleep after a Nominatim call. For TYPE_C (Overpass) an extra
          // sleep is baked into geocodeScheduleEntry via separate request.
          await sleep(1100)

          if (!geo) {
            fileUnmatched++
            streetsUnmatched++
            payload.logger.info(`[syncSchedules] MISS  [${districtHint}] "${entry.address}"`)
            continue
          }

          const nearbyResult = await payload.db.drizzle.execute(sql`
            SELECT id, public_number FROM waste_containers
            WHERE ST_DWithin(
              ST_SetSRID(ST_MakePoint(${geo.point.lng}, ${geo.point.lat}), 4326)::geography,
              location,
              ${geo.radius}
            )
            ORDER BY ST_Distance(
              ST_SetSRID(ST_MakePoint(${geo.point.lng}, ${geo.point.lat}), 4326)::geography,
              location
            ) ASC
            LIMIT ${MATCH_LIMIT}
          `)

          const containers = (nearbyResult?.rows ?? []) as { id: number; public_number: string }[]
          const containerIds = containers.map((r) => r.id)

          if (containerIds.length === 0) {
            fileUnmatched++
            streetsUnmatched++
            payload.logger.info(
              `[syncSchedules] MISS  [${districtHint}/${geo.type}] "${entry.address}" — geocoded (${geo.point.lat.toFixed(5)},${geo.point.lng.toFixed(5)}) radius=${geo.radius}m — 0 containers nearby`
            )
            continue
          }

          fileMatched++
          streetsMatched++
          payload.logger.info(
            `[syncSchedules] MATCH [${districtHint}/${geo.type}] "${entry.address}" → ${containers.length} container(s) [${containers.map((c) => c.public_number).join(', ')}]`
          )

          for (const id of containerIds) {
            await payload.update({
              collection: 'waste-containers',
              id,
              data: {
                collectionDaysOfWeek: entry.daysOfWeek.map(String) as (
                  | '1'
                  | '2'
                  | '3'
                  | '4'
                  | '5'
                  | '6'
                  | '7'
                )[],
                collectionTimesPerDay: entry.timesPerDay,
                scheduleSource: `${scheduleSourcePrefix}/${district}/${size}`,
              },
              overrideAccess: true,
            })
            containersUpdated++
          }
        }

        payload.logger.info(
          `[syncSchedules] ${district}/${size}: matched=${fileMatched} unmatched=${fileUnmatched} of ${entries.length}`
        )
      }
    }
    districtsProcessed++
  }

  payload.logger.info(
    `[syncSchedules] Done. districts=${districtsProcessed} files=${filesDownloaded} ` +
      `matched=${streetsMatched} unmatched=${streetsUnmatched} updated=${containersUpdated}`
  )

  return {
    output: {
      districtsProcessed,
      filesDownloaded,
      streetsMatched,
      containersUpdated,
      streetsUnmatched,
    },
  }
}

export const syncWasteCollectionSchedules: TaskConfig<'syncWasteCollectionSchedules'> = {
  slug: 'syncWasteCollectionSchedules',
  label: 'Sync Waste Collection Schedules from inspectorat-so.org',
  schedule: [{ cron: '0 3 28 * *', queue: 'default' }], // 3am on the 28th of every month
  inputSchema: [
    { name: 'year', type: 'number' },
    { name: 'month', type: 'number' },
    { name: 'district', type: 'text' },
    { name: 'size', type: 'text' },
  ],
  outputSchema: [
    { name: 'districtsProcessed', type: 'number', required: true },
    { name: 'filesDownloaded', type: 'number', required: true },
    { name: 'streetsMatched', type: 'number', required: true },
    { name: 'containersUpdated', type: 'number', required: true },
    { name: 'streetsUnmatched', type: 'number', required: true },
  ],
  retries: 1,
  handler,
}
