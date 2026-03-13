import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

const employeeSelect = {select: {id: true, firstName: true, lastName: true}} as const

const include = {
  Employee: employeeSelect,
} as const

export async function getPurchaseBoms() {
  return prismaClient.purchaseOrderBecra.findMany({
    where: {deleted: false},
    include,
    orderBy: {date: 'desc'},
  })
}

export async function getPurchaseBomById(id: string) {
  return prismaClient.purchaseOrderBecra.findUnique({where: {id}, include})
}

