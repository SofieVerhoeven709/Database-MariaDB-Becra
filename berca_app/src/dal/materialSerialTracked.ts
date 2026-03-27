import 'server-only'
import {prismaClient} from '@/dal/prismaClient'
import type {Prisma} from '@/generated/prisma/client'

export type SerialTrackedWithRelations = Prisma.MaterialSerialTrackGetPayload<{
  include: {
    Employee: {
      select: {
        id: true
        firstName: true
        lastName: true
      }
    }
  }
}>

export async function getSerialTracked(options?: {includeDeleted?: boolean}): Promise<SerialTrackedWithRelations[]> {
  const includeDeleted = options?.includeDeleted ?? false

  return prismaClient.materialSerialTrack.findMany({
    where: includeDeleted ? undefined : {deleted: false},
    include: {
      Employee: {
        select: {id: true, firstName: true, lastName: true},
      },
      Material: {
        select: {beNumber: true},
      },
    },
    orderBy: {shortDescription: 'asc'},
  })
}

export async function getSerialTrackedById(id: string): Promise<SerialTrackedWithRelations | null> {
  return prismaClient.materialSerialTrack.findUnique({
    where: {id},
    include: {
      Employee: {
        select: {id: true, firstName: true, lastName: true},
      },
      Material: {
        select: {beNumber: true},
      },
    },
  })
}

export async function createSerialTracked(data: {
  id: string
  beNumber?: string | null
  brandName?: string | null
  management?: string | null
  brandOrderNumber?: string | null
  companyId?: string | null
  orderNumber?: string | null
  shortDescription?: string | null
  longDescription?: string | null
  transactionType?: string | null
  materialGroupId?: string | null
  fromLocation?: string | null
  toLocation?: string | null
  preferredSupplier?: string | null
  rejected?: boolean | null
  additionalInfo?: string | null
  projectId?: string | null
  becraCode?: string | null
  createdBy?: string | null
}) {
  return prismaClient.materialSerialTrack.create({
    data,
  })
}

export async function updateSerialTracked(
  id: string,
  data: {
    beNumber?: string | null
    brandName?: string | null
    management?: string | null
    brandOrderNumber?: string | null
    companyId?: string | null
    orderNumber?: string | null
    shortDescription?: string | null
    longDescription?: string | null
    transactionType?: string | null
    materialGroupId?: string | null
    fromLocation?: string | null
    toLocation?: string | null
    preferredSupplier?: string | null
    rejected?: boolean | null
    additionalInfo?: string | null
    projectId?: string | null
    becraCode?: string | null
  },
) {
  return prismaClient.materialSerialTrack.update({
    where: {id},
    data: {
      ...data,
      updatedAt: new Date(),
    },
  })
}

export async function softDeleteSerialTracked(id: string, deletedBy: string) {
  return prismaClient.materialSerialTrack.update({
    where: {id},
    data: {
      deleted: true,
      deletedAt: new Date(),
      deletedBy,
    },
  })
}
