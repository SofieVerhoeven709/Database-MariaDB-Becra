import 'server-only'
import {prismaClient} from '@/dal/prismaClient'
import type {DepartmentExtern} from '@/generated/prisma/client'
import type {DepartmentExternWithAudit} from '../mapper/departmentExterns'

export async function getDepartmentExterns(): Promise<DepartmentExtern[] | null> {
  return prismaClient.departmentExtern.findMany({orderBy: {name: 'asc'}})
}

export async function getDepartmentExternsWithAudit(): Promise<DepartmentExternWithAudit[]> {
  return prismaClient.departmentExtern.findMany({
    include: {
      Employee_DepartmentExtern_createdByToEmployee: {select: {firstName: true, lastName: true}},
      Employee_DepartmentExtern_deletedByToEmployee: {select: {firstName: true, lastName: true}},
    },
    orderBy: {name: 'asc'},
  })
}
