import {getMaterialPlaces} from '@/dal/materialPlace'
import {getMaterials} from '@/dal/materials'
import {MaterialPlaceTable} from '@/components/custom/materialPlaceTable'
import {mapMaterialPlace} from '@/extra/materialPlace'

export default async function MaterialPlacePage() {
  const [places, materials] = await Promise.all([getMaterialPlaces({includeDeleted: true}), getMaterials()])
  const mappedPlaces = places.map(mapMaterialPlace)
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
          Assign and maintain warehouse storage locations across shelves, columns and layers.
        </p>
      </div>
      <MaterialPlaceTable initialItems={mappedPlaces} materials={materialOptions} />
    </div>
  )
}
