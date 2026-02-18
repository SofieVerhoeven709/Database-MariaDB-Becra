import {prismaClient} from '@/dal/prismaClient'
import type {Prisma} from '@/generated/prisma/client'

export type RoleLevelWithRelations = Prisma.RoleLevelGetPayload<{
  include: {
    Role: true
    SubRole: true
  }
}>

export async function getRolelevelById(id: string): Promise<RoleLevelWithRelations | null> {
  return prismaClient.roleLevel.findFirst({
    where: {id},
    include: {
      Role: true,
      SubRole: true,
    },
  })
}
