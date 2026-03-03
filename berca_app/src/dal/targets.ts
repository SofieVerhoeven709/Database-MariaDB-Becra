import 'server-only'
import {prismaClient} from '@/dal/prismaClient'
import {randomUUID} from 'crypto'

export async function getTargets() {
  return prismaClient.target.findMany({
    include: {
      TargetType: true,
    },
  })
}

export async function getTargetTypeByName(name: string) {
  return prismaClient.targetType.findFirstOrThrow({
    where: {name},
  })
}

export async function createTargetForType(typeName: string, createdBy: string) {
  const targetType = await getTargetTypeByName(typeName)

  return prismaClient.target.create({
    data: {
      id: randomUUID(),
      createdAt: new Date(),
      createdBy,
      targetTypeId: targetType.id,
    },
  })
}
