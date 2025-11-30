import { defineNitroPlugin } from 'nitropack/runtime'
import { cleanup, seed } from '~~/prisma/seed'

// Global flag to track if seeding has already run in this process
let hasSeeded = false

export default defineNitroPlugin(async (nitroApp) => {
  // Only seed once per process (not on every hot reload)
  if (hasSeeded) {
    console.info('[Nuxt Server Startup] Skipping seed - already seeded in this process')
    return
  }

  console.info('[Nuxt Server Startup] Running Development Data Seeding...')

  try {
    await cleanup()
    await seed()
    hasSeeded = true
    console.info('Database seeding completed.')
  } catch (error) {
    console.error('FATAL: Database seeding failed on startup.', error)
  }

  nitroApp.hooks.hook('close', async () => {
    console.info('[Nuxt Server Shutdown] Executing cleanup hook...')
    try {
      await cleanup()
      console.info('Shutdown cleanup finished (Mock data deleted).')
    } catch (error) {
      console.error('Warning: Shutdown cleanup failed.', error)
    }
  })
})
