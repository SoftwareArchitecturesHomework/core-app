import { PrismaClient } from '../app/generated/prisma/client'

const prismaClientSingleton = (() => {
    let instance: PrismaClient | undefined;

    return () => {
        if (!instance) {
            instance = new PrismaClient();
        }
        return instance;
    };
})();