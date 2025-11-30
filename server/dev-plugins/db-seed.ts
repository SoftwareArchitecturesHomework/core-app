import { defineNitroPlugin } from 'nitropack/runtime'
import { cleanup, seed } from '~~/prisma/seed'

export default defineNitroPlugin(async (nitroApp) => {
  console.info('[Nuxt Server Startup] Running Development Data Seeding...')

  try {
    await cleanup()
    await seed()
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
