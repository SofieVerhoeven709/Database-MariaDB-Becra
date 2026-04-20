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

  return prismaClient.materialSerialTrack.findMany({
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
  lastInspectionDate?: Date | null
  nextInspectionDate?: Date | null
  inspectionIntervalValue?: number | null
  inspectionIntervalUnit?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | null
}) {
  const {
    materialId,
    companyId,
    projectId,
    createdBy,
    deletedBy,
    warehousePlaceId,
    lastInspectionDate,
    nextInspectionDate,
    inspectionIntervalValue,
    inspectionIntervalUnit,
    ...rest
  } = data

  // Calculate nextInspectionDate if not provided but lastInspectionDate and inspectionIntervalValue are provided
  let calculatedNextInspectionDate = nextInspectionDate
  if (!calculatedNextInspectionDate && lastInspectionDate && inspectionIntervalValue) {
    const nextDate = new Date(lastInspectionDate)
    // Default to DAY if unit is not specified
    const unit = inspectionIntervalUnit || 'DAY'
    if (unit === 'DAY') {
      nextDate.setDate(nextDate.getDate() + inspectionIntervalValue)
    } else if (unit === 'WEEK') {
      nextDate.setDate(nextDate.getDate() + inspectionIntervalValue * 7)
    } else if (unit === 'MONTH') {
      nextDate.setMonth(nextDate.getMonth() + inspectionIntervalValue)
    } else if (unit === 'YEAR') {
      nextDate.setFullYear(nextDate.getFullYear() + inspectionIntervalValue)
    }
    calculatedNextInspectionDate = nextDate
  }

  const prismaData: any = {
    ...rest,
    lastInspectionDate,
    nextInspectionDate: calculatedNextInspectionDate,
    inspectionIntervalValue,
    inspectionIntervalUnit,
  }
  if (materialId) prismaData.material = {connect: {id: materialId}}
  if (companyId) prismaData.Company = {connect: {id: companyId}}
  if (projectId) prismaData.Project = {connect: {id: projectId}}
  if (createdBy) prismaData.Employee = {connect: {id: createdBy}}
  if (deletedBy) prismaData.Employee_MaterialSerialTrack_deletedByToEmployee = {connect: {id: deletedBy}}

  return prismaClient.$transaction(async tx => {
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
    lastInspectionDate?: Date | null
    nextInspectionDate?: Date | null
    inspectionIntervalValue?: number | null
    inspectionIntervalUnit?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | null
  },
) {
  const {
    warehousePlaceId,
    lastInspectionDate,
    nextInspectionDate,
    inspectionIntervalValue,
    inspectionIntervalUnit,
    ...rest
  } = data

  // Calculate nextInspectionDate if not provided but lastInspectionDate and inspectionIntervalValue are provided
  let calculatedNextInspectionDate = nextInspectionDate
  if (!calculatedNextInspectionDate && lastInspectionDate && inspectionIntervalValue) {
    const nextDate = new Date(lastInspectionDate)
    // Default to DAY if unit is not specified
    const unit = inspectionIntervalUnit || 'DAY'
    if (unit === 'DAY') {
      nextDate.setDate(nextDate.getDate() + inspectionIntervalValue)
    } else if (unit === 'WEEK') {
      nextDate.setDate(nextDate.getDate() + inspectionIntervalValue * 7)
    } else if (unit === 'MONTH') {
      nextDate.setMonth(nextDate.getMonth() + inspectionIntervalValue)
    } else if (unit === 'YEAR') {
      nextDate.setFullYear(nextDate.getFullYear() + inspectionIntervalValue)
    }
    calculatedNextInspectionDate = nextDate
  }

  return prismaClient.$transaction(async tx => {
    const updatedItem = await tx.materialSerialTrack.update({
      where: {id},
      data: {
        ...rest,
        lastInspectionDate,
        nextInspectionDate: calculatedNextInspectionDate,
        inspectionIntervalValue,
        inspectionIntervalUnit,
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

export async function undeleteSerialTracked(id: string) {
  return prismaClient.materialSerialTrack.update({
    where: {id},
    data: {
      deleted: false,
      deletedAt: null,
      deletedBy: null,
    },
  })
}

export async function hardDeleteSerialTracked(id: string) {
  return prismaClient.$transaction(async tx => {
    await tx.warehousePlace.updateMany({
      where: {serialTrackedId: id},
      data: {serialTrackedId: null, beNumber: null},
    })

    await tx.materialMovement.deleteMany({where: {serieId: id}})
    await tx.materialSerialTrackedStructure.deleteMany({where: {serialTrackedId: id}})

    return tx.materialSerialTrack.delete({where: {id}})
  })
}

// cloneSerialTracked removed: no current callers in the codebase.
