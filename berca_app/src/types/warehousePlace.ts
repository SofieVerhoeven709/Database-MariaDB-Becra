export interface MappedWarehousePlace {
  id: string
  abbreviation: string
  beNumber: string | null
  serialTrackedId: string | null
  place: string | null
  shelf: string | null
  column: string | null
  layer: string | null
  layerPlace: string | null
  information: string | null
  quantityInStock: number
  createdAt: string
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
}
