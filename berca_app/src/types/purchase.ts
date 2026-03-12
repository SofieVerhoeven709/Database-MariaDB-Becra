export interface MappedPurchase {
  id: string
  orderNumber: string | null
  brandName: string | null
  purchaseDate: string | null
  status: string | null
  companyId: string | null
  companyName: string | null
  projectId: string | null
  projectNumber: string | null
  projectName: string | null
  updatedAt: string | null
  createdBy: string
  createdByName: string
  preferedSupplier: string | null
  description: string | null
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
}

export interface MappedPurchaseDetail {
  id: string
  purchaseId: string | null
  projectId: string | null
  projectNumber: string | null
  projectName: string | null
  beNumber: string | null
  unitPrice: string | null
  quantity: number | null
  totalCost: string | null
  status: string | null
  additionalInfo: string | null
  updatedAt: string | null
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
}
