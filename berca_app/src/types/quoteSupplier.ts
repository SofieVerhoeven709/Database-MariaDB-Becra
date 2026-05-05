export interface MappedQuoteSupplier {
  id: string
  quoteNumber: string
  quotationNumber: string | null
  companyId: string
  companyName: string
  description: string | null
  rejected: boolean
  additionalInfo: string | null
  acceptedForPOB: boolean
  validUntil: string | null
  deliveryTimeDays: number | null
  paymentConditionId: string | null
  paymentConditionName: string | null
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
  lineCount: number
  sent: boolean
  received: boolean
}

export interface MappedQuoteSupplierDetailLine {
  id: string
  materialId: string
  materialBeNumber: string | null
  materialName: string | null
  materialShortDescription: string | null
  materialDemandId: string | null
  materialDemandLabel: string | null
  additionalInfo: string | null
  quantity: number
  unitPrice: number
  minQuantity: number | null
  selected: boolean
  notDeliverable: boolean
}

export interface MappedQuoteSupplierMiscLine {
  id: string
  description: string
  unitPrice: number
}

export interface MappedQuoteSupplierDetail extends MappedQuoteSupplier {
  lines: MappedQuoteSupplierDetailLine[]
  miscLines: MappedQuoteSupplierMiscLine[]
}

export interface MappedPaymentCondition {
  id: string
  name: string
  deleted: boolean
  createdAt: string
  createdBy: string
  createdByName: string
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
}
