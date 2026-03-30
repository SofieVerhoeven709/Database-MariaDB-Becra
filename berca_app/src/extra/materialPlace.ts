import type {MaterialPlaceWithRelations} from '@/dal/materialPlace'
import type {MappedMaterialPlace} from '@/types/materialPlace'

const EMPLOYEE_PLACE_PREFIX = 'emp:'

export function getStorageEmployeeIdFromPlace(place: string | null | undefined): string | null {
  if (!place) return null
  if (!place.toLowerCase().startsWith(EMPLOYEE_PLACE_PREFIX)) return null
  const id = place.slice(EMPLOYEE_PLACE_PREFIX.length).trim()
  return id || null
}

export function encodeMaterialPlaceField(
  place: string | null | undefined,
  storageEmployeeId: string | null | undefined,
): string | null {
  if (storageEmployeeId) return `${EMPLOYEE_PLACE_PREFIX}${storageEmployeeId}`
  if (!place) return null
  const trimmed = place.trim()
  return trimmed || null
}

export function mapMaterialPlace(p: MaterialPlaceWithRelations): MappedMaterialPlace {
  const deletedByEmployee = p.Employee_WarehousePlace_deletedByToEmployee as
    | {firstName: string; lastName: string}
    | null
  const storageEmployeeId = getStorageEmployeeIdFromPlace(p.place)

  return {
    id: p.id,
    abbreviation: p.abbreviation,
    beNumber: p.beNumber ?? null,
    serialTrackedId: p.serialTrackedId ?? null,
    place: storageEmployeeId ? null : p.place ?? null,
    storageEmployeeId,
    storageEmployeeName: null,
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
  } as MappedMaterialPlace
}
