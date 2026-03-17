import {getMaterialById, getMaterialGroups, getUnits} from '@/dal/materials'
import {MaterialDetail} from '@/components/custom/materialDetail'
import {notFound} from 'next/navigation'
import {getSupplierCompanies} from '@/dal/companies'

interface MaterialDetailPageProps {
  params: Promise<{materialId: string}>
}

export default async function MaterialDetailPage({params}: MaterialDetailPageProps) {
  const {materialId} = await params
  const [material, groups, units, supplierCompanies] = await Promise.all([
    getMaterialById(materialId).catch(() => null),
    getMaterialGroups(),
    getUnits(),
    getSupplierCompanies(),
  ])

  if (!material) notFound()

  const groupLabelById = new Map(
    groups.map(g => [g.id, [g.groupA, g.groupB, g.groupC, g.groupD].filter(Boolean).join(' / ')]),
  )

  const mappedMaterial = {
    id: material.id,
    beNumber: material.beNumber,
    name: material.name ?? null,
    brandOrderNr: material.brandOrderNr,
    shortDescription: material.shortDescription,
    longDescription: material.longDescription ?? null,
    preferredSupplierCompanyId: material.preferredSupplierCompanyId ?? null,
    preferredSupplierName: material.PreferredSupplierCompany?.name ?? null,
    supplierCompanyIds: material.MaterialSupplier.map(s => s.companyId),
    supplierCompanyNames: material.MaterialSupplier.map(s => s.Company.name),
    brandName: material.brandName ?? null,
    documentationPlace: material.documentationPlace ?? null,
    bePartDoc: material.bePartDoc ?? null,
    rejected: material.rejected ?? false,
    materialGroupId: material.materialGroupId,
    materialGroupLabel: groupLabelById.get(material.materialGroupId) ?? material.materialGroupId,
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
      />
    </div>
  )
}
