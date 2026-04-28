'use server'
import {revalidatePath} from 'next/cache'
import {randomUUID} from 'crypto'
import {createInventory, updateInventory, softDeleteInventory, restoreInventory} from '@/dal/inventory'
import {prismaClient} from '@/dal/prismaClient'
import {protectedFormAction} from '@/lib/serverFunctions'
import {createInventorySchema, updateInventorySchema, deleteInventorySchema} from '@/schemas/inventorySchemas'
import {Prisma} from '@/generated/prisma/client'
const REVALIDATE = '/departments/warehouse/inventory'

function isInventoryBeNumberUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false
  if (error.code !== 'P2002') return false
  const target = error.meta?.target
  return Array.isArray(target) ? target.includes('beNumber') : /uq_inventory_beNumber|beNumber/i.test(error.message)
}

export const createInventoryAction = protectedFormAction<typeof createInventorySchema, {id: string}>({
  schema: createInventorySchema,
  functionName: 'Create inventory item',
  globalErrorMessage: 'Could not create the inventory item, please try again.',
  serverFn: async ({data, profile, logger}) => {
    const existing = await prismaClient.inventory.findUnique({
      where: {beNumber: data.beNumber},
      select: {id: true, deleted: true},
    })

    if (existing && !existing.deleted) {
      return {
        success: false,
        errors: {
          beNumber: [
            'This BE/IOS number already exists in Inventory Management. Clear the filters/search and edit the existing item instead.',
          ],
        },
      }
    }

    if (existing?.deleted) {
      const {id: _submittedId, ...restoredData} = data
      const restoredItem = await prismaClient.inventory.update({
        where: {id: existing.id},
        data: {
          ...restoredData,
          quantityInStock: Number(data.quantityInStock),
          minQuantityInStock: Number(data.minQuantityInStock),
          maxQuantityInStock: Number(data.maxQuantityInStock),
          noValidDate: new Date(data.noValidDate),
          createdBy: profile.id,
          deleted: false,
          deletedAt: null,
          deletedBy: null,
        },
      })
      logger.info(`Inventory restored from deleted item: ${restoredItem.id}`)
      revalidatePath(REVALIDATE)
      return {success: true, data: {id: restoredItem.id}}
    }

    try {
      const createdItem = await createInventory({
        ...data,
        id: data.id || randomUUID(),
        quantityInStock: Number(data.quantityInStock),
        minQuantityInStock: Number(data.minQuantityInStock),
        maxQuantityInStock: Number(data.maxQuantityInStock),
        noValidDate: new Date(data.noValidDate),
        createdBy: profile.id,
      })
      logger.info(`Inventory created: ${createdItem.id}`)
      revalidatePath(REVALIDATE)
      return {success: true, data: {id: createdItem.id}}
    } catch (error) {
      if (isInventoryBeNumberUniqueConstraintError(error)) {
        return {
          success: false,
          errors: {
            beNumber: [
              'This BE/IOS number already exists in Inventory Management. Clear the filters/search and edit the existing item instead.',
            ],
          },
        }
      }
      throw error
    }
  },
})
export const updateInventoryAction = protectedFormAction({
  schema: updateInventorySchema,
  functionName: 'Update inventory item',
  globalErrorMessage: 'Could not update the inventory item, please try again.',
  serverFn: async ({data, logger}) => {
    const {id, ...rest} = data
    const {place: _place, ...updatableData} = rest
    const item = await updateInventory(id, {
      ...updatableData,
      quantityInStock: updatableData.quantityInStock != null ? Number(updatableData.quantityInStock) : undefined,
      minQuantityInStock:
        updatableData.minQuantityInStock != null ? Number(updatableData.minQuantityInStock) : undefined,
      maxQuantityInStock:
        updatableData.maxQuantityInStock != null ? Number(updatableData.maxQuantityInStock) : undefined,
      noValidDate: updatableData.noValidDate != null ? new Date(updatableData.noValidDate) : undefined,
    })
    logger.info(`Inventory updated: ${item.id}`)
    revalidatePath(REVALIDATE)
  },
})
export const deleteInventoryAction = protectedFormAction({
  schema: deleteInventorySchema,
  functionName: 'Delete inventory item',
  globalErrorMessage: 'Could not delete the inventory item, please try again.',
  serverFn: async ({data, profile, logger}) => {
    await softDeleteInventory(data.id, profile.id)
    logger.info(`Inventory soft-deleted: ${data.id}`)
    revalidatePath(REVALIDATE)
  },
})

export const restoreInventoryAction = protectedFormAction({
  schema: deleteInventorySchema,
  functionName: 'Restore inventory item',
  globalErrorMessage: 'Could not restore the inventory item, please try again.',
  serverFn: async ({data, logger}) => {
    const item = await restoreInventory(data.id)
    logger.info(`Inventory restored: ${item.id}`)
    revalidatePath(REVALIDATE)
  },
})
