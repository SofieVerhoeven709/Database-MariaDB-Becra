import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

const employeeSelect = {select: {id: true, firstName: true, lastName: true}} as const

const quoteSupplierInclude = {
  Employee: employeeSelect,
  Employee_QuoteSupplier_deletedByToEmployee: employeeSelect,
  Company: {select: {id: true, name: true, number: true}},
  PaymentCondition: {select: {id: true, name: true}},
} as const

export async function getQuoteSuppliers() {
  return prismaClient.quoteSupplier.findMany({
    include: quoteSupplierInclude,
    orderBy: {validUntill: 'desc'},
  })
}

export async function getQuoteSupplierById(id: string) {
  return prismaClient.quoteSupplier.findUnique({where: {id}, include: quoteSupplierInclude})
}

export async function getPaymentConditionOptions() {
  return prismaClient.paymentCondition.findMany({
    where: {deleted: false},
    select: {id: true, name: true},
    orderBy: {name: 'asc'},
  })
}

