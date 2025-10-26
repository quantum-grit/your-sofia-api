import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import * as fs from 'fs'
import * as path from 'path'

interface LegacyVote {
  vote_type: 'full' | 'empty' | 'broken' | 'dirty' | 'ready_for_collection'
  dumpster_id: string
  created_at: string
}

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  console.log('Starting votes import migration...')

  // Read the backup JSON file
  const backupPath = path.join(process.cwd(), 'backups', 'votes.json')
  const votesData = JSON.parse(fs.readFileSync(backupPath, 'utf-8')) as LegacyVote[]

  console.log(`Found ${votesData.length} votes to import`)

  let imported = 0
  let skipped = 0
  let errors = 0

  // Process votes in batches to avoid memory issues
  const batchSize = 50
  for (let i = 0; i < votesData.length; i += batchSize) {
    const batch = votesData.slice(i, i + batchSize)

    for (const vote of batch) {
      try {
        // Find the waste container by legacy ID
        const containers = await payload.find({
          collection: 'waste-containers',
          where: {
            legacyId: {
              equals: vote.dumpster_id,
            },
          },
          limit: 1,
        })

        if (containers.docs.length === 0) {
          console.warn(`Container with legacy ID ${vote.dumpster_id} not found, skipping vote`)
          skipped++
          continue
        }

        const container = containers.docs[0]
        if (!container) {
          skipped++
          continue
        }

        // Map vote_type to containerState
        let containerState: ('full' | 'dirty' | 'damaged' | 'empty' | 'forCollection' | 'broken')[]
        switch (vote.vote_type) {
          case 'full':
            containerState = ['full']
            break
          case 'empty':
            containerState = ['empty']
            break
          case 'broken':
            containerState = ['broken']
            break
          case 'dirty':
            containerState = ['dirty']
            break
          case 'ready_for_collection':
            containerState = ['forCollection']
            break
          default:
            console.warn(`Unknown vote_type: ${vote.vote_type}`)
            containerState = ['full']
        }

        // Create signal from vote
        await payload.create({
          collection: 'signals',
          data: {
            title: `Контейнер ${vote.vote_type === 'full' ? 'пълен' : vote.vote_type === 'empty' ? 'празен' : vote.vote_type === 'broken' ? 'счупен' : 'мръсен'}`,
            category: 'waste-container',
            cityObject: {
              type: 'waste-container',
              referenceId: container.publicNumber,
              name: `Container ${container.publicNumber}`,
            },
            containerState,
            reporterUniqueId: crypto.randomUUID(), // Generate new UUID for anonymous reporter
            status: 'pending',
            createdAt: vote.created_at,
            updatedAt: vote.created_at,
          },
        })

        imported++
      } catch (error) {
        console.error(`Error importing vote for container ${vote.dumpster_id}:`, error)
        errors++
      }
    }

    // Log progress every batch
    console.log(`Progress: ${i + batch.length}/${votesData.length} processed`)
  }

  console.log('Import completed!')
  console.log(`Imported: ${imported}, Skipped: ${skipped}, Errors: ${errors}`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  console.log('Rolling back votes import...')

  // Delete all signals that were created from votes
  // We can identify them by having a categoryObject.type of 'waste-container'
  // and being created within a specific timeframe
  const result = await payload.delete({
    collection: 'signals',
    where: {
      and: [
        {
          category: {
            equals: 'waste-container',
          },
        },
        {
          'cityObject.type': {
            equals: 'waste-container',
          },
        },
      ],
    },
  })

  console.log(`Rollback completed. Deleted signals.`)
}
