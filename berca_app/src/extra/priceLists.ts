import type {
  MappedPriceList,
  MappedPriceListItem,
  MappedPriceListItemTarget,
  MappedPriceListCompany,
  LinkableTargetType,
} from '@/types/priceList'

type PriceListItemTargetRaw = {
  id: string
  priceListItemId: string
  targetId: string
}

type PriceListItemRaw = {
  id: string
  priceListId: string
  description: string
  unit: string
  price: {toNumber: () => number}
  isCostMargin: boolean
  createdAt: Date
  createdBy: string
  deleted: boolean
  deletedAt: Date | null
  deletedBy: string | null
  Employee_PriceListItem_createdByToEmployee: {id: string; firstName: string; lastName: string}
  PriceListItemTarget: PriceListItemTargetRaw | null
}

type PriceListRaw = {
  id: string
  name: string
  repeatUse: boolean
  createdAt: Date
  createdBy: string
  deleted: boolean
  deletedAt: Date | null
  deletedBy: string | null
  targetId: string
  Employee_PriceList_createdByToEmployee: {id: string; firstName: string; lastName: string}
  PriceListItem: PriceListItemRaw[]
  PriceListCompany: {
    id: string
    companyId: string
    Company: {id: string; number: string; name: string}
  }[]
}

function mapItem(
  r: PriceListItemRaw,
  resolvedTargets: Map<string, {targetType: LinkableTargetType; displayLabel: string}>,
  materialPriceMap: Map<string, number> = new Map(), // ← NEW
): MappedPriceListItem {
  let linkedTarget: MappedPriceListItemTarget | null = null

  if (r.PriceListItemTarget) {
    const resolved = resolvedTargets.get(r.PriceListItemTarget.targetId)
    linkedTarget = {
      id: r.PriceListItemTarget.id,
      priceListItemId: r.PriceListItemTarget.priceListItemId,
      targetId: r.PriceListItemTarget.targetId,
      targetType: resolved?.targetType ?? 'HourType',
      displayLabel: resolved?.displayLabel ?? r.PriceListItemTarget.targetId,
    }
  }

  // below-cost check for material items
  const targetId = r.PriceListItemTarget?.targetId ?? null
  const supplierUnitPrice = targetId ? (materialPriceMap.get(targetId) ?? null) : null
  const itemPrice = r.price.toNumber()
  const belowSupplierCost =
    supplierUnitPrice !== null && linkedTarget?.targetType === 'Material' ? itemPrice < supplierUnitPrice : false

  return {
    id: r.id,
    priceListId: r.priceListId,
    description: r.description,
    unit: r.unit,
    price: itemPrice,
    isCostMargin: r.isCostMargin,
    createdAt: r.createdAt.toISOString(),
    createdBy: r.createdBy,
    createdByName: `${r.Employee_PriceListItem_createdByToEmployee.firstName} ${r.Employee_PriceListItem_createdByToEmployee.lastName}`,
    deleted: r.deleted,
    deletedAt: r.deletedAt?.toISOString() ?? null,
    deletedBy: r.deletedBy,
    linkedTarget,
    supplierUnitPrice,
    belowSupplierCost,
  }
}

export function mapPriceList(
  r: PriceListRaw,
  resolvedTargets: Map<string, {targetType: LinkableTargetType; displayLabel: string}> = new Map(),
  materialPriceMap: Map<string, number> = new Map(),
): MappedPriceList {
  const items = r.PriceListItem.map(item => mapItem(item, resolvedTargets, materialPriceMap))
  const companies: MappedPriceListCompany[] = r.PriceListCompany.map(c => ({
    id: c.id,
    companyId: c.Company.id,
    companyNumber: c.Company.number,
    companyName: c.Company.name,
  }))

  return {
    id: r.id,
    name: r.name,
    repeatUse: r.repeatUse,
    createdAt: r.createdAt.toISOString(),
    createdBy: r.createdBy,
    createdByName: `${r.Employee_PriceList_createdByToEmployee.firstName} ${r.Employee_PriceList_createdByToEmployee.lastName}`,
    deleted: r.deleted,
    deletedAt: r.deletedAt?.toISOString() ?? null,
    deletedBy: r.deletedBy,
    deletedByName: null,
    targetId: r.targetId,
    items,
    companies,
    // Only count active items for badges and list view.
    itemCount: items.filter(i => !i.deleted).length,
  }
}
