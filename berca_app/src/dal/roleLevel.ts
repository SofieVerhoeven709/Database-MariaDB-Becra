import {prismaClient} from '@/dal/prismaClient'
import type {RoleLevel} from '@/generated/prisma/client'

export async function getRolelevelById(id: string): Promise<RoleLevel | null> {
  return prismaClient.roleLevel.findFirst({
    where: {id},
    include: {
      Role: true, // RoleLevel → Role
      SubRole: true, // RoleLevel → SubRole
    },
  })
}
