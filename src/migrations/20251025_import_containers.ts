import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

interface LegacyContainer {
  id: string
  lat: number
  lng: number
  type: string | null
  source: string
  verified: boolean
  created_at: string
  updated_at: string
  is_collection_point: boolean
}

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  console.log('Starting waste containers import migration...')

  // Use __dirname for ESM compatibility
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const backupPath = path.join(__dirname, 'imports', 'containers.json')
  const containersData = JSON.parse(fs.readFileSync(backupPath, 'utf-8')) as LegacyContainer[]

  console.log(`Found ${containersData.length} containers to import`)

  let imported = 0
  let skipped = 0
  let errors = 0

  // Process containers in batches to avoid memory issues
  const batchSize = 50
  for (let i = 0; i < containersData.length; i += batchSize) {
    const batch = containersData.slice(i, i + batchSize)

    for (const container of batch) {
      try {
        // Map type: "Цветни" -> "recyclables", null -> "general"
        let wasteType: 'general' | 'recyclables' | 'organic' | 'glass' | 'paper' | 'plastic' | 'metal' = 'general'
        if (container.type?.startsWith('Цветни')) {
          wasteType = 'recyclables'
        }

        // Map source to valid enum value
        let source: 'community' | 'official' | 'third_party' = 'community'
        if (container.source === 'official') {
          source = 'official'
        } else if (container.source === 'third_party') {
          source = 'third_party'
        }

        // Generate public number from index
        const publicNumber = `SOF-${String(imported + 1).padStart(4, '0')}`

        await payload.create({
          collection: 'waste-containers',
          data: {
            legacyId: container.id,
            publicNumber,
            location: {
              latitude: container.lat,
              longitude: container.lng,
            },
            capacityVolume: 3, // Default 3m³ as specified
            capacitySize: container.is_collection_point ? 'industrial' : 'standard', // Industrial for collection points, Standard otherwise
            wasteType,
            source,
            status: 'active',
            notes: container.is_collection_point
              ? 'Originally marked as collection point'
              : undefined,
          },
        })

        imported++

        if (imported % 50 === 0) {
          console.log(`Imported ${imported} containers...`)
        }
      } catch (error) {
        console.error(`Error importing container ${container.id}:`, error)
        errors++
      }
    }
  }

  console.log(`Migration completed:`)
  console.log(`  - Imported: ${imported}`)
  console.log(`  - Skipped: ${skipped}`)
  console.log(`  - Errors: ${errors}`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  console.log('Rolling back waste containers import...')

  // Delete all containers with publicNumber starting with SOF-
  const containers = await payload.find({
    collection: 'waste-containers',
    where: {
      publicNumber: {
        like: 'SOF-%',
      },
    },
    limit: 1000,
  })

  for (const container of containers.docs) {
    await payload.delete({
      collection: 'waste-containers',
      id: container.id,
    })
  }

  console.log(`Deleted ${containers.docs.length} containers`)
}
