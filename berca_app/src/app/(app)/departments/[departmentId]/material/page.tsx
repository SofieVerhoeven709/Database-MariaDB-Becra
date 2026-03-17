import {getMaterials, getMaterialGroups, getUnits} from '@/dal/materials'
import {MaterialTable} from '@/components/custom/materialTable'
import {getDepartmentById} from '@/dal/department'
import {getSupplierCompanies} from '@/dal/companies'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function MaterialPage({params}: PageProps) {
  const {departmentId} = await params

  const [department, materials, groups, units, supplierCompanies] = await Promise.all([
    getDepartmentById(departmentId),
    getMaterials(),
    getMaterialGroups(),
    getUnits(),
    getSupplierCompanies(),
  ])

  if (!department) return <p>Department not found</p>

  const groupLabelById = new Map(
    groups.map(g => [g.id, [g.groupA, g.groupB, g.groupC, g.groupD].filter(Boolean).join(' / ')]),
  )

  const mappedMaterials = materials.map(m => ({
    id: m.id,
    beNumber: m.beNumber,
    name: m.name ?? null,
    brandOrderNr: m.brandOrderNr,
    shortDescription: m.shortDescription,
    longDescription: m.longDescription ?? null,
    preferredSupplierCompanyId: m.preferredSupplierCompanyId ?? null,
    preferredSupplierName: m.PreferredSupplierCompany?.name ?? null,
    supplierCompanyIds: m.MaterialSupplier.map(s => s.companyId),
    supplierCompanyNames: m.MaterialSupplier.map(s => s.Company.name),
    brandName: m.brandName ?? null,
    documentationPlace: m.documentationPlace ?? null,
    bePartDoc: m.bePartDoc ?? null,
    rejected: m.rejected ?? false,
    materialGroupId: m.materialGroupId,
    materialGroupLabel: groupLabelById.get(m.materialGroupId) ?? m.materialGroupId,
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

  const mappedSupplierCompanies = supplierCompanies.map(c => ({
    id: c.id,
    name: c.name,
    number: c.number,
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
        supplierCompanies={mappedSupplierCompanies}
        departmentId={departmentId}
      />
    </div>
  )
}
