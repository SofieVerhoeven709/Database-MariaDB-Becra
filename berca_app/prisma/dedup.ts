import {PrismaClient} from '@/generated/prisma/client'

const client = new PrismaClient()

async function main() {
  // Deduplicate Units
  const units = await client.unit.findMany({where: {deleted: false}, orderBy: {createdAt: 'asc'}})
  console.log('Total units before dedup:', units.length)
  const seenUnits = new Map<string, string>()
  for (const u of units) {
    const key = `${u.unitName}|${u.abbreviation}`
    if (seenUnits.has(key)) {
      await client.unit.update({where: {id: u.id}, data: {deleted: true, deletedAt: new Date()}})
      console.log('Removed duplicate unit:', u.unitName, u.abbreviation)
    } else {
      seenUnits.set(key, u.id)
    }
  }

  // Deduplicate MaterialGroups
  const groups = await client.materialGroup.findMany({where: {deleted: false}, orderBy: {groupA: 'asc'}})
  console.log('Total material groups before dedup:', groups.length)
  const seenGroups = new Map<string, string>()
  for (const g of groups) {
    const key = `${g.groupA}|${g.groupB ?? ''}|${g.groupC ?? ''}|${g.groupD ?? ''}`
    if (seenGroups.has(key)) {
      await client.materialGroup.update({where: {id: g.id}, data: {deleted: true, deletedAt: new Date()}})
      console.log('Removed duplicate group:', g.groupA, g.groupB)
    } else {
      seenGroups.set(key, g.id)
    }
  }

  const remainingUnits = await client.unit.count({where: {deleted: false}})
  const remainingGroups = await client.materialGroup.count({where: {deleted: false}})
  console.log('Remaining units:', remainingUnits)
  console.log('Remaining groups:', remainingGroups)
  await client.$disconnect()
}

main().catch(async e => {
  console.error(e)
  await client.$disconnect()
  process.exit(1)
})
