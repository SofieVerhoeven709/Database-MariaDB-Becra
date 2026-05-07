import 'server-only'
import {prismaClient} from '@/dal/prismaClient'
import type {Function} from '@/generated/prisma/client'
import type {FunctionWithAudit} from '../mapper/functions'

export async function getFunctions(): Promise<Function[] | null> {
  return prismaClient.function.findMany({orderBy: {name: 'asc'}})
}

export async function getFunctionsWithAudit(): Promise<FunctionWithAudit[]> {
  return prismaClient.function.findMany({
    include: {
      Employee_Function_createdByToEmployee: {select: {firstName: true, lastName: true}},
      Employee_Function_deletedByToEmployee: {select: {firstName: true, lastName: true}},
    },
    orderBy: {name: 'asc'},
  })
}
