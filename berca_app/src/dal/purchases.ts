import 'server-only'
import {prismaClient} from '@/dal/prismaClient'
import type {Prisma} from '@/generated/prisma/client'
import {generatePurchaseNumber} from '@/lib/utils'

async function getNextAvailablePurchaseNumber(): Promise<string> {
  let candidate = generatePurchaseNumber()
  let attempts = 0

  while (attempts < 5) {
    const existing = await prismaClient.purchase.findFirst({
      where: {purchaseNumber: candidate},
      select: {id: true},
    })

    if (!existing) return candidate

    attempts++
    candidate = generatePurchaseNumber()
  }

  return candidate
}

export async function syncPurchaseBOMStructuresForOrderedApprovedPurchase(
  purchaseId: string,
  tx?: Prisma.TransactionClient,
) {
  const db = tx ?? prismaClient

  const purchase = await db.purchase.findUnique({
    where: {id: purchaseId},
    select: {
      id: true,
      status: true,
      quoteSupplierId: true,
      QuoteSupplier: {select: {acceptedForPOB: true}},
      PurchaseDetail: {
        where: {deleted: false},
        select: {
          id: true,
          materialId: true,
          materialDemandId: true,
          quoteSupplierLineId: true,
        },
      },
    },
  })

  if (!purchase) return {updatedCount: 0, matchedStructureCount: 0}
  if (purchase.status !== 'ORDERED') return {updatedCount: 0, matchedStructureCount: 0}
  if (!purchase.quoteSupplierId || !purchase.QuoteSupplier?.acceptedForPOB) {
    return {updatedCount: 0, matchedStructureCount: 0}
  }

  const structureIds = new Set<string>()
  const quoteLineIds = purchase.PurchaseDetail.map(detail => detail.quoteSupplierLineId).filter(
    (id): id is string => !!id,
  )

  if (quoteLineIds.length > 0) {
    const byQuoteLine = await db.purchaseBOMStructure.findMany({
      where: {
        deleted: false,
        quoteSupplierLineId: {in: quoteLineIds},
      },
      select: {id: true},
    })
    for (const row of byQuoteLine) structureIds.add(row.id)
  }

  const demandIds = purchase.PurchaseDetail.map(detail => detail.materialDemandId).filter(
    (id): id is string => !!id,
  )

  if (demandIds.length > 0) {
    const sources = await db.materialDemandSource.findMany({
      where: {
        materialDemandId: {in: demandIds},
        sourceReferenceId: {not: null},
        MaterialDemandSourceType: {name: {in: ['ProjectBOMStructure', 'PurchaseBOMStructure']}},
      },
      select: {
        materialDemandId: true,
        sourceReferenceId: true,
        MaterialDemandSourceType: {select: {name: true}},
      },
    })

    const detailsByDemand = new Map<string, Array<{materialId: string}>>()
    for (const detail of purchase.PurchaseDetail) {
      if (!detail.materialDemandId) continue
      const list = detailsByDemand.get(detail.materialDemandId) ?? []
      list.push({materialId: detail.materialId})
      detailsByDemand.set(detail.materialDemandId, list)
    }

    for (const source of sources) {
      const sourceRef = source.sourceReferenceId
      if (!sourceRef) continue
      const demandDetails = detailsByDemand.get(source.materialDemandId) ?? []
      if (demandDetails.length === 0) continue

      if (source.MaterialDemandSourceType.name === 'PurchaseBOMStructure') {
        structureIds.add(sourceRef)
        continue
      }

      if (source.MaterialDemandSourceType.name === 'ProjectBOMStructure') {
        for (const detail of demandDetails) {
          const matched = await db.purchaseBOMStructure.findMany({
            where: {
              deleted: false,
              projectBOMStructureId: sourceRef,
              materialId: detail.materialId,
            },
            select: {id: true},
          })
          for (const row of matched) structureIds.add(row.id)
        }
      }
    }
  }

  if (structureIds.size === 0) return {updatedCount: 0, matchedStructureCount: 0}

  const result = await db.purchaseBOMStructure.updateMany({
    where: {
      id: {in: [...structureIds]},
      purchased: false,
      deleted: false,
    },
    data: {purchased: true},
  })

  return {updatedCount: result.count, matchedStructureCount: structureIds.size}
}

export async function syncPurchaseStatusFromFulfilledSources(
  purchaseId: string,
  tx?: Prisma.TransactionClient,
) {
  const db = tx ?? prismaClient

  const purchase = await db.purchase.findUnique({
    where: {id: purchaseId},
    select: {
      id: true,
      status: true,
      PurchaseDetail: {
        where: {deleted: false},
        select: {materialDemandId: true},
      },
    },
  })

  if (!purchase) return {updated: false, status: null as string | null}
  if (purchase.status === 'CANCELLED' || purchase.status === 'CLOSED') {
    return {updated: false, status: purchase.status}
  }

  const demandIds = [...new Set(purchase.PurchaseDetail.map(line => line.materialDemandId).filter((id): id is string => !!id))]
  if (demandIds.length === 0) return {updated: false, status: purchase.status}

  const linkedSources = await db.materialDemandSource.findMany({
    where: {
      materialDemandId: {in: demandIds},
      MaterialDemandSourceType: {
        name: {not: 'WarehousePlace'},
      },
    },
    select: {
      fulfilled: true,
    },
  })

  if (linkedSources.length === 0) return {updated: false, status: purchase.status}

  const allFulfilled = linkedSources.every(source => source.fulfilled)
  const anyFulfilled = linkedSources.some(source => source.fulfilled)

  let nextStatus = purchase.status
  if (allFulfilled) {
    nextStatus = 'RECEIVED'
  } else if (anyFulfilled && purchase.status === 'ORDERED') {
    nextStatus = 'PARTIAL_RECEIVED'
  }

  if (nextStatus === purchase.status) {
    return {updated: false, status: purchase.status}
  }

  await db.purchase.update({
    where: {id: purchase.id},
    data: {status: nextStatus},
  })

  return {updated: true, status: nextStatus}
}

export async function ensurePurchaseFromApprovedQuote(quoteSupplierId: string, createdBy: string) {
  const existing = await prismaClient.purchase.findFirst({
    where: {quoteSupplierId},
    select: {id: true},
  })

  if (existing) {
    await syncPurchaseBOMStructuresForOrderedApprovedPurchase(existing.id)
    return {purchaseId: existing.id, created: false}
  }

  const quote = await prismaClient.quoteSupplier.findUnique({
    where: {id: quoteSupplierId},
    select: {
      id: true,
      quoteNumber: true,
      acceptedForPOB: true,
      companyId: true,
      paymentConditionId: true,
      description: true,
      additionalInfo: true,
      QuoteSupplierLine: {
        select: {
          id: true,
          materialId: true,
          materialDemandId: true,
          quantity: true,
          unitPrice: true,
          minQuantity: true,
          notDeliverable: true,
        },
      },
    },
  })

  if (!quote) {
    throw new Error('Quote not found while creating purchase.')
  }

  if (!quote.acceptedForPOB) {
    return {purchaseId: null, created: false}
  }

  const purchaseNumber = await getNextAvailablePurchaseNumber()
  const purchaseId = crypto.randomUUID()

  await prismaClient.$transaction(async tx => {
    const duplicate = await tx.purchase.findFirst({
      where: {quoteSupplierId},
      select: {id: true},
    })
    if (duplicate) return

    await tx.purchase.create({
      data: {
        id: purchaseId,
        purchaseNumber,
        purchaseDate: new Date(),
        companyId: quote.companyId,
        quoteSupplierId: quote.id,
        paymentConditionId: quote.paymentConditionId,
        status: 'DRAFT',
        shortDescription: quote.description ?? `Auto from quote ${quote.quoteNumber}`,
        description: quote.description,
        additionalInfo: quote.additionalInfo,
        createdBy,
      },
    })

    if (quote.QuoteSupplierLine.length > 0) {
      await tx.purchaseDetail.createMany({
        data: quote.QuoteSupplierLine.map(line => ({
          id: crypto.randomUUID(),
          purchaseId,
          quoteSupplierLineId: line.id,
          materialId: line.materialId,
          materialDemandId: line.materialDemandId,
          quantity: Math.max(1, line.quantity),
          unitPrice: line.unitPrice,
          minQuantity: line.minQuantity,
          lineStatus: 'OPEN',
          notDeliverable: line.notDeliverable,
          createdBy,
        })),
      })
    }
  })

  const createdPurchase = await prismaClient.purchase.findFirst({
    where: {quoteSupplierId},
    select: {id: true},
  })

  if (createdPurchase?.id) {
    await syncPurchaseBOMStructuresForOrderedApprovedPurchase(createdPurchase.id)
  }

  return {purchaseId: createdPurchase?.id ?? null, created: true}
}

export async function getPurchases() {
  return prismaClient.purchase.findMany({
    where: {deleted: false},
    orderBy: {purchaseDate: 'desc'},
    include: {
      Company: true,
      QuoteSupplier: {select: {id: true, quoteNumber: true}},
      PaymentCondition: {select: {id: true, name: true}},
      Employee: {select: {id: true, firstName: true, lastName: true}},
    },
  })
}

export async function getPurchaseById(id: string) {
  return prismaClient.purchase.findUnique({
    where: {id},
    include: {
      Company: {select: {id: true, name: true}},
      QuoteSupplier: {
        select: {
          id: true,
          quoteNumber: true,
          QuoteSupplierLine: {
            where: {Material: {deleted: false}},
            select: {
              id: true,
              materialId: true,
              materialDemandId: true,
              quantity: true,
              unitPrice: true,
              minQuantity: true,
              notDeliverable: true,
              Material: {select: {id: true, beNumber: true, name: true, shortDescription: true}},
            },
            orderBy: {id: 'asc'},
          },
        },
      },
      PaymentCondition: {select: {id: true, name: true}},
      Employee: {select: {id: true, firstName: true, lastName: true}},
    },
  })
}

export async function getPurchaseDetails(purchaseId: string) {
  return prismaClient.purchaseDetail.findMany({
    where: {purchaseId, deleted: false},
    orderBy: {createdAt: 'desc'},
    include: {
      Employee: {select: {id: true, firstName: true, lastName: true}},
      Material: {select: {id: true, beNumber: true, name: true, shortDescription: true}},
    },
  })
}

export async function getPurchaseDetailMaterialOptions() {
  return prismaClient.material.findMany({
    where: {deleted: false},
    select: {id: true, beNumber: true, name: true, shortDescription: true},
    orderBy: {beNumber: 'asc'},
  })
}

export async function getPurchaseDetailMaterialDemandOptions() {
  return prismaClient.materialDemand.findMany({
    select: {
      id: true,
      Material: {select: {beNumber: true, name: true, shortDescription: true}},
    },
    orderBy: {createdAt: 'desc'},
  })
}

