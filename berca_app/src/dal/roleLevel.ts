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
  // Fetch a single role level with its role and sub-role details.
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
    // Stable ordering for role/sub-role dropdowns.
    orderBy: [{Role: {name: 'asc'}}, {SubRole: {level: 'asc'}}],
  })
}
