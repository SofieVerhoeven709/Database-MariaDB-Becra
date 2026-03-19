import {getMaterials, getMaterialGroups, getUnits} from '@/dal/materials'
import {MaterialTable} from '@/components/custom/materialTable'
import {getDepartmentById} from '@/dal/department'
import {getSupplierCompanies} from '@/dal/companies'

interface PageProps {
  params: Promise<{departmentId: string}>
}

export default async function MaterialPage({params}: PageProps) {
      const parseBePartDoc = (value: string | null) => {
        if (value == null || value === '') return null
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : null
      }

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
    preferredSupplierCompanyName: m.PreferredSupplierCompany?.name ?? null,
    preferredSupplierOrderId: m.preferredSupplierOrderId ?? null,
    preferredSupplierShortDescription: m.preferredSupplierShortDescription ?? null,
    supplierCompanyIds: m.MaterialSupplier.map(s => s.companyId),
    supplierCompanyNames: m.MaterialSupplier.map(s => s.Company.name),
    brandName: m.brandName ?? null,
    documentationPlace: m.documentationPlace ?? null,
    bePartDoc: parseBePartDoc(m.bePartDoc),
    rejected: m.rejected ?? false,
    materialGroupIdA: m.materialGroupIdA ?? null,
    materialGroupIdB: m.materialGroupIdB ?? null,
    materialGroupIdC: m.materialGroupIdC ?? null,
    materialGroupIdD: m.materialGroupIdD ?? null,
    materialGroupLabelA: m.materialGroupIdA ? (groupLabelById.get(m.materialGroupIdA) ?? m.materialGroupIdA) : '',
    materialGroupLabelB: m.materialGroupIdB ? (groupLabelById.get(m.materialGroupIdB) ?? m.materialGroupIdB) : '',
    materialGroupLabelC: m.materialGroupIdC ? (groupLabelById.get(m.materialGroupIdC) ?? m.materialGroupIdC) : '',
    materialGroupLabelD: m.materialGroupIdD ? (groupLabelById.get(m.materialGroupIdD) ?? m.materialGroupIdD) : '',
    materialGroupLabel: [m.materialGroupIdA, m.materialGroupIdB, m.materialGroupIdC, m.materialGroupIdD]
      .filter(Boolean)
      .map(id => groupLabelById.get(id as string) ?? id)
      .join(' | '),
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
