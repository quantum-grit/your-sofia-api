import { getPayload } from 'payload'
import config from '../payload.config'
import { seedWasteContainers } from '../utilities/seedWasteContainers'

/**
 * Seed script for waste containers
 * Run with: pnpm seed:waste-containers
 */
async function seed() {
  try {
    console.log('🚀 Starting seed process...\n')

    const payload = await getPayload({ config })

    await seedWasteContainers(payload)

    console.log('\n🎉 Seed process completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seed process failed:', error)
    process.exit(1)
  }
}

seed()
