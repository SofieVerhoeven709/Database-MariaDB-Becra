import {
  getMaterialGroups,
  getUnits,
  getMaterialPerformances,
  getMaterialSpecs,
  getMaterialFamilies,
} from '@/dal/materialSpecs'
import {MaterialSpecManager} from '@/components/custom/materialSpecManager'

export default async function SpecPage() {
  const [groups, units, performances, specs, families] = await Promise.all([
    getMaterialGroups(),
    getUnits(),
    getMaterialPerformances(),
    getMaterialSpecs(),
    getMaterialFamilies(),
  ])

  const mappedGroups = groups.map(g => ({
    id: g.id,
    name: g.groupA,
  }))

  const mappedUnits = units.map(u => ({
    id: u.id,
    unitName: u.unitName,
    physicalQuantity: u.physicalQuantity,
    abbreviation: u.abbreviation,
    shortDescription: u.shortDescription ?? null,
    longDescription: u.longDescription ?? null,
    valid: u.valid,
  }))

  const mappedPerformances = performances.map(p => ({
    id: p.id,
    name: p.name ?? '',
    materialSpecId: p.materialSpecId ?? null,
    materialFamilyId: p.materialFamilyId ?? null,
    shortDescription: p.shortDescription ?? null,
    longDescription: p.longDescription ?? null,
  }))

  const mappedSpecs = specs.map(s => ({
    id: s.id,
    name: s.name ?? null,
  }))

  const mappedFamilies = families.map(f => ({
    id: f.id,
    name: f.name ?? null,
  }))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Material Specifications</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage material groups, measurement units, and performance specifications.
        </p>
      </div>
      <MaterialSpecManager
        initialGroups={mappedGroups}
        initialUnits={mappedUnits}
        initialPerformances={mappedPerformances}
        specs={mappedSpecs}
        families={mappedFamilies}
      />
    </div>
  )
}
