export interface MappedMaterialDemand {
  id: string
  materialId: string
  materialBeNumber: string | null
  materialName: string | null
  materialShortDescription: string | null
  stockQuantity: number
  minimumStockQuantity: number
  isLowStock: boolean
  requestInventoryId: string | null
  suggestedRequestQty: number
  pendingRequestCount: number
  totalRequiredQty: number
  reservedQty: number
  createdAt: string
  sourceCount: number
  quoteLineCount: number
  selectedQuoteLineIds: string[]
  bestQuoteLineId: string | null
  quoteOptions: MaterialDemandQuoteOption[]
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
  executed: boolean
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

