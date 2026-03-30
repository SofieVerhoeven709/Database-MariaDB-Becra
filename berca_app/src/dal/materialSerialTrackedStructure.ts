import {prismaClient} from '@/dal/prismaClient'

export async function getSerialTrackedStructureBySerialTrackedId(serialTrackedId: string) {
  return prismaClient.materialSerialTrackedStructure.findMany({
    where: {serialTrackedId, deleted: false},
    orderBy: {shortDescription: 'asc'},
  })
}
