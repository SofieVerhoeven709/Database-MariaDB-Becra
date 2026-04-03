#!/bin/bash
set -e

# Optional: wait a few seconds for the DB to be ready
echo "Waiting 5 seconds for database..."
sleep 5

# Ensure production DB schema has the Material.warehousePlaceId column and FK.
echo "Applying database hotfixes..."
pnpm exec prisma db execute --schema prisma/schema.prisma --file prisma/hotfix_material_warehousePlaceId.sql

# Run Prisma seed using runtime environment variables
echo "Seeding database..."
pnpm run prisma:seed

# Start Next.js server
echo "Starting backend..."
pnpm run start