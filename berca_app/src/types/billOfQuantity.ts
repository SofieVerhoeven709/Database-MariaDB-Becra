// ─── Shared lookup types ───────────────────────────────────────────────────────
export interface BoqLookup {
  id: string
  name: string
}

export interface PriceListOption {
  id: string
  name: string
}

// ─── Billing lines (reused from invoice pattern) ──────────────────────────────
export type BillingLineType = 'hours' | 'material' | 'training' | 'stay_over'

export interface MappedBillingLine {
  workOrderId: string
  type: BillingLineType
  sourceId: string
  sourceLabel: string
  timeRegistryIds?: string[]
  quantity: number
  unit: string
  priceListItemId: string | null
  unitPriceBase: number | null
  unitPriceFinal: number | null
  lineTotalFinal: number | null
  vatMarginId: string | null
  vatRate: number | null
  lineVatAmount: number | null
  lineTotalInclVat: number | null
  unmatched: boolean
  workOrderStructureId?: string
}

// ─── BoQ Work Order ───────────────────────────────────────────────────────────
export interface MappedBoqWorkOrder {
  id: string
  workOrderBoqId: string
  workOrderNumber: string | null
  description: string | null
  completed: boolean
  hoursMaterialClosed: boolean
  projectId: string
  projectNumber: string
  projectName: string
  companyId: string
  companyName: string
  billingLines: MappedBillingLine[]
  subtotalExVat: number
  vatByRate: Array<{rate: number; amount: number}>
  totalVat: number
  totalInclVat: number
}

export interface MappedBoqContact {
  id: string
  contactId: string
  contactName: string
  contactMail: string | null
  contactPhone: string | null
}

// ─── MappedBoQ ────────────────────────────────────────────────────────────────
export interface MappedBoq {
  id: string
  boqNumber: string
  poNumber: string | null
  humanId: string | null
  boqDate: string
  createdAt: string
  dueDate: string
  sentDate: string | null
  deletedAt: string | null
  modifiedAt: string | null
  reminderSent: boolean
  outstanding: boolean
  deleted: boolean
  deletedBy: string | null
  deletedByName: string | null
  createdBy: string
  createdByName: string
  modifiedBy: string | null
  modifiedByName: string | null
  boqTypeId: string
  boqTypeName: string
  targetId: string
  paymentMethodId: string
  paymentMethodName: string
  boqSentTypeId: string
  boqSentTypeName: string
  boqStatusId: string
  boqStatusName: string
  priceListId: string | null
  priceListName: string | null
  contacts: MappedBoqContact[]
  workOrders: MappedBoqWorkOrder[]
  subtotalExVat: number
  vatByRate: Array<{rate: number; amount: number}>
  totalVat: number
  totalInclVat: number
}
