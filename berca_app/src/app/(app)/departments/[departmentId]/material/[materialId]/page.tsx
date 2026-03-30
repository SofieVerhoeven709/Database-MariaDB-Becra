import {getMaterialById, getMaterialGroups, getUnits} from '@/dal/materials'
import {MaterialDetail} from '@/components/custom/materialDetail'
import {notFound} from 'next/navigation'
import {getSupplierCompanies} from '@/dal/companies'
import {getSerialTrackedStructureBySerialTrackedId} from '@/dal/materialSerialTrackedStructure'
import {getNonBeNumberItems} from '@/dal/materials'

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
  const [material, groups, units, supplierCompanies] = await Promise.all([
    getMaterialById(materialId).catch(() => null),
    getMaterialGroups(),
    getUnits(),
    getSupplierCompanies(),
  ])

  if (!material) notFound()

  // Fetch serial tracked structure if serialTrackedId exists
  const serialTrackedId = material.MaterialSerialTrack?.id ?? null
  const [serialTrackedStructure, nonBeNumberItems] = await Promise.all([
    serialTrackedId ? getSerialTrackedStructureBySerialTrackedId(serialTrackedId) : [],
    getNonBeNumberItems(materialId),
  ])

  const groupById = new Map(groups.map(g => [g.id, g]))

  const preferredSupplierEntry =
    material.MaterialSupplier.find(s => s.companyId === material.preferredSupplierCompanyId) ??
    material.MaterialSupplier.find(s => s.isPreferred) ??
    null

  const mappedMaterial = {
    id: material.id,
    beNumber: material.beNumber,
    name: material.name ?? null,
    brandOrderNr: material.brandOrderNr,
    shortDescription: material.shortDescription,
    longDescription: material.longDescription ?? null,
    preferredSupplierCompanyId: material.preferredSupplierCompanyId ?? null,
    preferredSupplierCompanyName: material.PreferredSupplierCompany?.name ?? null,
    preferredSupplierOrderId: preferredSupplierEntry?.supplierOrderNr ?? null,
    preferredSupplierShortDescription: preferredSupplierEntry?.shortDescription ?? null,
    supplierCompanyIds: material.MaterialSupplier.map(s => s.companyId),
    supplierCompanyNames: material.MaterialSupplier.map(s => s.Company.name),
    brandName: material.brandName ?? null,
    documentationPlace: material.documentationPlace ?? null,
    bePartDoc: parseBePartDoc(material.bePartDoc),
    rejected: material.rejected ?? false,
    materialGroupIdA: material.materialGroupIdA ?? null,
    materialGroupIdB: material.materialGroupIdB ?? null,
    materialGroupIdC: material.materialGroupIdC ?? null,
    materialGroupIdD: material.materialGroupIdD ?? null,
    materialGroupLabelA: material.materialGroupIdA
      ? (groupById.get(material.materialGroupIdA)?.groupA ?? material.materialGroupIdA)
      : '',
    materialGroupLabelB: material.materialGroupIdB
      ? (groupById.get(material.materialGroupIdB)?.groupB ?? material.materialGroupIdB)
      : '',
    materialGroupLabelC: material.materialGroupIdC
      ? (groupById.get(material.materialGroupIdC)?.groupC ?? material.materialGroupIdC)
      : '',
    materialGroupLabelD: material.materialGroupIdD
      ? (groupById.get(material.materialGroupIdD)?.groupD ?? material.materialGroupIdD)
      : '',
    materialGroupLabel: [
      material.materialGroupIdA,
      material.materialGroupIdB,
      material.materialGroupIdC,
      material.materialGroupIdD,
    ]
      .filter(Boolean)
      .map(id => {
        const group = groupById.get(id as string)
        if (!group) return id as string
        return [group.groupA, group.groupB, group.groupC, group.groupD].filter(Boolean).join(' / ')
      })
      .join(' | '),
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
    isSerialTracked: material.isSerialTracked ?? false,
    serialTrackedId: material.MaterialSerialTrack?.id ?? null,
    parentBeNumbers: material.MaterialStructure_MaterialStructure_materialIdToMaterial?.map(x => x.beNumber) ?? [],
    isParentPart: (material.MaterialStructure_MaterialStructure_materialIdToMaterial?.length ?? 0) > 0,
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

  const mappedSupplierCompanies = supplierCompanies.map(c => ({
    id: c.id,
    name: c.name,
    number: c.number,
  }))

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <MaterialDetail
        material={mappedMaterial}
        materialGroups={mappedGroups}
        units={mappedUnits}
        supplierCompanies={mappedSupplierCompanies}
        serialTrackedStructure={serialTrackedStructure}
        nonBeNumberItems={nonBeNumberItems}
      />
    </div>
  )
}
