import type {Prisma} from '@/generated/prisma/client'
import type {MappedMaterialDemand} from '@/types/materialDemand'

type SourceLabelMap = Record<string, string>

type MaterialDemandWithRelations = Prisma.MaterialDemandGetPayload<{
  include: {
    Material: {
      select: {
        id: true
        beNumber: true
        name: true
        shortDescription: true
        InventoryOrder: {
          where: {deleted: false}
          select: {
            id: true
            approved: true
            shortDescription: true
          }
        }
        MaterialSupplier: {
          select: {
            companyId: true
            Company: {
              select: {
                supplier: true
                deleted: true
              }
            }
          }
        }
        Inventory_Inventory_materialIdToMaterial: {
          where: {deleted: false}
          orderBy: [{quantityInStock: 'asc'}, {createdAt: 'asc'}]
          select: {
            id: true
            quantityInStock: true
            minQuantityInStock: true
          }
        }
      }
    }
    MaterialDemandSource: {
      select: {
        id: true
        sourceReferenceId: true
        requiredQty: true
        reservedQty: true
        createdAt: true
        fulfilled: true
        MaterialDemandSourceType: {
          select: {
            name: true
          }
        }
      }
    }
    QuoteSupplierLine: {
      select: {
        id: true
        quoteSupplierId: true
        quantity: true
        unitPrice: true
        minQuantity: true
        selected: true
        QuoteSupplier: {
          select: {
            quoteNumber: true
            companyId: true
            validUntil: true
            deliveryTimeDays: true
            sent: true
            received: true
            acceptedForPOB: true
            rejected: true
            deleted: true
            Company: {
              select: {
                name: true
              }
            }
          }
        }
      }
    }
  }
}>

function isDateStillValid(isoOrDate: Date | null): boolean {
  if (!isoOrDate) return true

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const validDate = new Date(isoOrDate)
  validDate.setHours(0, 0, 0, 0)
  return validDate >= today
}

function compareBestQuoteCandidate(
  a: {unitPrice: number; deliveryTimeDays: number | null; validUntil: string | null},
  b: {unitPrice: number; deliveryTimeDays: number | null; validUntil: string | null},
) {
  if (a.unitPrice !== b.unitPrice) return a.unitPrice - b.unitPrice

  const aDelivery = a.deliveryTimeDays ?? Number.MAX_SAFE_INTEGER
  const bDelivery = b.deliveryTimeDays ?? Number.MAX_SAFE_INTEGER
  if (aDelivery !== bDelivery) return aDelivery - bDelivery

  const aValid = a.validUntil ? new Date(a.validUntil).getTime() : Number.MIN_SAFE_INTEGER
  const bValid = b.validUntil ? new Date(b.validUntil).getTime() : Number.MIN_SAFE_INTEGER
  return bValid - aValid
}

function isLowStockInventoryOrder(order: {shortDescription: string | null | undefined}) {
  return (order.shortDescription ?? '').toLowerCase().startsWith('low-stock request for')
}

function sourceLabelKey(sourceTypeName: string, sourceReferenceId: string | null) {
  if (!sourceReferenceId) return null
  return `${sourceTypeName.toLowerCase()}:${sourceReferenceId}`
}

export function mapMaterialDemand(
  row: MaterialDemandWithRelations,
  sourceLabels: SourceLabelMap = {},
): MappedMaterialDemand {
  const inventories = row.Material.Inventory_Inventory_materialIdToMaterial
  const stockQuantity = inventories.reduce((sum, inv) => sum + inv.quantityInStock, 0)
  const minimumStockQuantity = inventories.reduce((sum, inv) => sum + (inv.minQuantityInStock ?? 0), 0)
  const hasMinimumStock = inventories.some(inv => (inv.minQuantityInStock ?? 0) > 0)
  const lowStockOrders = row.Material.InventoryOrder.filter(isLowStockInventoryOrder)
  const existingLowStockRequestCount = lowStockOrders.length
  const approvedLowStockRequestCount = lowStockOrders.reduce((sum, order) => sum + (order.approved ? 1 : 0), 0)
  const pendingLowStockRequestCount = Math.max(existingLowStockRequestCount - approvedLowStockRequestCount, 0)
  const suggestedRequestQty = Math.max(minimumStockQuantity - stockQuantity, 1)
  const eligibleSupplierCompanyIds = row.Material.MaterialSupplier.filter(
    link => link.Company.supplier && !link.Company.deleted,
  ).map(link => link.companyId)

  const allQuoteOptions = row.QuoteSupplierLine.map(line => {
    const isCurrentlyValid = isDateStillValid(line.QuoteSupplier.validUntil)
    const isEligibleForBest =
      !line.QuoteSupplier.deleted &&
      !line.QuoteSupplier.rejected &&
      !(line.QuoteSupplier.sent && line.QuoteSupplier.acceptedForPOB) &&
      isCurrentlyValid

    return {
      id: line.id,
      quoteSupplierId: line.quoteSupplierId,
      quoteNumber: line.QuoteSupplier.quoteNumber,
      supplierCompanyId: line.QuoteSupplier.companyId,
      supplierCompanyName: line.QuoteSupplier.Company.name,
      quantity: line.quantity,
      unitPrice: line.unitPrice.toNumber(),
      minQuantity: line.minQuantity,
      selected: line.selected ?? false,
      sent: line.QuoteSupplier.sent,
      received: line.QuoteSupplier.received,
      acceptedForPOB: line.QuoteSupplier.acceptedForPOB,
      rejected: line.QuoteSupplier.rejected,
      deleted: line.QuoteSupplier.deleted,
      validUntil: line.QuoteSupplier.validUntil?.toISOString() ?? null,
      deliveryTimeDays: line.QuoteSupplier.deliveryTimeDays ?? null,
      isCurrentlyValid,
      isEligibleForBest,
    }
  }).sort((a, b) => compareBestQuoteCandidate(a, b))

  const sources = row.MaterialDemandSource.map(source => {
    const key = sourceLabelKey(source.MaterialDemandSourceType.name, source.sourceReferenceId)
    return {
      id: source.id,
      sourceTypeName: source.MaterialDemandSourceType.name,
      sourceReferenceId: source.sourceReferenceId,
      sourceReferenceLabel: key ? (sourceLabels[key] ?? source.sourceReferenceId ?? '—') : '—',
      requiredQty: source.requiredQty,
      reservedQty: source.reservedQty ?? 0,
      createdAt: source.createdAt.toISOString(),
      fulfilled: source.fulfilled ?? false,
    }
  })

  // Once demand is fully fulfilled, quote options are considered completed for this page.
  const hideQuotesForFulfilledDemand = row.totalRequiredQty <= 0
  const quoteOptions = hideQuotesForFulfilledDemand ? [] : allQuoteOptions
  const bestOption = quoteOptions.find(option => option.isEligibleForBest) ?? null

  return {
    id: row.id,
    materialId: row.materialId,
    materialBeNumber: row.Material.beNumber,
    materialName: row.Material.name,
    materialShortDescription: row.Material.shortDescription,
    stockQuantity,
    minimumStockQuantity,
    hasMinimumStock,
    isLowStock: hasMinimumStock && stockQuantity <= minimumStockQuantity,
    requestInventoryId: null,
    suggestedRequestQty,
    pendingLowStockRequestCount,
    existingLowStockRequestCount,
    approvedLowStockRequestCount,
    eligibleSupplierCompanyIds,
    totalRequiredQty: row.totalRequiredQty,
    reservedQty: row.reservedQty ?? 0,
    createdAt: row.createdAt.toISOString(),
    sourceCount: sources.length,
    sources,
    quoteLineCount: row.QuoteSupplierLine.length,
    selectedQuoteLineIds: quoteOptions.filter(option => option.selected).map(option => option.id),
    bestQuoteLineId: bestOption?.id ?? null,
    quoteOptions,
  }
}

