// ─── PriceListItemTarget ───────────────────────────────────────────────────────
export type LinkableTargetType = 'HourType' | 'Material' | 'Training'

export interface MappedPriceListItemTarget {
  id: string
  priceListItemId: string
  targetId: string
  targetType: LinkableTargetType
  displayLabel: string
}

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
  linkedTarget: MappedPriceListItemTarget | null
}

// ─── PriceList ─────────────────────────────────────────────────────────────────
export interface MappedPriceListCompany {
  id: string // PriceListCompany join row id — used for unassign
  companyId: string
  companyNumber: string
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
  companies: MappedPriceListCompany[]
  itemCount: number
}

// ─── Linkable target search results ───────────────────────────────────────────
export interface LinkableTargetResult {
  targetId: string
  targetType: LinkableTargetType
  displayLabel: string
  subLabel: string | null
}

// ─── Company search result ─────────────────────────────────────────────────────
export interface CompanySearchResult {
  id: string
  number: string
  name: string
}
