import 'dotenv/config'
import {PrismaClient} from '@/generated/prisma/client'

const p = new PrismaClient()

async function main() {
  const groups = await p.materialGroup.findMany({orderBy: {groupA: 'asc'}})
  console.log(`Total MaterialGroups: ${groups.length}`)
  for (const g of groups) {
    const label = [g.groupA, g.groupB, g.groupC, g.groupD].filter(Boolean).join(' / ')
    console.log(`  [${g.deleted ? 'DELETED' : 'ACTIVE '}] ${g.id.slice(0, 8)}… ${label}`)
  }

  const units = await p.unit.findMany({orderBy: {unitName: 'asc'}})
  console.log(`\nTotal Units: ${units.length}`)
  for (const u of units) {
    console.log(`  [${u.deleted ? 'DELETED' : 'ACTIVE '}] ${u.id.slice(0, 8)}… ${u.unitName} (${u.abbreviation})`)
  }
}

main().finally(() => p.$disconnect())
