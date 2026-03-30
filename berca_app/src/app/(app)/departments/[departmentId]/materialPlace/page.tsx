import {getMaterialPlaces} from '@/dal/materialPlace'
import {MaterialPlaceTable} from '@/components/custom/materialPlaceTable'
import {mapMaterialPlace} from '@/extra/materialPlace'

export default async function MaterialPlacePage() {
  const places = await getMaterialPlaces({includeDeleted: true})
  const mappedPlaces = places.map(mapMaterialPlace)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Material Places</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Assign and maintain material storage locations across warehouse shelves and layers.
        </p>
      </div>
      <MaterialPlaceTable initialItems={mappedPlaces} />
    </div>
  )
}
