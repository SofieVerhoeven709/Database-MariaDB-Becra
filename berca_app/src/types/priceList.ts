// ─── PriceListItem ─────────────────────────────────────────────────────────────
export interface MappedPriceListItem {
  id: string
  priceListId: string
  description: string
  unit: string
  price: number
  isCostMargin: boolean
  createdAt: string
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
}

// ─── PriceList ─────────────────────────────────────────────────────────────────
export interface MappedPriceListProject {
  id: string
  projectNumber: string
  projectName: string
  companyId: string
  companyName: string
}

export interface MappedPriceList {
  id: string
  name: string
  repeatUse: boolean
  createdAt: string
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
  targetId: string
  items: MappedPriceListItem[]
  projects: MappedPriceListProject[]
  // Computed
  itemCount: number
}

// ─── Lookup ────────────────────────────────────────────────────────────────────
export interface UnassignedProjectOption {
  id: string
  projectNumber: string
  projectName: string
  companyName: string
}
