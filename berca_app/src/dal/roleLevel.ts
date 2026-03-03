import 'server-only'
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

export async function getRoleLevels(): Promise<RoleLevelWithRelations[] | null> {
  return prismaClient.roleLevel.findMany({
    include: {
      Role: true,
      SubRole: true,
    },
  })
}

export async function getAllRoleLevels() {
  return prismaClient.roleLevel.findMany({
    include: {
      Role: true,
      SubRole: true,
    },
    orderBy: [{Role: {name: 'asc'}}, {SubRole: {level: 'asc'}}],
  })
}
