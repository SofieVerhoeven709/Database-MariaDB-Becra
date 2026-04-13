import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

const PURCHASE_NUMBER_BASE = 1_000_000
const PURCHASE_NUMBER_PREFIX = 'PO'

function parsePurchaseNumber(value: string | null | undefined): number | null {
  if (!value) return null
  const match = /^PO(\d+)$/i.exec(value.trim())
  if (!match) return null
  const parsed = Number.parseInt(match[1], 10)
  return Number.isFinite(parsed) ? parsed : null
}

function formatPurchaseNumber(n: number): string {
  return `${PURCHASE_NUMBER_PREFIX}${n}`
}

async function getNextAvailablePurchaseNumber(): Promise<string> {
  const rows = await prismaClient.purchase.findMany({
    select: {purchaseNumber: true},
  })

  const max = rows.reduce((acc, row) => {
    const parsed = parsePurchaseNumber(row.purchaseNumber)
    return parsed !== null && parsed > acc ? parsed : acc
  }, PURCHASE_NUMBER_BASE - 1)

  return formatPurchaseNumber(Math.max(PURCHASE_NUMBER_BASE, max + 1))
}

export async function ensurePurchaseFromApprovedQuote(quoteSupplierId: string, createdBy: string) {
  const existing = await prismaClient.purchase.findFirst({
    where: {quoteSupplierId},
    select: {id: true},
  })

  if (existing) {
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

