import type {Prisma} from '@/generated/prisma/client'
import type {MappedMaterialDemand} from '@/types/materialDemand'

type MaterialDemandWithRelations = Prisma.MaterialDemandGetPayload<{
  include: {
    Material: {select: {id: true; beNumber: true; name: true; shortDescription: true}}
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
            validUntill: true
            deliveryTimeDays: true
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
  a: {unitPrice: number; deliveryTimeDays: number | null; validUntill: string | null},
  b: {unitPrice: number; deliveryTimeDays: number | null; validUntill: string | null},
) {
  if (a.unitPrice !== b.unitPrice) return a.unitPrice - b.unitPrice

  const aDelivery = a.deliveryTimeDays ?? Number.MAX_SAFE_INTEGER
  const bDelivery = b.deliveryTimeDays ?? Number.MAX_SAFE_INTEGER
  if (aDelivery !== bDelivery) return aDelivery - bDelivery

  const aValid = a.validUntill ? new Date(a.validUntill).getTime() : Number.MIN_SAFE_INTEGER
  const bValid = b.validUntill ? new Date(b.validUntill).getTime() : Number.MIN_SAFE_INTEGER
  return bValid - aValid
}

export function mapMaterialDemand(row: MaterialDemandWithRelations): MappedMaterialDemand {
  const quoteOptions = row.QuoteSupplierLine.map(line => {
    const isCurrentlyValid = isDateStillValid(line.QuoteSupplier.validUntill)
    const isEligibleForBest = !line.QuoteSupplier.deleted && !line.QuoteSupplier.rejected && isCurrentlyValid

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
      rejected: line.QuoteSupplier.rejected,
      deleted: line.QuoteSupplier.deleted,
      validUntill: line.QuoteSupplier.validUntill?.toISOString() ?? null,
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

