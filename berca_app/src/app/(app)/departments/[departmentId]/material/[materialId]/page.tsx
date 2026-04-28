import {getMaterialById, getMaterialGroups, getUnits} from '@/dal/materials'
import {MaterialDetail} from '@/components/custom/materialDetail'
import {notFound} from 'next/navigation'
import {getSupplierCompanies} from '@/dal/companies'
import {getWarehousePlaces} from '@/dal/warehousePlace'
import type {WarehousePlaceOption} from '@/types/warehousePlace'

interface MaterialDetailPageProps {
  params: Promise<{materialId: string}>
}

export default async function MaterialDetailPage({params}: MaterialDetailPageProps) {
  const {materialId} = await params
  const [material, groups, units, supplierCompanies, warehousePlaces] = await Promise.all([
    getMaterialById(materialId).catch(() => null),
    getMaterialGroups(),
    getUnits(),
    getSupplierCompanies(),
    getWarehousePlaces(),
  ])

  if (!material) notFound()

  const groupById = new Map(groups.map((g: any) => [g.id, g]))

  const selectedSupplier = material.MaterialSupplier.find((s: any) => s.isPreferred) ?? material.MaterialSupplier[0] ?? null
  const supplierCompanyIds = material.MaterialSupplier.map((s: any) => s.companyId)
  const supplierCompanyNames = material.MaterialSupplier.map((s: any) => s.Company?.name).filter(Boolean)

  const createdByName = [material.Employee?.firstName, material.Employee?.lastName].filter(Boolean).join(' ').trim()
  const assignedWarehousePlace =
    warehousePlaces.find(place => place.beNumber && place.beNumber === material.beNumber)?.id ?? null

  const mappedMaterial = {
    id: material.id,
    beNumber: material.beNumber ?? '',
    name: material.name ?? null,
    brandOrderNr: material.brandOrderNr,
    shortDescription: material.shortDescription,
    longDescription: material.longDescription ?? null,
    supplierCompanyId: selectedSupplier?.companyId ?? material.preferredSupplierCompanyId ?? null,
    supplierCompanyName: selectedSupplier?.Company?.name ?? material.PreferredSupplierCompany?.name ?? null,
    supplierCompanyIds,
    supplierCompanyNames,
    brandName: material.brandName ?? null,
    warehousePlace: assignedWarehousePlace,
    rejected: material.rejected ?? false,
    partApproved: (material as any).partApproved ?? false,
    longLeadTime: material.longLeadTime ?? false,
    leadTimeValue: material.MaterialLeadTime?.leadTimeValue ?? null,
    leadTimeUnit: (material.MaterialLeadTime?.leadTimeUnit as 'days' | 'weeks' | 'months') ?? null,
    hasAtex: material.hasAtex ?? false,
    hasCe: material.hasCE ?? false,
    hasRohs: material.hasROHS ?? false,
    hasDs: material.hasDS ?? false,
    hasDoc: material.hasDoc ?? false,
    has3dCad: material.has3DCAD ?? false,
    has2dCad: material.has2DCAD ?? false,
    hasBdoc: material.hasBDOC ?? false,
    hasInsp: material.hasINSP ?? false,
    materialGroupIdA: material.materialGroupIdA ?? null,
    materialGroupIdB: material.materialGroupIdB ?? null,
    materialGroupIdC: material.materialGroupIdC ?? null,
    materialGroupIdD: material.materialGroupIdD ?? null,
    materialGroupLabelA: material.materialGroupIdA
      ? ((groupById.get(material.materialGroupIdA) as any)?.groupA ?? material.materialGroupIdA)
      : '',
    materialGroupLabelB: material.materialGroupIdB
      ? ((groupById.get(material.materialGroupIdB) as any)?.groupB ?? material.materialGroupIdB)
      : '',
    materialGroupLabelC: material.materialGroupIdC
      ? ((groupById.get(material.materialGroupIdC) as any)?.groupC ?? material.materialGroupIdC)
      : '',
    materialGroupLabelD: material.materialGroupIdD
      ? ((groupById.get(material.materialGroupIdD) as any)?.groupD ?? material.materialGroupIdD)
      : '',
    materialGroupLabel: [
      material.materialGroupIdA,
      material.materialGroupIdB,
      material.materialGroupIdC,
      material.materialGroupIdD,
    ]
      .filter(Boolean)
      .map(id => {
        const group = groupById.get(id as string) as
          | {groupA?: string; groupB?: string | null; groupC?: string | null; groupD?: string | null}
          | undefined
        if (!group) return id as string
        return [group.groupA, group.groupB, group.groupC, group.groupD].filter(Boolean).join(' / ')
      })
      .join(' | '),
    unitId: material.unitId,
    unitName: material.Unit.unitName,
    unitAbbreviation: material.Unit.abbreviation,
    createdBy: material.createdBy,
    createdByName,
    createdAt: material.Target?.createdAt?.toISOString() ?? null,
    deleted: material.deleted,
    deletedAt: material.deletedAt?.toISOString() ?? null,
    deletedBy: material.deletedBy ?? null,
    inventoryItems: material.Inventory_Inventory_materialIdToMaterial.map((inv: any) => ({
      id: inv.id,
      beNumber: inv.beNumber,
      place: inv.place ?? null,
      quantityInStock: inv.quantityInStock,
      minQuantityInStock: inv.minQuantityInStock,
      maxQuantityInStock: inv.maxQuantityInStock,
      serialNumber: inv.serialNumber ?? null,
      information: inv.information ?? null,
      valid: inv.valid,
      noValidDate: inv.noValidDate.toISOString(),
      inventoryStructures:
        inv.InventoryStructure?.map((structure: any) => ({
          id: structure.id,
          inventoryPlaceId: structure.inventoryPlaceId,
          place: structure.place ?? null,
          warehousePlaceId: structure.warehousePlaceId ?? null,
          information: structure.information ?? null,
          coordinate: structure.coordinate ?? false,
          inventoryId: structure.inventoryId,
          forInventory: structure.forInventory,
          forProject: structure.forProject,
          active: structure.active,
          materialActive: structure.materialActive,
          valid: structure.valid,
          createdAt: structure.createdAt.toISOString(),
          createdBy: structure.createdBy,
        })) ?? [],
    })),
    isSerialTracked: (material as any).isSerialTracked ?? false,
    serialTrackedId: (material as any).MaterialSerialTrack?.[0]?.id ?? null,
    parentBeNumbers:
      (material as any).MaterialStructure_MaterialStructure_materialIdToMaterial?.map((x: any) => x.beNumber) ?? [],
    isParentPart: ((material as any).MaterialStructure_MaterialStructure_materialIdToMaterial?.length ?? 0) > 0,
  }

  const mappedGroups = groups.map((g: any) => ({
    id: g.id,
    groupA: g.groupA,
    groupB: g.groupB ?? null,
    groupC: g.groupC ?? null,
    groupD: g.groupD ?? null,
  }))

  const mappedUnits = units.map((u: any) => ({
    id: u.id,
    unitName: u.unitName,
    abbreviation: u.abbreviation,
  }))

  const mappedSupplierCompanies = supplierCompanies.map((c: any) => ({
    id: c.id,
    name: c.name,
    number: c.number,
  }))

  const mappedWarehousePlaces: WarehousePlaceOption[] = warehousePlaces.map((place: any) => ({
    id: place.id,
    label: [place.abbreviation, place.place, place.shelf, place.column, place.layer, place.layerPlace]
      .filter(Boolean)
      .join(' - '),
    abbreviation: place.abbreviation ?? null,
    place: place.place ?? null,
    shelf: place.shelf ?? null,
    column: place.column ?? null,
    layer: place.layer ?? null,
    layerPlace: place.layerPlace ?? null,
  }))

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <MaterialDetail
        material={mappedMaterial}
        materialGroups={mappedGroups}
        units={mappedUnits}
        supplierCompanies={mappedSupplierCompanies}
        warehousePlaces={mappedWarehousePlaces}
      />
    </div>
  )
}
