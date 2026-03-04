import {getInventory} from '@/dal/inventory'
import {getMaterials} from '@/dal/materials'
import {InventoryTable} from '@/components/custom/inventoryTable'

export default async function InventoryPage() {
  const [inventory, materials] = await Promise.all([getInventory(), getMaterials()])

  const mappedItems = inventory.map(i => ({
    id: i.id,
    materialId: i.materialId,
    beNumber: i.beNumber,
    place: i.place,
    shortDescription: i.shortDescription,
    longDescription: i.longDescription,
    serieNumber: i.serieNumber,
    quantityInStock: i.quantityInStock,
    minQuantityInStock: i.minQuantityInStock,
    maxQuantityInStock: i.maxQuantityInStock,
    information: i.information,
    valid: i.valid,
    noValidDate: i.noValidDate.toISOString(),
    createdAt: i.createdAt.toISOString(),
    createdBy: i.createdBy,
    createdByName: `${i.Employee.firstName} ${i.Employee.lastName}`,
    materialName: i.Material_Inventory_materialIdToMaterial.name ?? null,
    materialDescription: i.Material_Inventory_materialIdToMaterial.shortDescription,
    deleted: i.deleted,
    deletedAt: i.deletedAt?.toISOString() ?? null,
    deletedBy: i.deletedBy ?? null,
  }))

  const mappedMaterials = materials.map(m => ({
    id: m.id,
    beNumber: m.beNumber,
    name: m.name ?? null,
    shortDescription: m.shortDescription,
  }))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor and control warehouse stock levels, locations, and validity.
        </p>
      </div>
      <InventoryTable initialItems={mappedItems} materials={mappedMaterials} />
    </div>
  )
}
