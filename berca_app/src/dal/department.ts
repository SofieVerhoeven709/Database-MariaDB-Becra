import 'server-only'
import type {Department} from '@/generated/prisma/client'
import {prismaClient} from '@/dal/prismaClient'

export async function getDepartmentById(id: string): Promise<Department | null> {
  return prismaClient.department.findFirst({where: {id}})
}
