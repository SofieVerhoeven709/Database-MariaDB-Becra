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
    material: {
      select: {
        id: true
        beNumber: true
        materialGroupIdA: true
      }
    }
    MaterialGroup: {
      select: {
        id: true
        groupA: true
        groupB: true
        groupC: true
        groupD: true
      }
    }
    WarehousePlace: {
      where: {
        deleted: false
      }
      select: {
        id: true
        abbreviation: true
        place: true
        shelf: true
        column: true
        layer: true
        layerPlace: true
      }
    }
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
      material: {
        select: {
          id: true,
          beNumber: true,
          materialGroupIdA: true,
        },
      },
      MaterialGroup: {
        select: {
          id: true,
          groupA: true,
          groupB: true,
          groupC: true,
          groupD: true,
        },
      },
      WarehousePlace: {
        where: {deleted: false},
        select: {
          id: true,
          abbreviation: true,
          place: true,
          shelf: true,
          column: true,
          layer: true,
          layerPlace: true,
        },
      },
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
      material: {
        select: {
          id: true,
          beNumber: true,
          materialGroupIdA: true,
        },
      },
      MaterialGroup: {
        select: {
          id: true,
          groupA: true,
          groupB: true,
          groupC: true,
          groupD: true,
        },
      },
      WarehousePlace: {
        where: {deleted: false},
        select: {
          id: true,
          abbreviation: true,
          place: true,
          shelf: true,
          column: true,
          layer: true,
          layerPlace: true,
        },
      },
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
  materialGroupId?: string | null
  fromLocation?: string | null
  toLocation?: string | null
  preferredSupplier?: string | null
  rejected?: boolean | null
  additionalInfo?: string | null
  becraCode?: string | null
  beNumber?: string | null
  warehousePlaceId?: string | null
}) {
  console.log('[DAL:createSerialTracked] input:', data)
  const {materialId, companyId, projectId, createdBy, deletedBy, warehousePlaceId, ...rest} = data

  const prismaData: any = {...rest}
  if (materialId) prismaData.material = {connect: {id: materialId}}
  if (companyId) prismaData.Company = {connect: {id: companyId}}
  if (projectId) prismaData.Project = {connect: {id: projectId}}
  if (createdBy) prismaData.Employee = {connect: {id: createdBy}}
  if (deletedBy) prismaData.Employee_MaterialSerialTrack_deletedByToEmployee = {connect: {id: deletedBy}}

  const created = await prismaClient.$transaction(async tx => {
    const createdItem = await tx.materialSerialTrack.create({
      data: prismaData,
    })

    if (warehousePlaceId !== undefined) {
      await tx.warehousePlace.updateMany({
        where: {serialTrackedId: createdItem.id, deleted: false},
        data: {serialTrackedId: null},
      })

      if (warehousePlaceId) {
        await tx.warehousePlace.update({
          where: {id: warehousePlaceId},
          data: {
            serialTrackedId: createdItem.id,
            beNumber: createdItem.beNumber ?? null,
          },
        })
      }
    }

    return createdItem
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
    beNumber?: string | null
    warehousePlaceId?: string | null
  },
) {
  const {warehousePlaceId, ...rest} = data

  return prismaClient.$transaction(async tx => {
    const updatedItem = await tx.materialSerialTrack.update({
      where: {id},
      data: {
        ...rest,
        updatedAt: new Date(),
      },
    })

    if (warehousePlaceId !== undefined) {
      await tx.warehousePlace.updateMany({
        where: {serialTrackedId: id, deleted: false},
        data: {serialTrackedId: null},
      })

      if (warehousePlaceId) {
        await tx.warehousePlace.update({
          where: {id: warehousePlaceId},
          data: {
            serialTrackedId: id,
            beNumber: updatedItem.beNumber ?? null,
          },
        })
      }
    } else if (rest.beNumber !== undefined) {
      await tx.warehousePlace.updateMany({
        where: {serialTrackedId: id, deleted: false},
        data: {beNumber: rest.beNumber ?? null},
      })
    }

    return updatedItem
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
