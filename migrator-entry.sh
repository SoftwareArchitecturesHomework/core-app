#!/bin/sh

pnpm exec prisma generate

# 1. Run migrations (only applies pending migrations)
echo "Running Prisma Migrations..."
pnpm exec prisma migrate deploy


# 2. If SEED_DB is set to "true", run the seeder
if [ "$SEED_DB" = "true" ]; then
	echo "Seeding Database..."
	pnpm exec tsx --tsconfig tsconfig.seed.json prisma/seed-runner.ts
fi

exit 0