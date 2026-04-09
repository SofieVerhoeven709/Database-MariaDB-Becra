import type {Prisma} from '@/generated/prisma/client'
import type {MappedMaterialDemand} from '@/types/materialDemand'

type MaterialDemandWithRelations = Prisma.MaterialDemandGetPayload<{
  include: {
    Material: {
      select: {
        id: true
        beNumber: true
        name: true
        shortDescription: true
        Inventory_Inventory_materialIdToMaterial: {
          where: {deleted: false}
          orderBy: [{quantityInStock: 'asc'}, {createdAt: 'asc'}]
          select: {
            id: true
            quantityInStock: true
            minQuantityInStock: true
            InventoryOrder: {where: {deleted: false}, select: {id: true}}
          }
        }
      }
    }
    MaterialDemandSource: {select: {id: true}}
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
            executed: true
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

export function mapMaterialDemand(row: MaterialDemandWithRelations): MappedMaterialDemand {
  const inventories = row.Material.Inventory_Inventory_materialIdToMaterial
  const stockQuantity = inventories.reduce((sum, inv) => sum + inv.quantityInStock, 0)
  const minimumStockQuantity = inventories.reduce((sum, inv) => sum + inv.minQuantityInStock, 0)
  const requestInventory = inventories[0] ?? null
  const pendingRequestCount = inventories.reduce((sum, inv) => sum + inv.InventoryOrder.length, 0)
  const suggestedRequestQty = Math.max(minimumStockQuantity - stockQuantity, 1)

  const quoteOptions = row.QuoteSupplierLine.map(line => {
    const isCurrentlyValid = isDateStillValid(line.QuoteSupplier.validUntil)
    const isEligibleForBest =
      !line.QuoteSupplier.deleted &&
      !line.QuoteSupplier.rejected &&
      !(line.QuoteSupplier.executed && line.QuoteSupplier.acceptedForPOB) &&
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
      executed: line.QuoteSupplier.executed,
      acceptedForPOB: line.QuoteSupplier.acceptedForPOB,
      rejected: line.QuoteSupplier.rejected,
      deleted: line.QuoteSupplier.deleted,
      validUntil: line.QuoteSupplier.validUntil?.toISOString() ?? null,
      deliveryTimeDays: line.QuoteSupplier.deliveryTimeDays ?? null,
      isCurrentlyValid,
      isEligibleForBest,
    }
  }).sort((a, b) => compareBestQuoteCandidate(a, b))

  const bestOption = quoteOptions.find(option => option.isEligibleForBest) ?? null

  return {
    id: row.id,
    materialId: row.materialId,
    materialBeNumber: row.Material.beNumber,
    materialName: row.Material.name,
    materialShortDescription: row.Material.shortDescription,
    stockQuantity,
    minimumStockQuantity,
    isLowStock: stockQuantity <= minimumStockQuantity,
    requestInventoryId: requestInventory?.id ?? null,
    suggestedRequestQty,
    pendingRequestCount,
    totalRequiredQty: row.totalRequiredQty,
    reservedQty: row.reservedQty ?? 0,
    createdAt: row.createdAt.toISOString(),
    sourceCount: row.MaterialDemandSource.length,
    quoteLineCount: row.QuoteSupplierLine.length,
    selectedQuoteLineIds: quoteOptions.filter(option => option.selected).map(option => option.id),
    bestQuoteLineId: bestOption?.id ?? null,
    quoteOptions,
  }
}

