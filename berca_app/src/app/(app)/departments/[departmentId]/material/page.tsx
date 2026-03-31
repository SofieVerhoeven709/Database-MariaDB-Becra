import {getMaterials, getMaterialGroups, getUnits} from '@/dal/materials'
import {getWarehousePlaces} from '@/dal/warehousePlace'
import {MaterialTable} from '@/components/custom/materialTable'
import {NonBeNumbersTable} from '@/components/custom/NonBeNumbersTable'
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/tabs'
import {getDepartmentById} from '@/dal/department'
import {getSupplierCompanies} from '@/dal/companies'
import type {MappedMaterial} from '@/types/material'

interface PageProps {
  params: Promise<{departmentId: string}>
}

function getParentBeNumbers(material: unknown): string[] {
  if (!material || typeof material !== 'object') return []

  const links = (material as {MaterialStructure_MaterialStructure_materialIdToMaterial?: unknown})
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

// Add this helper function above MaterialPage
function mappedParentPartOptions(materials: MappedMaterial[]) {
  return materials
    .filter(m => !m.deleted && m.beNumber && m.beNumber.length > 0)
    .map(m => ({
      beNumber: m.beNumber,
      shortDescription: m.shortDescription,
    }))
}

export default async function MaterialPage({params}: PageProps) {
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

  // Cast materials as any[] to avoid TS2339 errors about missing properties
  const mappedMaterials: MappedMaterial[] = (materials as any[]).map(m => {
    const materialSuppliers = Array.isArray(m.MaterialSupplier) ? m.MaterialSupplier : []
    const preferredSupplierEntry =
      materialSuppliers.find((s: any) => s.companyId === m.preferredSupplierCompanyId) ??
      materialSuppliers.find((s: any) => s.isPreferred) ??
      null
    const assignedWarehousePlace = warehousePlaceByBeNumber.get(m.beNumber ?? '') ?? null
    const unit = (m as any).Unit ?? {}
    const employee = (m as any).Employee ?? {}
    return {
      id: m.id,
      beNumber: m.beNumber ?? '',
      name: m.name ?? '',
      brandOrderNr: m.brandOrderNr ?? null,
      shortDescription: m.shortDescription ?? '',
      longDescription: m.longDescription ?? null,
      lotNumber: m.lotNumber ?? '',
      IOSNumber: m.IOSNumber ?? '',
      isSerialTracked: Array.isArray((m as any).MaterialSerialTrack) && (m as any).MaterialSerialTrack.length > 0,
      serialTrackedId:
        Array.isArray((m as any).MaterialSerialTrack) && (m as any).MaterialSerialTrack[0]?.id
          ? (m as any).MaterialSerialTrack[0].id
          : null,
      preferredSupplierCompanyId: m.preferredSupplierCompanyId ?? null,
      preferredSupplierCompanyName: (m as any).PreferredSupplierCompany?.name ?? null,
      preferredSupplierOrderId: preferredSupplierEntry?.supplierOrderNr ?? null,
      preferredSupplierShortDescription: null, // required for type, not used
      documentationPlace: null, // required for type, not used
      bePartDoc: null, // required for type, not used
      supplierCompanyIds: materialSuppliers.map((s: any) => s.companyId ?? '').filter(Boolean),
      supplierCompanyNames: materialSuppliers.map((s: any) => s.Company?.name ?? '').filter(Boolean),
      parentBeNumbers: getParentBeNumbers(m),
      brandName: m.brandName ?? null,
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
      unitId: m.unitId ?? '',
      unitName: unit.unitName ?? '',
      unitAbbreviation: unit.abbreviation ?? '',
      createdBy: m.createdBy ?? '',
      createdByName: employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : '',
      createdAt: null,
      deleted: m.deleted ?? false,
      deletedAt: m.deletedAt ? (typeof m.deletedAt === 'string' ? m.deletedAt : m.deletedAt.toISOString()) : null,
      deletedBy: m.deletedBy ?? null,
      isParentPart: false, // Added to satisfy MappedMaterial type
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
      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="mb-6 bg-secondary">
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="nonBeNumbers">Non BE Numbers</TabsTrigger>
        </TabsList>
        <TabsContent value="materials">
          <MaterialTable
            initialMaterials={mappedMaterials}
            materialGroups={mappedGroups}
            units={mappedUnits}
            supplierCompanies={mappedSupplierCompanies}
            departmentId={departmentId}
            parentPartOptions={mappedParentPartOptions(mappedMaterials)}
            warehousePlaces={mappedWarehousePlaces}
          />
        </TabsContent>
        <TabsContent value="nonBeNumbers">
          <NonBeNumbersTable
            materials={mappedMaterials
              .filter(m => !m.deleted && (!m.IOSNumber || m.IOSNumber.length === 0))
              .map(m => ({
                id: m.id,
                IOSNumber: m.IOSNumber ?? '',
                name: m.name ?? '',
                lotNumber: m.lotNumber ?? '',
                shortDescription: m.shortDescription ?? '',
                brandName: m.brandName ?? '',
              }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
