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
    await prismaClient.purchaseBOM.update({where: {id}, data})
    logger.info(`Purchase BOM updated: ${id}`)

    const now = new Date()
    // Note: PurchaseBOMStructure does not have readyForPurchase — that lives on
    // ProjectBOMStructure. We only cascade the BOM-level flag here.
    const descendantIds = await getDescendantBOMIds(id)
    if (descendantIds.length > 0) {
      await prismaClient.purchaseBOM.updateMany({
        where: {id: {in: descendantIds}},
        data: data,
      })
      logger.info(`Cascaded readyForPurchase=true to ${descendantIds.length} descendant BOM(s): ${id}`)
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
  serverFn: async ({data: {id, ...data}, logger}) => {
    // Only reservedQuantity and issuedQuantity are allowed through the schema.
    await prismaClient.bOMExecution.update({where: {projectBOMStructureId: data.projectBOMStructureId}, data})
    logger.info(`Purchase BOM structure updated (execution fields): ${id}`)
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
