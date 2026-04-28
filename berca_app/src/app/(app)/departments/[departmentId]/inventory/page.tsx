import {getInventory} from '@/dal/inventory'
import {getMaterials} from '@/dal/materials'
import {getWarehousePlaces} from '@/dal/warehousePlace'
import {InventoryManagementTable} from '../../../../../components/custom/inventoryManagementTable'

function formatInventoryPlaceLocation(place: {
  abbreviation: string | null
  place: string | null
  shelf: string | null
  column: string | null
  layer: string | null
  layerPlace: string | null
}) {
  const location = [place.place, place.shelf, place.column, place.layer, place.layerPlace].filter(Boolean).join(' - ')
  return location || place.abbreviation || 'Unassigned'
}

export default async function InventoryPage() {
  const [inventory, materials, warehousePlaces] = await Promise.all([
    getInventory({includeDeleted: true}),
    getMaterials(),
    getWarehousePlaces(),
  ])

  const locationByBeNumber = new Map(
    warehousePlaces
      .filter(place => typeof place.beNumber === 'string' && place.beNumber.trim().length > 0)
      .map(place => [place.beNumber as string, formatInventoryPlaceLocation(place)]),
  )

  const mappedItems = inventory.map(i => ({
    id: i.id,
    materialId: i.materialId,
    beNumber: i.beNumber,
    place: locationByBeNumber.get(i.beNumber) ?? 'Unassigned',
    shortDescription: i.shortDescription,
    longDescription: i.longDescription,
    serialNumber: i.serialNumber,
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
    beNumber: m.beNumber ?? '', // Ensure beNumber is always a string
    name: m.name ?? '', // Ensure name is always a string
    shortDescription: m.shortDescription ?? '', // Ensure shortDescription is always a string
  }))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor and control warehouse stock levels, locations, and validity.
        </p>
      </div>
      <InventoryManagementTable initialItems={mappedItems} materials={mappedMaterials} />
    </div>
  )
}
