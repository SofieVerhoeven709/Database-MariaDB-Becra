'use server'

import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {
  createMaterialDemandSchema,
  updateMaterialDemandSchema,
  removeMaterialDemandSourceSchema,
} from '@/schemas/materialDemandSchemas'

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
    const canEditReservedQty = isManagerOrAdmin || profile.RoleLevelEmployee.some(rle => rle.RoleLevel.SubRole.level >= 40)

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

      const selectedQty = demand.QuoteSupplierLine.reduce((sum, line) => sum + line.quantity, 0)
      const nextTotalRequiredQty = Math.max(demand.totalRequiredQty - source.requiredQty, 0)

      if (selectedQty > nextTotalRequiredQty) {
        throw new Error(
          `Cannot remove this source line. Selected quote quantity (${selectedQty}) would exceed required quantity (${nextTotalRequiredQty}).`,
        )
      }

      await tx.materialDemandSource.delete({where: {id: source.id}})
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

