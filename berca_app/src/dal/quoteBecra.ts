import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

const employeeSelect = {select: {id: true, firstName: true, lastName: true}} as const

const listInclude = {
  Employee_QuoteBecra_createdByToEmployee: employeeSelect,
  Employee_QuoteBecra_deletedByToEmployee: employeeSelect,
} as const

export async function getQuoteBecras() {
  return prismaClient.quoteBecra.findMany({
    include: listInclude,
    orderBy: {date: 'desc'},
  })
}

export async function getQuoteBecraById(id: string) {
  return prismaClient.quoteBecra.findUniqueOrThrow({
    where: {id},
    include: listInclude,
  })
}

