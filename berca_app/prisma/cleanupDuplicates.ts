/**
 * One-time cleanup script: removes duplicate MaterialGroups and Units
 * (including soft-deleted ones that were re-created by repeated seed runs).
 *
 * Safe to run multiple times – it is idempotent.
 *
 * Run with:
 *   pnpm run prisma:cleanup
 */
import 'dotenv/config'
import {PrismaClient} from '@/generated/prisma/client'

const prisma = new PrismaClient()

async function deduplicateMaterialGroups() {
  console.log('\n── MaterialGroups ──────────────────────────────────')
  const all = await prisma.materialGroup.findMany({orderBy: {groupA: 'asc'}})

  // Group by the four classification fields (regardless of deleted flag)
  const map = new Map<string, typeof all>()
  for (const g of all) {
    const key = [g.groupA, g.groupB ?? '', g.groupC ?? '', g.groupD ?? ''].join('|')
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(g)
  }

  let removed = 0
  for (const [key, groups] of map.entries()) {
    if (groups.length <= 1) continue

    // Prefer keeping an active (non-deleted) record as the keeper
    const active = groups.filter(g => !g.deleted)
    const keep = active.length > 0 ? active[0] : groups[0]
    const dupes = groups.filter(g => g.id !== keep.id)

    console.log(`  Keeping  ${keep.id.slice(0, 8)}… [${keep.deleted ? 'DELETED' : 'ACTIVE '}] (${key})`)

    for (const dupe of dupes) {
      console.log(`  Removing ${dupe.id.slice(0, 8)}… [${dupe.deleted ? 'DELETED' : 'ACTIVE '}]`)

      // Re-point all child records to the keeper before deleting
      const m = await prisma.material.updateMany({where: {materialGroupId: dupe.id}, data: {materialGroupId: keep.id}})
      if (m.count) console.log(`    → Moved ${m.count} Material(s)`)

      await prisma.materialSerialTrack.updateMany({where: {materialGroupId: dupe.id}, data: {materialGroupId: keep.id}})
      await prisma.materialSerialTrackedStructure.updateMany({
        where: {materialGroupId: dupe.id},
        data: {materialGroupId: keep.id},
      })
      await prisma.purchase.updateMany({where: {materialGroupId: dupe.id}, data: {materialGroupId: keep.id}})

      await prisma.materialGroup.delete({where: {id: dupe.id}})
      removed++
    }
  }
  console.log(`  Done – removed ${removed} duplicate(s)`)
}

async function deduplicateUnits() {
  console.log('\n── Units ───────────────────────────────────────────')
  const all = await prisma.unit.findMany({orderBy: {unitName: 'asc'}})

  // Group by unitName + abbreviation (regardless of deleted flag)
  const map = new Map<string, typeof all>()
  for (const u of all) {
    const key = `${u.unitName}|${u.abbreviation}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(u)
  }

  let removed = 0
  for (const [key, units] of map.entries()) {
    if (units.length <= 1) continue

    // Prefer keeping an active (non-deleted) record
    const active = units.filter(u => !u.deleted)
    const keep = active.length > 0 ? active[0] : units[0]
    const dupes = units.filter(u => u.id !== keep.id)

    console.log(`  Keeping  ${keep.id.slice(0, 8)}… [${keep.deleted ? 'DELETED' : 'ACTIVE '}] (${key})`)

    for (const dupe of dupes) {
      console.log(`  Removing ${dupe.id.slice(0, 8)}… [${dupe.deleted ? 'DELETED' : 'ACTIVE '}]`)

      const m = await prisma.material.updateMany({where: {unitId: dupe.id}, data: {unitId: keep.id}})
      if (m.count) console.log(`    → Moved ${m.count} Material(s)`)

      await prisma.materialSpec.updateMany({where: {unitId: dupe.id}, data: {unitId: keep.id}})

      await prisma.unit.delete({where: {id: dupe.id}})
      removed++
    }
  }
  console.log(`  Done – removed ${removed} duplicate(s)`)
}

async function removeOrphanedSoftDeleted() {
  console.log('\n── Orphaned soft-deleted records ───────────────────')

  // Find all active Units (not deleted) to use as reassignment targets
  const activeUnits = await prisma.unit.findMany({where: {deleted: false}})
  const fallbackUnit = activeUnits[0] // use the first active unit as fallback

  // Hard-delete soft-deleted Units
  const deletedUnits = await prisma.unit.findMany({where: {deleted: true}})
  let removedUnits = 0
  for (const u of deletedUnits) {
    // Move any Materials still pointing at this unit to a fallback active unit
    if (fallbackUnit) {
      const moved = await prisma.material.updateMany({
        where: {unitId: u.id},
        data: {unitId: fallbackUnit.id},
      })
      if (moved.count > 0)
        console.log(`  Moved ${moved.count} Material(s) from deleted Unit "${u.unitName}" → "${fallbackUnit.unitName}"`)

      await prisma.materialSpec.updateMany({
        where: {unitId: u.id},
        data: {unitId: fallbackUnit.id},
      })
    }
    await prisma.unit.delete({where: {id: u.id}})
    console.log(`  Deleted orphaned Unit: ${u.unitName} (${u.abbreviation})`)
    removedUnits++
  }

  // Hard-delete soft-deleted MaterialGroups that no record references
  const deletedGroups = await prisma.materialGroup.findMany({where: {deleted: true}})
  let removedGroups = 0
  for (const g of deletedGroups) {
    const matCount = await prisma.material.count({where: {materialGroupId: g.id}})
    const trackCount = await prisma.materialSerialTrack.count({where: {materialGroupId: g.id}})
    const structCount = await prisma.materialSerialTrackedStructure.count({where: {materialGroupId: g.id}})
    const purchaseCount = await prisma.purchase.count({where: {materialGroupId: g.id}})
    if (matCount === 0 && trackCount === 0 && structCount === 0 && purchaseCount === 0) {
      await prisma.materialGroup.delete({where: {id: g.id}})
      const label = [g.groupA, g.groupB, g.groupC, g.groupD].filter(Boolean).join(' / ')
      console.log(`  Deleted orphaned MaterialGroup: ${label}`)
      removedGroups++
    } else {
      console.log(`  Skipped MaterialGroup ${g.groupA} – still referenced by ${matCount} Material(s)`)
    }
  }

  console.log(`  Done – removed ${removedUnits} orphaned Unit(s) and ${removedGroups} orphaned MaterialGroup(s)`)
}

async function main() {
  console.log('Starting duplicate cleanup…')
  await deduplicateMaterialGroups()
  await deduplicateUnits()
  await removeOrphanedSoftDeleted()
  console.log('\nAll done!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
