import 'server-only'
import type {Role} from '@/generated/prisma/client'
import {prismaClient} from '@/dal/prismaClient'

export async function getRoleById(id: string): Promise<Role | null> {
  return prismaClient.role.findFirst({where: {id}})
}
