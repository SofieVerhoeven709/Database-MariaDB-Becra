import {getMaterialById, getMaterialGroups, getUnits} from '@/dal/materials'
import {MaterialDetail} from '@/components/custom/materialDetail'
import {notFound} from 'next/navigation'
import {getSupplierCompanies} from '@/dal/companies'
import {getSerialTrackedStructureBySerialTrackedId} from '@/dal/materialSerialTrackedStructure'
import {getWarehousePlaces} from '@/dal/warehousePlace'

interface MaterialDetailPageProps {
  params: Promise<{materialId: string}>
}

export default async function MaterialDetailPage({params}: MaterialDetailPageProps) {
  const parseBePartDoc = (value: string | null) => {
    if (value == null || value === '') return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  const {materialId} = await params
  const [material, groups, units, supplierCompanies, warehousePlaces] = await Promise.all([
    getMaterialById(materialId).catch(() => null),
    getMaterialGroups(),
    getUnits(),
    getSupplierCompanies(),
    getWarehousePlaces(),
  ])

  if (!material) notFound()

  // Fetch serial tracked structure if serialTrackedId exists
  const serialTrackedId = (material as any).MaterialSerialTrack?.[0]?.id ?? null
  const [serialTrackedStructure] = await Promise.all([
    serialTrackedId ? getSerialTrackedStructureBySerialTrackedId(serialTrackedId) : [],
  ])

  const groupById = new Map(groups.map((g: any) => [g.id, g]))

  const preferredSupplierEntry =
    material.MaterialSupplier.find((s: any) => s.companyId === material.preferredSupplierCompanyId) ??
    material.MaterialSupplier.find((s: any) => s.isPreferred) ??
    null

  const mappedMaterial = {
    id: material.id,
    beNumber: material.beNumber ?? '',
    name: material.name ?? null,
    brandOrderNr: material.brandOrderNr,
    shortDescription: material.shortDescription,
    longDescription: material.longDescription ?? null,
    preferredSupplierCompanyId: material.preferredSupplierCompanyId ?? null,
    preferredSupplierCompanyName: material.PreferredSupplierCompany?.name ?? null,
    preferredSupplierOrderId: preferredSupplierEntry?.supplierOrderNr ?? null,
    preferredSupplierShortDescription: preferredSupplierEntry?.shortDescription ?? null,
    supplierCompanyIds: material.MaterialSupplier.map((s: any) => s.companyId),
    supplierCompanyNames: material.MaterialSupplier.map((s: any) => s.Company.name),
    brandName: material.brandName ?? null,
    documentationPlace: material.documentationPlace ?? null,
    bePartDoc: parseBePartDoc(material.bePartDoc),
    rejected: material.rejected ?? false,
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
    createdByName: '', // No relation available; would require separate lookup
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

  const mappedWarehousePlaces = warehousePlaces.map((place: any) => ({
    id: place.id,
    label: [place.abbreviation, place.place, place.shelf, place.column, place.layer, place.layerPlace]
      .filter(Boolean)
      .join(' - '),
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
