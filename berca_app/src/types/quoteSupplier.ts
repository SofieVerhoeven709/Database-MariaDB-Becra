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
  validUntill: string | null
  deliveryTimeDays: number | null
  paymentConditionId: string | null
  paymentConditionName: string | null
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
}