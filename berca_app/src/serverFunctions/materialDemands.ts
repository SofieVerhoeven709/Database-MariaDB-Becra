'use server'

import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {
  createMaterialDemandSchema,
  updateMaterialDemandSchema,
  removeMaterialDemandSourceSchema,
  assignMaterialDemandSourceSchema,
  createManualDemandSourceActionSchema,
} from '@/schemas/materialDemandSchemas'
import {
  adjustInventoryStockForMaterial,
  ensureMaterialDemandSourceType,
  updateMaterialDemandSourceReservedQtyWithStockSync,
} from '@/dal/materialDemands'
import {DEMAND_PERMISSION_LEVELS} from '@/constants'

const REVALIDATE_PATH = '/departments/purchasing/materialDemand'

export const createMaterialDemandAction = protectedServerFunction({
  schema: createMaterialDemandSchema,
  functionName: 'Create material demand action',
  serverFn: async ({data, logger, profile}) => {
    const isManagerOrAdmin = profile.RoleLevelEmployee.some(
      rle => rle.RoleLevel.Role.name === 'Administrator' || rle.RoleLevel.SubRole.level >= 80,
    )

    if (!isManagerOrAdmin) {
      throw new Error('Only managers can create material demand rows.')
    }

    const existing = await prismaClient.materialDemand.findFirst({
      where: {materialId: data.materialId},
      select: {id: true},
    })

    if (existing) {
      throw new Error('A material demand row already exists for this material.')
    }

    if ((data.reservedQty ?? 0) > data.totalRequiredQty) {
      throw new Error('Reserved quantity cannot be greater than total required quantity.')
    }

    const material = await prismaClient.material.findUnique({
      where: {id: data.materialId},
      select: {isSerialTracked: true},
    })

    if (material?.isSerialTracked && (data.reservedQty ?? 0) > data.totalRequiredQty) {
      throw new Error('Reserved quantity cannot exceed required quantity for serial-tracked materials.')
    }

    const id = crypto.randomUUID()
    await prismaClient.materialDemand.create({
      data: {
        id,
        materialId: data.materialId,
        totalRequiredQty: data.totalRequiredQty,
        reservedQty: data.reservedQty ?? 0,
        createdAt: new Date(),
      },
    })

    logger.info(`Material demand created: ${id}`)
    revalidatePath(REVALIDATE_PATH)
  },
})

export const updateMaterialDemandAction = protectedServerFunction({
  schema: updateMaterialDemandSchema,
  functionName: 'Update material demand action',
  serverFn: async ({data, logger, profile}) => {
    const isManagerOrAdmin = profile.RoleLevelEmployee.some(
      rle => rle.RoleLevel.Role.name === 'Administrator' || rle.RoleLevel.SubRole.level >= 80,
    )
    // Managers can edit required qty; editors can adjust reserved qty.
    const canEditReservedQty =
      isManagerOrAdmin || profile.RoleLevelEmployee.some(rle => rle.RoleLevel.SubRole.level >= 40)

    const existing = await prismaClient.materialDemand.findUnique({
      where: {id: data.id},
      select: {totalRequiredQty: true, reservedQty: true},
    })

    if (!existing) {
      throw new Error('Material demand row not found.')
    }

    if (!isManagerOrAdmin && data.totalRequiredQty !== existing.totalRequiredQty) {
      throw new Error('Only managers can modify required quantity.')
    }

    if (!canEditReservedQty && data.reservedQty !== (existing.reservedQty ?? 0)) {
      throw new Error('Only editors can modify reserved quantity.')
    }

    if (data.reservedQty > data.totalRequiredQty) {
      throw new Error('Reserved quantity cannot be greater than total required quantity.')
    }

    const demand = await prismaClient.materialDemand.findUnique({
      where: {id: data.id},
      select: {
        totalRequiredQty: true,
        reservedQty: true,
        Material: {select: {isSerialTracked: true}},
      },
    })

    if (!demand) throw new Error('Material demand row not found.')

    // Serial-tracked items are physically unique — over-reserving makes no sense.
    if (demand.Material.isSerialTracked && data.reservedQty > data.totalRequiredQty) {
      throw new Error('Reserved quantity cannot exceed required quantity for serial-tracked materials.')
    }

    await prismaClient.materialDemand.update({
      where: {id: data.id},
      data: {
        totalRequiredQty: data.totalRequiredQty,
        reservedQty: data.reservedQty,
      },
    })

    logger.info(`Material demand updated: ${data.id}`)
    revalidatePath(REVALIDATE_PATH)
  },
})

export const removeMaterialDemandSourceAction = protectedServerFunction({
  schema: removeMaterialDemandSourceSchema,
  functionName: 'Remove material demand source action',
  serverFn: async ({data, logger, profile}) => {
    const isManagerOrAdmin = profile.RoleLevelEmployee.some(
      rle => rle.RoleLevel.Role.name === 'Administrator' || rle.RoleLevel.SubRole.level >= 80,
    )

    if (!isManagerOrAdmin) {
      throw new Error('Only managers can remove source lines.')
    }

    await prismaClient.$transaction(async tx => {
      const source = await tx.materialDemandSource.findFirst({
        where: {
          id: data.sourceId,
          materialDemandId: data.materialDemandId,
        },
        select: {
          id: true,
          materialDemandId: true,
          requiredQty: true,
          reservedQty: true,
        },
      })

      if (!source) {
        throw new Error('Source line not found.')
      }

      const demand = await tx.materialDemand.findUnique({
        where: {id: data.materialDemandId},
        select: {
          id: true,
          totalRequiredQty: true,
          QuoteSupplierLine: {
            where: {selected: true},
            select: {quantity: true},
          },
        },
      })

      if (!demand) {
        throw new Error('Material demand row not found.')
      }

      const materialId = (
        await tx.materialDemand.findUnique({
          where: {id: data.materialDemandId},
          select: {materialId: true},
        })
      )?.materialId

      const selectedQty = demand.QuoteSupplierLine.reduce((sum, line) => sum + line.quantity, 0)
      const nextTotalRequiredQty = Math.max(demand.totalRequiredQty - source.requiredQty, 0)

      // Prevent removing a source if it would undercut selected quote quantities.
      if (selectedQty > nextTotalRequiredQty) {
        throw new Error(
          `Cannot remove this source line. Selected quote quantity (${selectedQty}) would exceed required quantity (${nextTotalRequiredQty}).`,
        )
      }

      await tx.materialDemandSource.delete({where: {id: source.id}})
      if ((source.reservedQty ?? 0) > 0 && materialId) {
        await adjustInventoryStockForMaterial(materialId, source.reservedQty ?? 0, tx)
      }
      await tx.materialDemand.update({
        where: {id: data.materialDemandId},
        data: {
          totalRequiredQty: nextTotalRequiredQty,
          reservedQty: selectedQty,
        },
      })
    })

    logger.info(`Material demand source removed: ${data.sourceId}`)
    revalidatePath(REVALIDATE_PATH)
  },
})

function getHighestLevel(profile: {RoleLevelEmployee: Array<{RoleLevel: {SubRole: {level: number}}}>}) {
  return Math.max(0, ...profile.RoleLevelEmployee.map(r => r.RoleLevel.SubRole.level))
}

export const assignMaterialDemandSourceAction = protectedServerFunction({
  schema: assignMaterialDemandSourceSchema,
  functionName: 'Assign material demand source action',
  serverFn: async ({data, profile, logger}) => {
    if (getHighestLevel(profile) < DEMAND_PERMISSION_LEVELS.assign) {
      throw new Error('You do not have permission to assign demand sources.')
    }

    await updateMaterialDemandSourceReservedQtyWithStockSync({
      sourceId: data.sourceId,
      materialDemandId: data.materialDemandId,
      newReservedQty: data.reservedQty,
      employeeId: profile.id,
    })

    logger.info(`Demand source assigned: ${data.sourceId}`)
    revalidatePath(REVALIDATE_PATH)
  },
})

export const createManualDemandSourceAction = protectedServerFunction({
  schema: createManualDemandSourceActionSchema,
  functionName: 'Create manual demand source action',
  serverFn: async ({data, profile, logger}) => {
    if (getHighestLevel(profile) < DEMAND_PERMISSION_LEVELS.addSource) {
      throw new Error('You do not have permission to add demand sources.')
    }

    const demand = await prismaClient.materialDemand.findUnique({
      where: {id: data.materialDemandId},
      select: {id: true},
    })
    if (!demand) throw new Error('Material demand not found.')

    const sourceTypeId = await ensureMaterialDemandSourceType('Manual', profile.id, 'Manually created demand source')

    await prismaClient.$transaction(async tx => {
      await tx.materialDemandSource.create({
        data: {
          id: crypto.randomUUID(),
          materialDemandId: data.materialDemandId,
          sourceTypeId,
          sourceReferenceId: null,
          description: data.label,
          requiredQty: data.requiredQty,
          reservedQty: 0,
          createdAt: new Date(),
          createdBy: profile.id,
        },
      })

      await tx.materialDemand.update({
        where: {id: data.materialDemandId},
        data: {totalRequiredQty: {increment: data.requiredQty}},
      })
    })

    logger.info(`Manual demand source created for demand ${data.materialDemandId}`)
    revalidatePath(REVALIDATE_PATH)
  },
})
