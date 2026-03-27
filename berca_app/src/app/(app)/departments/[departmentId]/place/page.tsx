import {getWarehousePlaces} from '@/dal/warehousePlace'
import {WarehousePlaceTable} from '@/components/custom/warehousePlaceTable'
import {mapWarehousePlace} from '@/extra/warehousePlace'

export default async function WarehousePlacePage() {
  const places = await getWarehousePlaces()
  const mappedPlaces = places.map(mapWarehousePlace)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Warehouse Places</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage storage locations, shelves, columns, layers and their capacity.
        </p>
      </div>
      <WarehousePlaceTable initialItems={mappedPlaces} />
    </div>
  )
}
