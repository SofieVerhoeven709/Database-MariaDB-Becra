export interface MappedInventoryOrder {
  id: string
  inventoryId: string
  inventoryBeNumber: string | null
  inventoryDescription: string | null
  orderNumber: string
  requestedQty: number
  orderDate: string
  shortDescription: string
  longDescription: string | null
  createdAt: string
  createdBy: string
  createdByName: string
  approved: boolean
  approvedAt: string | null
  approvedBy: string | null
  approvedByName: string | null
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
}