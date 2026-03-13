import {getMaterials, getMaterialGroups, getUnits} from '@/dal/materials'
import {MaterialTable} from '@/components/custom/materialTable'
import {getDepartmentById} from '@/dal/department'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function MaterialPage({params}: PageProps) {
  const {departmentId} = await params

  const [department, materials, groups, units] = await Promise.all([
    getDepartmentById(departmentId),
    getMaterials(),
    getMaterialGroups(),
    getUnits(),
  ])

  if (!department) return <p>Department not found</p>

  const mappedMaterials = materials.map(m => ({
    id: m.id,
    beNumber: m.beNumber,
    name: m.name ?? null,
    brandOrderNr: m.brandOrderNr,
    shortDescription: m.shortDescription,
    longDescription: m.longDescription ?? null,
    preferredSupplier: m.preferredSupplier ?? null,
    brandName: m.brandName ?? null,
    documentationPlace: m.documentationPlace ?? null,
    bePartDoc: m.bePartDoc ?? null,
    rejected: m.rejected ?? false,
    materialGroupId: m.materialGroupId,
    materialGroupLabel: [m.MaterialGroup.groupA, m.MaterialGroup.groupB, m.MaterialGroup.groupC, m.MaterialGroup.groupD]
      .filter(Boolean)
      .join(' / '),
    unitId: m.unitId,
    unitName: m.Unit.unitName,
    unitAbbreviation: m.Unit.abbreviation,
    createdBy: m.createdBy,
    createdByName: `${m.Employee.firstName} ${m.Employee.lastName}`,
    deleted: m.deleted,
    deletedAt: m.deletedAt?.toISOString() ?? null,
    deletedBy: m.deletedBy ?? null,
  }))

  const mappedGroups = groups.map(g => ({
    id: g.id,
    groupA: g.groupA,
    groupB: g.groupB ?? null,
    groupC: g.groupC ?? null,
    groupD: g.groupD ?? null,
  }))

  const mappedUnits = units.map(u => ({
    id: u.id,
    unitName: u.unitName,
    abbreviation: u.abbreviation,
  }))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Materials</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage engineering materials, components, and their specifications.
        </p>
      </div>
      <MaterialTable
        initialMaterials={mappedMaterials}
        materialGroups={mappedGroups}
        units={mappedUnits}
      />
    </div>
  )
}
