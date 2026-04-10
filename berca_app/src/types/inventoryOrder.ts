export interface MappedInventoryOrder {
  id: string
  materialId: string
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
  rejected: boolean
  rejectedAt: string | null
  rejectedBy: string | null
  rejectedByName: string | null
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
}