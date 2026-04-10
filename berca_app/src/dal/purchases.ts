import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

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

