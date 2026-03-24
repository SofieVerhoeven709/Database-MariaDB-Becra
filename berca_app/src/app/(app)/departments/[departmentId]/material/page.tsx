import {getMaterials, getMaterialGroups, getUnits} from '@/dal/materials'
import {getWarehousePlaces} from '@/dal/warehousePlace'
import {MaterialTable} from '@/components/custom/materialTable'
import {getDepartmentById} from '@/dal/department'
import {getSupplierCompanies} from '@/dal/companies'
import type {MappedMaterial} from '@/types/material'

interface PageProps {
  params: Promise<{departmentId: string}>
}

function getParentBeNumbers(material: unknown): string[] {
  if (!material || typeof material !== 'object') return []

  const links =
    (material as {MaterialStructure_MaterialStructure_materialIdToMaterial?: unknown})
      .MaterialStructure_MaterialStructure_materialIdToMaterial
  if (!Array.isArray(links)) return []

  return links
    .map(link => {
      if (!link || typeof link !== 'object') return null
      const beNumber = (link as {beNumber?: unknown}).beNumber
      return typeof beNumber === 'string' ? beNumber : null
    })
    .filter((value): value is string => value !== null)
}

export default async function MaterialPage({params}: PageProps) {
  const parseBePartDoc = (value: string | null) => {
    if (value == null || value === '') return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  const {departmentId} = await params

  const [department, materials, groups, units, supplierCompanies, warehousePlaces] = await Promise.all([
    getDepartmentById(departmentId),
    getMaterials({includeDeleted: true}),
    getMaterialGroups(),
    getUnits(),
    getSupplierCompanies(),
    getWarehousePlaces(),
  ])

  if (!department) return <p>Department not found</p>

  const groupById = new Map(groups.map(g => [g.id, g]))
  const warehousePlaceByBeNumber = new Map(
    warehousePlaces
      .filter(place => place.beNumber)
      .map(place => [
        place.beNumber as string,
        {
          id: place.id,
          label: place.place ? `${place.abbreviation} (${place.place})` : place.abbreviation,
        },
      ]),
  )

  const mappedMaterials: MappedMaterial[] = materials.map(m => {
    const preferredSupplierEntry =
      m.MaterialSupplier.find(s => s.companyId === m.preferredSupplierCompanyId) ??
      m.MaterialSupplier.find(s => s.isPreferred) ??
      null
    const assignedWarehousePlace = warehousePlaceByBeNumber.get(m.beNumber) ?? null

    return {
      id: m.id,
      beNumber: m.beNumber,
      name: m.name ?? null,
      brandOrderNr: m.brandOrderNr,
      shortDescription: m.shortDescription,
      longDescription: m.longDescription ?? null,
      preferredSupplierCompanyId: m.preferredSupplierCompanyId ?? null,
      preferredSupplierCompanyName: m.PreferredSupplierCompany?.name ?? null,
      preferredSupplierOrderId: preferredSupplierEntry?.supplierOrderNr ?? null,
      preferredSupplierShortDescription: preferredSupplierEntry?.shortDescription ?? null,
      supplierCompanyIds: m.MaterialSupplier.map(s => s.companyId),
      supplierCompanyNames: m.MaterialSupplier.map(s => s.Company.name),
      parentBeNumbers: getParentBeNumbers(m),
      brandName: m.brandName ?? null,
      documentationPlace: m.documentationPlace ?? null,
      bePartDoc: parseBePartDoc(m.bePartDoc),
      rejected: m.rejected ?? false,
      materialGroupIdA: m.materialGroupIdA ?? null,
      materialGroupIdB: m.materialGroupIdB ?? null,
      materialGroupIdC: m.materialGroupIdC ?? null,
      materialGroupIdD: m.materialGroupIdD ?? null,
      materialGroupLabelA: m.materialGroupIdA ? (groupById.get(m.materialGroupIdA)?.groupA ?? m.materialGroupIdA) : '',
      materialGroupLabelB: m.materialGroupIdB ? (groupById.get(m.materialGroupIdB)?.groupB ?? m.materialGroupIdB) : '',
      materialGroupLabelC: m.materialGroupIdC ? (groupById.get(m.materialGroupIdC)?.groupC ?? m.materialGroupIdC) : '',
      materialGroupLabelD: m.materialGroupIdD ? (groupById.get(m.materialGroupIdD)?.groupD ?? m.materialGroupIdD) : '',
      materialGroupLabel: [m.materialGroupIdA, m.materialGroupIdB, m.materialGroupIdC, m.materialGroupIdD]
        .filter(Boolean)
        .map(id => {
          const group = groupById.get(id as string)
          if (!group) return id as string
          return [group.groupA, group.groupB, group.groupC, group.groupD].filter(Boolean).join(' / ')
        })
        .join(' | '),
      warehousePlaceId: assignedWarehousePlace?.id ?? null,
      warehousePlaceLabel: assignedWarehousePlace?.label ?? null,
      unitId: m.unitId,
      unitName: m.Unit.unitName,
      unitAbbreviation: m.Unit.abbreviation,
      createdBy: m.createdBy,
      createdByName: `${m.Employee.firstName} ${m.Employee.lastName}`,
      createdAt: null,
      deleted: m.deleted,
      deletedAt: m.deletedAt?.toISOString() ?? null,
      deletedBy: m.deletedBy ?? null,
    }
  })

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

  const mappedParentPartOptions = materials
    .filter(m => !m.deleted)
    .filter(m => typeof m.beNumber === 'string' && m.beNumber.length > 0)
    .map(m => ({
      beNumber: m.beNumber,
      shortDescription: m.shortDescription,
    }))

  const mappedWarehousePlaces = warehousePlaces.map(place => ({
    id: place.id,
    label: place.place ? `${place.abbreviation} (${place.place})` : place.abbreviation,
    beNumber: place.beNumber ?? null,
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
        parentPartOptions={mappedParentPartOptions}
        warehousePlaces={mappedWarehousePlaces}
      />
    </div>
  )
}
