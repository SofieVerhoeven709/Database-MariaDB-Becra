import type {WarehousePlaceWithRelations} from '@/dal/warehousePlace'
import type {MappedWarehousePlace} from '@/types/warehousePlace'

export function mapWarehousePlace(p: WarehousePlaceWithRelations): MappedWarehousePlace {
  return {
    id: p.id,
    abbreviation: p.abbreviation,
    beNumber: p.beNumber ?? null,
    serialTrackedId: p.serialTrackedId ?? null,
    place: p.place ?? null,
    shelf: p.shelf ?? null,
    column: p.column ?? null,
    layer: p.layer ?? null,
    layerPlace: p.layerPlace ?? null,
    information: p.information ?? null,
    quantityInStock: p.quantityInStock,
    createdAt: p.createdAt.toISOString(),
    createdBy: p.createdBy,
    createdByName: `${p.Employee.firstName} ${p.Employee.lastName}`,
    deleted: p.deleted,
    deletedAt: p.deletedAt?.toISOString() ?? null,
    deletedBy: p.deletedBy ?? null,
  }
}
