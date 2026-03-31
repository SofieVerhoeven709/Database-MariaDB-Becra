import 'server-only'
import {prismaClient} from '@/dal/prismaClient'
import type {Prisma} from '@/generated/prisma/client'
import {randomUUID} from 'crypto'

export type SerialTrackedWithRelations = Prisma.MaterialSerialTrackGetPayload<{
  include: {
    Employee: {
      select: {
        id: true
        firstName: true
        lastName: true
      }
    }
    // Add other valid relations here if needed
  }
}>

export async function getSerialTracked(options?: {includeDeleted?: boolean}): Promise<SerialTrackedWithRelations[]> {
  const includeDeleted = options?.includeDeleted ?? false

  const results = await prismaClient.materialSerialTrack.findMany({
    where: includeDeleted ? undefined : {deleted: false},
    include: {
      Employee: {
        select: {id: true, firstName: true, lastName: true},
      },
      // Add other valid relations here if needed
    },
    orderBy: {shortDescription: 'asc'},
  })
  console.log('[DAL:getSerialTracked] count:', results.length, 'sample:', results.slice(0, 2))
  return results
}

export async function getSerialTrackedById(id: string): Promise<SerialTrackedWithRelations | null> {
  return prismaClient.materialSerialTrack.findUnique({
    where: {id},
    include: {
      Employee: {
        select: {id: true, firstName: true, lastName: true},
      },
      // Add other valid relations here if needed
    },
  })
}

export async function createSerialTracked(data: {
  id: string
  materialId?: string | null
  companyId?: string | null
  projectId?: string | null
  createdBy?: string | null
  deletedBy?: string | null
  brandName?: string | null
  management?: string | null
  brandOrderNumber?: string | null
  orderNumber?: string | null
  shortDescription?: string | null
  longDescription?: string | null
  transactionType?: string | null
  materialGroupId?: string | null // still accepted for compatibility, but will be removed before Prisma call
  fromLocation?: string | null
  toLocation?: string | null
  preferredSupplier?: string | null
  rejected?: boolean | null
  additionalInfo?: string | null
  becraCode?: string | null
}) {
  console.log('[DAL:createSerialTracked] input:', data)
  const {
    materialId,
    companyId,
    projectId,
    createdBy,
    deletedBy,
    materialGroupId, // destructure and discard
    ...rest
  } = data
  // Remove createdBy from rest to avoid duplicate key
  if ('createdBy' in rest) delete rest.createdBy;
  const prismaData: any = {...rest}
  if (materialId) prismaData.material = { connect: { id: materialId } }
  if (companyId) prismaData.Company = {connect: {id: companyId}}
  if (projectId) prismaData.Project = {connect: {id: projectId}}
  if (createdBy) prismaData.Employee = { connect: { id: createdBy } }
  if (deletedBy) prismaData.Employee_MaterialSerialTrack_deletedByToEmployee = {connect: {id: deletedBy}}
  // materialGroupId is NOT included in prismaData
  const created = await prismaClient.materialSerialTrack.create({
    data: prismaData,
  })
  console.log('[DAL:createSerialTracked] created:', created)
  return created
}

export async function updateSerialTracked(
  id: string,
  data: {
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

export async function cloneSerialTracked(id: string, createdBy: string) {
  const original = await prismaClient.materialSerialTrack.findUniqueOrThrow({where: {id}})
  const {id: _oldId, deleted: _deleted, deletedAt: _deletedAt, deletedBy: _deletedBy, ...rest} = original
  const newId = randomUUID()
  const newSerialTracked = await prismaClient.materialSerialTrack.create({
    data: {
      ...rest,
      id: newId,
      createdBy,
      deleted: false,
      deletedAt: null,
      deletedBy: null,
    },
  })
  return newSerialTracked
}
