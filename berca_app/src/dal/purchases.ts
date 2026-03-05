import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

export async function getPurchases() {
  return prismaClient.purchase.findMany({
    where: {deleted: false},
    orderBy: {purchaseDate: 'desc'},
    include: {
      Company: true,
      Project: {
        select: {
          id: true,
          projectNumber: true,
          projectName: true,
        },
      },
      Employee: {select: {id: true, firstName: true, lastName: true}},
    },
  })
}

export async function getPurchaseById(id: string) {
  return prismaClient.purchase.findUnique({
    where: {id},
    include: {
      Company: {select: {id: true, name: true}},
      Project: {select: {id: true, projectNumber: true, projectName: true}},
      Employee: {select: {id: true, firstName: true, lastName: true}},
    },
  })
}

export async function getPurchaseDetails(purchaseId: string) {
  return prismaClient.purchaseDetail.findMany({
    where: {purchaseId, deleted: false},
    orderBy: {updatedAt: 'desc'},
    include: {
      Employee: {select: {id: true, firstName: true, lastName: true}},
      Project: {select: {id: true, projectNumber: true, projectName: true}},
    },
  })
}
