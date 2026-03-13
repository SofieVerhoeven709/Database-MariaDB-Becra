import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

const employeeSelect = {select: {id: true, firstName: true, lastName: true}} as const

const include = {
  Employee: employeeSelect,
  Project: {select: {id: true, projectNumber: true, projectName: true}},
} as const

export async function getQuoteSuppliers() {
  return prismaClient.quoteSupplier.findMany({
    where: {deleted: false},
    include,
    orderBy: {validUntill: 'desc'},
  })
}

export async function getQuoteSupplierById(id: string) {
  return prismaClient.quoteSupplier.findUnique({where: {id}, include})
}

