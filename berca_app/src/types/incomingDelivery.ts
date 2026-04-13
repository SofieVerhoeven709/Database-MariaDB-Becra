export interface MappedIncomingDelivery {
  id: string
  incomingDeliveryNumber: string
  purchaseId: string | null
  purchaseNumber: string | null
  status: string
  deliveryDate: string
  receivedAt: string | null
  description: string | null
  additionalInfo: string | null
  createdAt: string
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  lineCount: number
  orderedQtyTotal: number
  acceptedQtyTotal: number
  isFullyDelivered: boolean
}

export interface MappedIncomingDeliveryLine {
  id: string
  incomingDeliveryId: string
  purchaseDetailId: string | null
  materialId: string
  materialLabel: string
  orderedQty: number
  deliveredQty: number
  acceptedQty: number
  rejectedQty: number
  backorderQty: number
  unitPrice: string | null
  lineStatus: string
  createdAt: string
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  notCorrect: boolean
  notCorrectReason: string | null
  allocationCount: number
}

export interface MappedIncomingDeliveryLineAllocation {
  id: string
  incomingDeliveryLineId: string
  materialDemandSourceId: string
  materialDemandSourceLabel: string
  allocatedQty: number
  createdAt: string
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  fulfilled: boolean
  fulfilledAt: string | null
  fulfilledBy: string | null
}

export interface IncomingDeliveryOption {
  id: string
  name: string
}

export interface MaterialDemandSourceOption {
  id: string
  label: string
  materialId: string
  requiredQty: number
  reservedQty: number
}

