export interface MappedMaterialDemand {
  id: string
  materialId: string
  materialBeNumber: string | null
  materialName: string | null
  materialShortDescription: string | null
  isSerialTracked: boolean
  stockQuantity: number
  minimumStockQuantity: number
  hasMinimumStock: boolean
  isLowStock: boolean
  requestInventoryId: string | null
  suggestedRequestQty: number
  pendingLowStockRequestCount: number
  existingLowStockRequestCount: number
  approvedLowStockRequestCount: number
  eligibleSupplierCompanyIds: string[]
  totalRequiredQty: number
  reservedQty: number
  createdAt: string
  sourceCount: number
  sources: MaterialDemandSourceEntry[]
  quoteLineCount: number
  selectedQuoteLineIds: string[]
  bestQuoteLineId: string | null
  quoteOptions: MaterialDemandQuoteOption[]
}

export interface MaterialDemandSourceEntry {
  id: string
  sourceTypeName: string
  sourceReferenceId: string | null
  sourceReferenceLabel: string
  requiredQty: number
  reservedQty: number
  createdAt: string
  fulfilled: boolean
  isManual: boolean
  manualLabel: string | null
}

export interface MaterialDemandQuoteOption {
  id: string
  quoteSupplierId: string
  quoteNumber: string
  supplierCompanyId: string
  supplierCompanyName: string
  quantity: number
  unitPrice: number
  minQuantity: number | null
  selected: boolean
  sent: boolean
  received: boolean
  acceptedForPOB: boolean
  rejected: boolean
  deleted: boolean
  validUntil: string | null
  deliveryTimeDays: number | null
  isCurrentlyValid: boolean
  isEligibleForBest: boolean
}

export interface MaterialDemandMaterialOption {
  id: string
  beNumber: string | null
  name: string | null
  shortDescription: string | null
}

export interface MaterialDemandSourceEntry {
  id: string
  sourceTypeName: string
  sourceReferenceId: string | null
  sourceReferenceLabel: string
  requiredQty: number
  reservedQty: number
  createdAt: string
  fulfilled: boolean
  isManual: boolean
  manualLabel: string | null
  description: string | null
}
