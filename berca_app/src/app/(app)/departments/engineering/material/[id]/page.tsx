import {getMaterialById, getMaterialGroups, getUnits} from '@/dal/materials'
import {MaterialDetail} from '@/components/custom/materialDetail'
import {notFound} from 'next/navigation'

interface MaterialDetailPageProps {
  params: Promise<{id: string}>
}

export default async function MaterialDetailPage({params}: MaterialDetailPageProps) {
  const {id} = await params
  const [material, groups, units] = await Promise.all([
    getMaterialById(id).catch(() => null),
    getMaterialGroups(),
    getUnits(),
  ])

  if (!material) notFound()

  const mappedMaterial = {
    id: material.id,
    beNumber: material.beNumber,
    name: material.name ?? null,
    brandOrderNr: material.brandOrderNr,
    shortDescription: material.shortDescription,
    longDescription: material.longDescription ?? null,
    preferredSupplier: material.preferredSupplier ?? null,
    brandName: material.brandName ?? null,
    documentationPlace: material.documentationPlace ?? null,
    bePartDoc: material.bePartDoc ?? null,
    rejected: material.rejected ?? false,
    materialGroupId: material.materialGroupId,
    materialGroupLabel: [
      material.MaterialGroup.groupA,
      material.MaterialGroup.groupB,
      material.MaterialGroup.groupC,
      material.MaterialGroup.groupD,
    ]
      .filter(Boolean)
      .join(' / '),
    unitId: material.unitId,
    unitName: material.Unit.unitName,
    unitAbbreviation: material.Unit.abbreviation,
    createdBy: material.createdBy,
    createdByName: `${material.Employee.firstName} ${material.Employee.lastName}`,
    deleted: material.deleted,
    deletedAt: material.deletedAt?.toISOString() ?? null,
    deletedBy: material.deletedBy ?? null,
    inventoryItems: material.Inventory_Inventory_materialIdToMaterial.map(inv => ({
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
  }

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
    <div className="p-6 max-w-5xl mx-auto">
      <MaterialDetail material={mappedMaterial} materialGroups={mappedGroups} units={mappedUnits} />
    </div>
  )
}
