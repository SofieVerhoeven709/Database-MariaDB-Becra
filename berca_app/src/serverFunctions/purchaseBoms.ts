'use server'
import {revalidatePath} from 'next/cache'
import {prismaClient} from '@/dal/prismaClient'
import {
  createPurchaseBOMSchema,
  updatePurchaseBOMSchema,
  purchaseBOMIdSchema,
  createPurchaseBOMStructureSchema,
  updatePurchaseBOMStructureSchema,
  purchaseBOMStructureIdSchema,
} from '@/schemas/purchaseBomSchemas'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {searchProjects, getDescendantBOMIds, getAncestorBOMIds} from '@/dal/purchaseBoms'
import type {ProjectOption} from '@/types/purchaseBom'

// ─── PurchaseBOM CRUD ───────────────────────────────────────────────────────────

export const createPurchaseBOMAction = protectedServerFunction({
  schema: createPurchaseBOMSchema,
  functionName: 'Create purchase BOM action',
  serverFn: async ({data, logger, profile}) => {
    const id = crypto.randomUUID()
    logger.info(`Creating purchase BOM for project ${data.projectId}, createdBy: ${profile.id}`)
    await prismaClient.purchaseBOM.create({
      data: {
        ...data,
        id,
        createdBy: profile.id,
        createdAt: new Date(),
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
    // Check if readyForPurchase is being set to true
    const wasReadyForPurchase = data.readyForPurchase

    await prismaClient.purchaseBOM.update({where: {id}, data})
    logger.info(`Purchase BOM updated: ${id}`)

    if (wasReadyForPurchase) {
      // ── Cascade readyForPurchase=true to all structures of this BOM ──────────
      const now = new Date()
      await prismaClient.purchaseBOMStructure.updateMany({
        where: {purchaseBOMId: id, deleted: false},
        data: {
          readyForPurchase: true,
          readyForPurchaseDate: now,
        },
      })
      logger.info(`Cascaded readyForPurchase=true to structures of BOM: ${id}`)

      // ── Cascade readyForPurchase=true to all descendant BOMs + their structures
      const descendantIds = await getDescendantBOMIds(id)
      if (descendantIds.length > 0) {
        await prismaClient.purchaseBOM.updateMany({
          where: {id: {in: descendantIds}},
          data: {readyForPurchase: true},
        })
        await prismaClient.purchaseBOMStructure.updateMany({
          where: {purchaseBOMId: {in: descendantIds}, deleted: false},
          data: {
            readyForPurchase: true,
            readyForPurchaseDate: now,
          },
        })
        logger.info(`Cascaded readyForPurchase=true to ${descendantIds.length} descendant BOM(s): ${id}`)
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

// ─── PurchaseBOMStructure CRUD ──────────────────────────────────────────────────

export const createPurchaseBOMStructureAction = protectedServerFunction({
  schema: createPurchaseBOMStructureSchema,
  functionName: 'Create purchase BOM structure action',
  serverFn: async ({data, logger, profile}) => {
    // ── Guard: block creation if the BOM is materialClosed ───────────────────
    const bom = await prismaClient.purchaseBOM.findUniqueOrThrow({
      where: {id: data.purchaseBOMId},
      select: {materialClosed: true, readyForPurchase: true},
    })

    if (bom.materialClosed) {
      throw new Error('Cannot add structures to a material-closed BOM.')
    }

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

    // ── If the BOM (or any ancestor) was readyForPurchase=true, flip it back ─
    // We reset the BOM itself and all its ancestors.
    const bomIdsToReset: string[] = [data.purchaseBOMId]
    const ancestorIds = await getAncestorBOMIds(data.purchaseBOMId)
    bomIdsToReset.push(...ancestorIds)

    if (bomIdsToReset.length > 0) {
      await prismaClient.purchaseBOM.updateMany({
        where: {id: {in: bomIdsToReset}, readyForPurchase: true},
        data: {readyForPurchase: false},
      })
      logger.info(`Reset readyForPurchase=false on BOM(s) [${bomIdsToReset.join(', ')}] after new structure added`)
    }

    revalidatePath('/purchaseBOMs')
  },
})

export const updatePurchaseBOMStructureAction = protectedServerFunction({
  schema: updatePurchaseBOMStructureSchema,
  functionName: 'Update purchase BOM structure action',
  serverFn: async ({data: {id, ...data}, logger}) => {
    await prismaClient.purchaseBOMStructure.update({where: {id}, data})
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
