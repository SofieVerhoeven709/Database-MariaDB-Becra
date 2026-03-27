export interface MappedInventoryOrder {
  id: string
  inventoryId: string
  inventoryBeNumber: string | null
  inventoryDescription: string | null
  orderNumber: string
  orderDate: string
  shortDescription: string
  longDescription: string | null
  createdAt: string
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
}