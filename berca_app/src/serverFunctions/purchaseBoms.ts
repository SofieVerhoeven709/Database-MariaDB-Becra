'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {
  createPurchaseBOMSchema,
  updatePurchaseBOMSchema,
  purchaseBOMIdSchema,
  updatePurchaseBOMStructureSchema,
  purchaseBOMStructureIdSchema,
  createPurchaseBOMStructureSchema,
} from '@/schemas/purchaseBomSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {searchProjects, getDescendantBOMIds, getAncestorBOMIds} from '@/dal/purchaseBoms'
import type {ProjectOption} from '@/types/purchaseBom'
import {createTargetForType} from '@/dal/targets'

// ─── PurchaseBOM CRUD ───────────────────────────────────────────────────────────

export const createPurchaseBOMAction = protectedServerFunction({
  schema: createPurchaseBOMSchema,
  functionName: 'Create purchase BOM action',
  serverFn: async ({data, logger, profile}) => {
    const id = crypto.randomUUID()
    const target = await createTargetForType('PurchaseBom', profile.id)
    logger.info(`Creating purchase BOM for project ${data.projectId}, createdBy: ${profile.id}`)
    await prismaClient.purchaseBOM.create({
      data: {
        ...data,
        id,
        createdBy: profile.id,
        createdAt: new Date(),
        targetId: target.id,
        projectBOMId: data.projectBOMId,
      },
    })
    logger.info(`Purchase BOM created: ${id}`)
    revalidatePath('/purchaseBOMs')
  },
})

export const updatePurchaseBOMAction = protectedServerFunction({
  schema: updatePurchaseBOMSchema,
  functionName: 'Update purchase BOM action',
  serverFn: async ({data: {id, ...data}, logger}) => {
    // purchased=true forces materialClosed=true on this BOM only — no descendant cascade.
    const bomUpdateData = {
      ...data,
      ...(data.purchased === true ? {materialClosed: true} : {}),
    }

    const updatedBom = await prismaClient.purchaseBOM.update({
      where: {id},
      data: bomUpdateData,
      select: {projectBOMId: true},
    })
    logger.info(`Purchase BOM updated: ${id}`)

    if (data.purchased === true) {
      // Mark every active structure on THIS BOM as purchased
      await prismaClient.purchaseBOMStructure.updateMany({
        where: {purchaseBOMId: id, deleted: false},
        data: {purchased: true},
      })
      logger.info(`Marked all active structures as purchased for PurchaseBOM: ${id}`)

      // Mirror materialClosed=true onto the linked ProjectBOM
      if (updatedBom.projectBOMId) {
        await prismaClient.projectBOM.update({
          where: {id: updatedBom.projectBOMId},
          data: {materialClosed: true},
        })
        logger.info(`Set materialClosed=true on ProjectBOM: ${updatedBom.projectBOMId}`)
      }
    }

    revalidatePath('/purchaseBOMs')
  },
})

export const softDeletePurchaseBOMAction = protectedServerFunction({
  schema: purchaseBOMIdSchema,
  functionName: 'Soft delete purchase BOM action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.purchaseBOM.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Purchase BOM soft deleted: ${id}`)
    revalidatePath('/purchaseBOMs')
  },
})

export const hardDeletePurchaseBOMAction = protectedServerFunction({
  schema: purchaseBOMIdSchema,
  functionName: 'Hard delete purchase BOM action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.purchaseBOM.delete({where: {id}})
    logger.info(`Purchase BOM hard deleted: ${id}`)
    revalidatePath('/purchaseBOMs')
  },
})

export const undeletePurchaseBOMAction = protectedServerFunction({
  schema: purchaseBOMIdSchema,
  functionName: 'Undelete purchase BOM action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.purchaseBOM.update({
      where: {id},
      data: {deleted: false, deletedAt: null, deletedBy: null},
    })
    logger.info(`Purchase BOM undeleted: ${id}`)
    revalidatePath('/purchaseBOMs')
  },
})

// ─── PurchaseBOMStructure — execution-only updates ─────────────────────────────
// Structures are never created directly on the purchase side.
// They are auto-created by syncPurchaseBOMStructure when a ProjectBOMStructure
// is marked readyForPurchase=true on the project side.
export const createPurchaseBOMStructureAction = protectedServerFunction({
  schema: createPurchaseBOMStructureSchema,
  functionName: 'Create purchase BOM structure action',
  serverFn: async ({data, logger, profile}) => {
    const id = crypto.randomUUID()
    await prismaClient.purchaseBOMStructure.create({
      data: {
        ...data,
        id,
        createdBy: profile.id,
        createdAt: new Date(),
      },
    })
    logger.info(`Purchase BOM structure created: ${id}`)
    revalidatePath('/purchaseBOMs')
  },
})

export const updatePurchaseBOMStructureAction = protectedServerFunction({
  schema: updatePurchaseBOMStructureSchema,
  functionName: 'Update purchase BOM structure action',
  serverFn: async ({data: {id, purchased, ...data}, logger}) => {
    // Update execution fields on BOMExecution
    await prismaClient.bOMExecution.update({
      where: {projectBOMStructureId: data.projectBOMStructureId},
      data: {
        reservedQuantity: data.reservedQuantity,
        issuedQuantity: data.issuedQuantity,
        notDeliverable: data.notDeliverable,
      },
    })

    // Update purchased flag directly on PurchaseBOMStructure — no roll-up logic
    if (purchased !== undefined) {
      await prismaClient.purchaseBOMStructure.update({
        where: {id},
        data: {purchased},
      })
    }

    logger.info(`Purchase BOM structure updated: ${id}`)
    revalidatePath('/purchaseBOMs')
  },
})

export const softDeletePurchaseBOMStructureAction = protectedServerFunction({
  schema: purchaseBOMStructureIdSchema,
  functionName: 'Soft delete purchase BOM structure action',
  serverFn: async ({data: {id}, profile, logger}) => {
    await prismaClient.purchaseBOMStructure.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy: profile.id},
    })
    logger.info(`Purchase BOM structure soft deleted: ${id}`)
    revalidatePath('/purchaseBOMs')
  },
})

export const hardDeletePurchaseBOMStructureAction = protectedServerFunction({
  schema: purchaseBOMStructureIdSchema,
  functionName: 'Hard delete purchase BOM structure action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.purchaseBOMStructure.delete({where: {id}})
    logger.info(`Purchase BOM structure hard deleted: ${id}`)
    revalidatePath('/purchaseBOMs')
  },
})

export const restorePurchaseBOMStructureAction = protectedServerFunction({
  schema: purchaseBOMStructureIdSchema,
  functionName: 'Restore purchase BOM structure action',
  serverFn: async ({data: {id}, logger}) => {
    await prismaClient.purchaseBOMStructure.update({
      where: {id},
      data: {deleted: false, deletedAt: null, deletedBy: null},
    })
    logger.info(`Purchase BOM structure restored: ${id}`)
    revalidatePath('/purchaseBOMs')
  },
})

// ─── Purchase search ────────────────────────────────────────────────────────────
export async function searchPurchasesAction(query: string): Promise<ProjectOption[]> {
  return searchProjects(query)
}
