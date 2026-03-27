import type {
  MappedPriceList,
  MappedPriceListItem,
  MappedPriceListItemTarget,
  MappedPriceListProject,
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
  Project: {
    id: string
    projectNumber: string
    projectName: string
    companyId: string
    Company: {id: string; name: string}
  }[]
}

function mapItem(
  r: PriceListItemRaw,
  resolvedTargets: Map<string, {targetType: LinkableTargetType; displayLabel: string}>,
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

  return {
    id: r.id,
    priceListId: r.priceListId,
    description: r.description,
    unit: r.unit,
    price: r.price.toNumber(),
    isCostMargin: r.isCostMargin,
    createdAt: r.createdAt.toISOString(),
    createdBy: r.createdBy,
    createdByName: `${r.Employee_PriceListItem_createdByToEmployee.firstName} ${r.Employee_PriceListItem_createdByToEmployee.lastName}`,
    deleted: r.deleted,
    deletedAt: r.deletedAt?.toISOString() ?? null,
    deletedBy: r.deletedBy,
    linkedTarget,
  }
}

export function mapPriceList(
  r: PriceListRaw,
  resolvedTargets: Map<string, {targetType: LinkableTargetType; displayLabel: string}> = new Map(),
): MappedPriceList {
  const items = r.PriceListItem.map(item => mapItem(item, resolvedTargets))
  const projects: MappedPriceListProject[] = r.Project.map(p => ({
    id: p.id,
    projectNumber: p.projectNumber,
    projectName: p.projectName,
    companyId: p.companyId,
    companyName: p.Company.name,
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
    projects,
    itemCount: items.filter(i => !i.deleted).length,
  }
}
