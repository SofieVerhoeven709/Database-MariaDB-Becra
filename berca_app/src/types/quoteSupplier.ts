export interface MappedQuoteSupplier {
  id: string
  description: string | null
  projectId: string | null
  projectName: string | null
  rejected: boolean
  additionalInfo: string | null
  link: string | null
  payementCondition: string | null
  acceptedForPOB: boolean | null
  validUntill: string | null
  deliveryTimeDays: number | null
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
}