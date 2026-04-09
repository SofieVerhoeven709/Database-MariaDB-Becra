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
import {searchProjects} from '@/dal/purchaseBoms'
import type {ProjectOption} from '@/types/purchaseBom'
import {createTargetForType} from '@/dal/targets'
import {ensureMaterialDemandForMaterial, createMaterialDemandSourcesForProjectBOMStructures, validateMaterialDemandSourceAllocation} from '@/dal/materialDemands'

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
  serverFn: async ({data: {id, ...data}, logger, profile}) => {
    // purchased=true forces materialClosed/closed=true on this BOM.
    const bomUpdateData = {
      ...data,
      ...(data.purchased ? {materialClosed: true, closed: true} : {}),
    }

    const updatedBom = await prismaClient.purchaseBOM.update({
      where: {id},
      data: bomUpdateData,
      select: {projectBOMId: true},
    })
    logger.info(`Purchase BOM updated: ${id}`)

    if (data.purchased) {
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

    if (data.approvedForQuote === true) {
      // Approval releases this BOM for demand/quote flow and locks project-side structure edits.
      // First, fetch all active PurchaseBOMStructures with their ProjectBOMStructure relations
      const purchaseStructures = await prismaClient.purchaseBOMStructure.findMany({
        where: {purchaseBOMId: id, deleted: false},
        include: {
          ProjectBOMStructure: {
            select: {
              id: true,
              Material: {select: {id: true}},
              BOMExecution: {select: {requiredQuantity: true}},
            },
          },
        },
      })

      // Mark all structures as approvedForQuote
      await prismaClient.purchaseBOMStructure.updateMany({
        where: {purchaseBOMId: id, deleted: false},
        data: {approvedForQuote: true},
      })
      logger.info(`Marked all active structures as approvedForQuote for PurchaseBOM: ${id}`)

      // Create MaterialDemandSource entries for tracking source allocations
      const projectBomStructureIds = purchaseStructures
        .filter(ps => ps.ProjectBOMStructure)
        .map(ps => ps.ProjectBOMStructure!.id)

      if (projectBomStructureIds.length > 0) {
        try {
          // Get or create MaterialDemandSourceType for ProjectBOMStructure
          const sourceType = await prismaClient.materialDemandSourceType.upsert({
            where: {name: 'ProjectBOMStructure'},
            update: {},
            create: {
              id: crypto.randomUUID(),
              name: 'ProjectBOMStructure',
              description: 'Sources created when Project BOM structures are approved for purchase.',
              createdAt: new Date(),
              createdBy: profile.id,
            },
            select: {id: true},
          })

          const createdSources = await createMaterialDemandSourcesForProjectBOMStructures(
            projectBomStructureIds,
            sourceType.id,
            profile.id,
          )
          logger.info(`Created ${createdSources.length} MaterialDemandSource entries for PurchaseBOM approval: ${id}`)

          // Validate allocations don't exceed demands
          const materials = new Set(
            purchaseStructures
              .filter(ps => ps.ProjectBOMStructure?.Material)
              .map(ps => ps.ProjectBOMStructure!.Material!.id),
          )

          for (const materialId of materials) {
            const demand = await prismaClient.materialDemand.findUnique({
              where: {materialId},
              select: {id: true},
            })
            if (demand) {
              const validation = await validateMaterialDemandSourceAllocation(demand.id)
              if (!validation.valid) {
                logger.warn(`Source allocation validation warning: ${validation.message}`)
              }
            }
          }
        } catch (err) {
          logger.error(`Failed to create MaterialDemandSource entries: ${err instanceof Error ? err.message : String(err)}`)
          // Don't fail the whole approval, but log the issue
        }
      }

      if (updatedBom.projectBOMId) {
        await prismaClient.projectBOM.update({
          where: {id: updatedBom.projectBOMId},
          data: {readyForPurchase: true},
        })
        logger.info(`Set readyForPurchase=true on ProjectBOM: ${updatedBom.projectBOMId}`)
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

    await ensureMaterialDemandForMaterial(data.materialId)

    logger.info(`Purchase BOM structure created: ${id}`)
    revalidatePath('/purchaseBOMs')
  },
})

export const updatePurchaseBOMStructureAction = protectedServerFunction({
  schema: updatePurchaseBOMStructureSchema,
  functionName: 'Update purchase BOM structure action',
  serverFn: async ({data: {id, purchased, approvedForQuote, ...data}, logger, profile}) => {
    // Update execution fields on BOMExecution
    await prismaClient.bOMExecution.update({
      where: {projectBOMStructureId: data.projectBOMStructureId},
      data: {
        stockReservedQuantity: data.stockReservedQuantity,
        issuedQuantity: data.issuedQuantity,
        notDeliverable: data.notDeliverable,
      },
    })

    // Update purchased/approved flags directly on PurchaseBOMStructure — no roll-up logic
    if (purchased !== undefined || approvedForQuote !== undefined) {
      await prismaClient.purchaseBOMStructure.update({
        where: {id},
        data: {
          ...(purchased !== undefined ? {purchased} : {}),
          ...(approvedForQuote !== undefined ? {approvedForQuote} : {}),
        },
      })
    }

    // When approvedForQuote=true, create MaterialDemandSource entries for tracking
    if (approvedForQuote === true) {
      const sourceType = await prismaClient.materialDemandSourceType.upsert({
        where: {name: 'ProjectBOMStructure'},
        update: {},
        create: {
          id: crypto.randomUUID(),
          name: 'ProjectBOMStructure',
          description: 'Sources created when Project BOM structures are approved for purchase.',
          createdAt: new Date(),
          createdBy: profile.id,
        },
        select: {id: true},
      })

      const existingSource = await prismaClient.materialDemandSource.findFirst({
        where: {
          sourceTypeId: sourceType.id,
          sourceReferenceId: data.projectBOMStructureId,
        },
        select: {id: true},
      })

      if (!existingSource) {
        const created = await createMaterialDemandSourcesForProjectBOMStructures(
          [data.projectBOMStructureId],
          sourceType.id,
          profile.id,
        )
        if (created.length > 0) {
          logger.info(`Created ${created.length} MaterialDemandSource entry for approved structure: ${id}`)
        }
      }
    }

    logger.info(`Purchase BOM structure updated: ${id}`)
    revalidatePath('/purchaseBOMs')
  },
})

export const softDeletePurchaseBOMStructureAction = protectedServerFunction({
  schema: purchaseBOMStructureIdSchema,
  functionName: 'Soft delete purchase BOM structure action',
  serverFn: async ({data: {id}, profile, logger}) => {
    const structure = await prismaClient.purchaseBOMStructure.findUnique({
      where: {id},
      select: {projectBOMStructureId: true},
    })

    if (structure?.projectBOMStructureId) {
      const sources = await prismaClient.materialDemandSource.findMany({
        where: {sourceReferenceId: structure.projectBOMStructureId},
        select: {materialDemandId: true, requiredQty: true},
      })

      if (sources.length > 0) {
        const totalsByDemand = new Map<string, number>()
        for (const src of sources) {
          totalsByDemand.set(src.materialDemandId, (totalsByDemand.get(src.materialDemandId) ?? 0) + src.requiredQty)
        }

        await prismaClient.materialDemandSource.deleteMany({
          where: {sourceReferenceId: structure.projectBOMStructureId},
        })

        for (const [materialDemandId, totalRequired] of totalsByDemand.entries()) {
          const demand = await prismaClient.materialDemand.findUnique({
            where: {id: materialDemandId},
            select: {totalRequiredQty: true, reservedQty: true},
          })
          if (demand) {
            const nextTotal = Math.max(demand.reservedQty ?? 0, demand.totalRequiredQty - totalRequired, 0)
            await prismaClient.materialDemand.update({
              where: {id: materialDemandId},
              data: {totalRequiredQty: nextTotal},
            })
          }
        }
      }
    }

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
    const structure = await prismaClient.purchaseBOMStructure.findUnique({
      where: {id},
      select: {projectBOMStructureId: true},
    })

    if (structure?.projectBOMStructureId) {
      const sources = await prismaClient.materialDemandSource.findMany({
        where: {sourceReferenceId: structure.projectBOMStructureId},
        select: {materialDemandId: true, requiredQty: true},
      })

      if (sources.length > 0) {
        const totalsByDemand = new Map<string, number>()
        for (const src of sources) {
          totalsByDemand.set(src.materialDemandId, (totalsByDemand.get(src.materialDemandId) ?? 0) + src.requiredQty)
        }

        await prismaClient.materialDemandSource.deleteMany({
          where: {sourceReferenceId: structure.projectBOMStructureId},
        })

        for (const [materialDemandId, totalRequired] of totalsByDemand.entries()) {
          const demand = await prismaClient.materialDemand.findUnique({
            where: {id: materialDemandId},
            select: {totalRequiredQty: true, reservedQty: true},
          })
          if (demand) {
            const nextTotal = Math.max(demand.reservedQty ?? 0, demand.totalRequiredQty - totalRequired, 0)
            await prismaClient.materialDemand.update({
              where: {id: materialDemandId},
              data: {totalRequiredQty: nextTotal},
            })
          }
        }
      }
    }

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
