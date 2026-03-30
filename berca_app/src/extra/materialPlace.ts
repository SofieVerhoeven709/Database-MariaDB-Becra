import type {MaterialPlaceWithRelations} from '@/dal/materialPlace'
import type {MappedMaterialPlace} from '@/types/materialPlace'

export function mapMaterialPlace(p: MaterialPlaceWithRelations): MappedMaterialPlace {
  const deletedByEmployee = p.Employee_WarehousePlace_deletedByToEmployee as
    | {firstName: string; lastName: string}
    | null

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
    deletedByName: deletedByEmployee
      ? `${deletedByEmployee.firstName} ${deletedByEmployee.lastName}`
      : null,
  }
}
