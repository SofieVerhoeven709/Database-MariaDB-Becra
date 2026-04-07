import {prismaClient} from '@/dal/prismaClient'

export async function getSerialTrackedStructureBySerialTrackedId(serialTrackedId: string) {
  return prismaClient.materialSerialTrackedStructure.findMany({
    where: {serialTrackedId, deleted: false},
    orderBy: {shortDescription: 'asc'},
    select: {
      id: true,
      serialTrackedId: true,
      certificateId: true,
      materialSpecId: true,
      referenceDocId: true,
      documentId: true,
      shortDescription: true,
      longDescription: true,
      management: true,
      date: true,
      expiredDate: true,
      warehousePlaceId: true,
      valid: true,
      additionalInfo: true,
      beNumber: true,
      beParentPart: true,
      serialCode: true,
      tag: true,
      preferredSupplier: true,
      brandName: true,
      brandOrderNr: true,
      unit: true,
      unitQuantity: true,
      unitPieces: true,
      unitWeightKg: true,
      quantityRequired: true,
      quantityReserved: true,
      quantityIssued: true,
      rejected: true,
      updatedAt: true,
      createdBy: true,
      deleted: true,
      deletedAt: true,
      deletedBy: true,
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
            },
          },
        },
      },
    },
  })
}

export async function getSerialTrackedStructureByBeNumber(beNumber: string) {
  return prismaClient.materialSerialTrackedStructure.findFirst({
    where: {
      MaterialSerialTrack: {
        beNumber,
      },
      deleted: false,
    },
    select: {
      id: true,
      serialTrackedId: true,
      beNumber: true,
      shortDescription: true,
      longDescription: true,
      MaterialSerialTrack: {
        select: {
          id: true,
          beNumber: true,
        },
      },
    },
  })
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
