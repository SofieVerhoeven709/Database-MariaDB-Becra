import {getWarehousePlaces} from '@/dal/warehousePlace'
import {getMaterials} from '@/dal/materials'
import {WarehousePlaceTable} from '@/components/custom/warehousePlaceTable'
import {mapWarehousePlace} from '../../../../../mapper/warehousePlace'

export default async function WarehousePlacePage() {
  const [places, materials] = await Promise.all([getWarehousePlaces(), getMaterials()])
  const mappedPlaces = places.map(mapWarehousePlace)
  const materialOptions = materials.map(m => ({
    id: m.id,
    beNumber: m.beNumber ?? '',
    name: m.name,
    shortDescription: m.shortDescription,
  }))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Warehouse Places</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage warehouse locations using Warehouse, X, Y and Z coordinates.
        </p>
      </div>
      <WarehousePlaceTable initialItems={mappedPlaces} materials={materialOptions} />
    </div>
  )
}
