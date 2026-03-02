import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface CSVRow {
  lat: number
  long: number
  type: number
  count: number
  state: string
}

function parseCSV(filePath: string): CSVRow[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.trim().split('\n')
  const rows: CSVRow[] = []

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim()
    if (!line) continue

    const parts = line.split(',')
    if (parts.length < 5) continue

    const lat = parts[0]
    const long = parts[1]
    const type = parts[2]
    const count = parts[3]
    const state = parts[4]

    if (!lat || !long || !type || !count || !state) continue

    rows.push({
      lat: parseFloat(lat),
      long: parseFloat(long),
      type: parseInt(type),
      count: parseInt(count),
      state: state,
    })
  }

  return rows
}

function getCapacityFromType(type: number): { volume: number; size: 'tiny' | 'small' | 'standard' | 'big' | 'industrial' } {
  switch (type) {
    case 110:
      return { volume: 0.11, size: 'small' }
    case 120:
      return { volume: 0.12, size: 'small' }
    case 240:
      return { volume: 0.24, size: 'small' }
    case 1100:
      return { volume: 1.1, size: 'standard' }
    default:
      return { volume: 1.1, size: 'standard' }
  }
}

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  console.log('Starting Vitosha, Ilinden, Oborishte containers import migration...')

  const districts = [
    {
      name: 'Ilinden',
      file: path.join(__dirname, 'containers_ilinden.csv'),
      prefix: 'RIL',
    },
    {
      name: 'Oborishte',
      file: path.join(__dirname, 'containers_oborishte.csv'),
      prefix: 'ROB',
    },
    {
      name: 'Vitosha',
      file: path.join(__dirname, 'containers_vitosha.csv'),
      prefix: 'RVI',
    },
  ]

  let totalImported = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (const district of districts) {
    console.log(`\nProcessing ${district.name}...`)
    
    if (!fs.existsSync(district.file)) {
      console.warn(`File not found: ${district.file}`)
      continue
    }

    const rows = parseCSV(district.file)
    console.log(`Found ${rows.length} rows in ${district.name} CSV`)

    let imported = 0
    let skipped = 0
    let errors = 0

    for (const row of rows) {
      try {
        if (!Number.isFinite(row.lat) || !Number.isFinite(row.long)) {
          console.warn('Skipping row with invalid coordinates:', row)
          skipped++
          continue
        }

        const capacity = getCapacityFromType(row.type)
        const publicNumber = `${district.prefix}-${String(imported + 1).padStart(4, '0')}`

        await payload.create({
          collection: 'waste-containers',
          data: {
            publicNumber,
            location: [row.long, row.lat],
            capacityVolume: capacity.volume,
            capacitySize: capacity.size,
            binCount: row.count || 1,
            wasteType: 'general',
            source: 'official',
            status: 'active',
            notes: `Въведен по данни от инспекторат ${district.name}`,
          },
        })

        imported++
        if (imported % 100 === 0) {
          console.log(`  Imported ${imported} containers from ${district.name}...`)
        }
      } catch (error) {
        console.error('Error importing row:', row, error)
        errors++
      }
    }

    console.log(`${district.name} completed:`)
    console.log(`  - Imported: ${imported}`)
    console.log(`  - Skipped: ${skipped}`)
    console.log(`  - Errors: ${errors}`)

    totalImported += imported
    totalSkipped += skipped
    totalErrors += errors
  }

  console.log('\n=== Migration Summary ===')
  console.log(`Total Imported: ${totalImported}`)
  console.log(`Total Skipped: ${totalSkipped}`)
  console.log(`Total Errors: ${totalErrors}`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  console.log('Rolling back Vitosha, Ilinden, Oborishte containers import...')

  const prefixes = ['RIL-%', 'ROB-%', 'RVI-%']
  let totalDeleted = 0

  for (const prefix of prefixes) {
    const containers = await payload.find({
      collection: 'waste-containers',
      where: {
        publicNumber: {
          like: prefix,
        },
      },
      limit: 10000,
    })

    for (const c of containers.docs) {
      await payload.delete({
        collection: 'waste-containers',
        id: c.id,
      })
    }

    console.log(`Deleted ${containers.docs.length} containers with prefix ${prefix}`)
    totalDeleted += containers.docs.length
  }

  console.log(`Total deleted: ${totalDeleted} containers`)
}