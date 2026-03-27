export interface MappedInventory {
  id: string
  materialId: string
  beNumber: string
  place: string
  shortDescription: string
  longDescription: string
  serialNumber: string
  quantityInStock: number
  minQuantityInStock: number
  maxQuantityInStock: number
  information: string
  valid: boolean
  noValidDate: string
  createdAt: string
  createdBy: string
  createdByName: string
  materialName: string | null
  materialDescription: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
}
