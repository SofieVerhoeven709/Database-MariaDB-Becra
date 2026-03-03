/**
 * Wipes all seeded MaterialGroups, Units, and Materials from the database
 * so you can start fresh from the frontend.
 *
 * Run with:  pnpm run prisma:wipe
 */
import 'dotenv/config'
import {PrismaClient} from '@/generated/prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Wiping seeded material data…')

  // Must delete Materials first (they reference MaterialGroup + Unit)
  const mats = await prisma.material.deleteMany({})
  console.log(`  Deleted ${mats.count} Material(s)`)

  const groups = await prisma.materialGroup.deleteMany({})
  console.log(`  Deleted ${groups.count} MaterialGroup(s)`)

  const units = await prisma.unit.deleteMany({})
  console.log(`  Deleted ${units.count} Unit(s)`)

  console.log('Done – database is now clean. Add your data from the frontend.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
