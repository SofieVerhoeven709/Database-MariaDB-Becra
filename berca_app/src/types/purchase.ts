export interface MappedPurchase {
  id: string
  purchaseNumber: string
  customerPoNumber: string | null
  bocNumber: string | null
  bocCustomerName: string | null
  bocDescription: string | null
  bocCreatedAt: string | null
  bocStatus: string | null
  purchaseDate: string | null
  status: string
  companyId: string
  companyName: string | null
  quoteSupplierId: string | null
  quoteNumber: string | null
  paymentConditionId: string | null
  paymentConditionName: string | null
  createdAt: string | null
  createdBy: string
  createdByName: string
  description: string | null
  additionalInfo: string | null
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
}

export interface MappedPurchaseDetail {
  id: string
  purchaseId: string
  quoteSupplierLineId: string | null
  materialId: string
  materialLabel: string
  materialDemandId: string | null
  unitPrice: string | null
  quantity: number
  minQuantity: number | null
  lineStatus: string
  additionalInfo: string | null
  notDeliverable: boolean
  createdAt: string | null
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
}
