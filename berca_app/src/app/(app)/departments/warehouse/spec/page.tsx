import {getMaterialGroups, getUnits} from '@/dal/materialSpecs'
import {MaterialSpecManager} from '@/components/custom/materialSpecManager'

export default async function SpecPage() {
  const [groups, units] = await Promise.all([getMaterialGroups(), getUnits()])

  const mappedGroups = groups.map(g => ({
    id: g.id,
    groupA: g.groupA,
    groupB: g.groupB ?? null,
    groupC: g.groupC ?? null,
    groupD: g.groupD ?? null,
  }))

  const mappedUnits = units.map(u => ({
    id: u.id,
    unit: u.unit,
    physicalQuantity: u.physicalQuantity,
    abbreviation: u.abbreviation,
    shortDescription: u.shortDescription ?? null,
    longDescription: u.longDescription ?? null,
    valid: u.valid,
  }))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Material Specifications</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage material groups and measurement units.</p>
      </div>
      <MaterialSpecManager initialGroups={mappedGroups} initialUnits={mappedUnits} />
    </div>
  )
}
