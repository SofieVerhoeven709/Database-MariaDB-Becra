'use server'

import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {createMaterialDemandSchema, updateMaterialDemandSchema} from '@/schemas/materialDemandSchemas'

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

