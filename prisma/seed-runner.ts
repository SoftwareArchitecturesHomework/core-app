import { cleanup, seed } from './seed'

async function main() {
  try {
    console.log('[SEED-RUNNER] Starting database seed...')
    await cleanup()
    console.log('[SEED-RUNNER] cleanup finished starting seed...')
    await seed()
    console.log('[SEED-RUNNER] Seed completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('[SEED-RUNNER] Seed error:', error)
    process.exit(1)
  }
}

main()
