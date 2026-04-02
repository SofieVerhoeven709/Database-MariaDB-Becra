import {prismaClient} from '@/dal/prismaClient'

export async function getSerialTrackedStructureBySerialTrackedId(serialTrackedId: string) {
  return prismaClient.materialSerialTrackedStructure.findMany({
    where: { serialTrackedId, deleted: false },
    orderBy: { shortDescription: 'asc' },
    include: {
      MaterialSerialTrack: {
        select: {
          beNumber: true,
          materialGroupId: true,
          MaterialGroup: {
            select: {
              id: true,
              groupA: true,
              groupB: true,
              groupC: true,
              groupD: true,
              // Add more fields if needed
            }
          }
        }
      }
    }
  });
}

export async function getSerialTrackedStructureByBeNumber(beNumber: string) {
  return prismaClient.materialSerialTrackedStructure.findFirst({
    where: {
      MaterialSerialTrack: {
        beNumber,
      },
      deleted: false,
    },
    include: {
      MaterialSerialTrack: {
        select: {
          id: true,
          beNumber: true,
        },
      },
    },
  });
}

export async function getSerialTrackedStructuresBySerialTrackedIds(serialTrackedIds: string[]) {
  if (serialTrackedIds.length === 0) return []

  return prismaClient.materialSerialTrackedStructure.findMany({
    where: {
      serialTrackedId: {in: serialTrackedIds},
      deleted: false,
    },
    orderBy: {shortDescription: 'asc'},
    select: {
      id: true,
      serialTrackedId: true,
      shortDescription: true,
      longDescription: true,
    },
  })
}

