import { defineNitroPlugin } from 'nitropack/runtime';
import { cleanup, seed } from '../../prisma/seed'; 

export default defineNitroPlugin(async (nitroApp) => {
    if (process.env.NODE_ENV !== 'development') {
        return;
    }

    console.log('[Nuxt Server Startup] Running Development Data Seeding...');

    try {
        await cleanup(); 
        await seed(); 
    } catch (error) {
        console.error('FATAL: Database seeding failed on startup.', error);
    }

    nitroApp.hooks.hook('close', async () => {
        console.log('[Nuxt Server Shutdown] Executing cleanup hook...');
        try {
            await cleanup();
            console.log('Shutdown cleanup finished (Mock data deleted).');
        } catch (error) {
            console.error('Warning: Shutdown cleanup failed.', error);
        }
    });
});