import 'server-only'
import {prismaClient} from '@/dal/prismaClient'
import type {DepartmentExtern} from '@/generated/prisma/client'

export async function getDepartmentExterns(): Promise<DepartmentExtern[] | null> {
  return prismaClient.departmentExtern.findMany()
}
