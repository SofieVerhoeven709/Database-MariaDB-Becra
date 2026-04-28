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
import {
  ensureMaterialDemandForMaterial,
  createMaterialDemandSourcesForProjectBOMStructures,
  validateMaterialDemandSourceAllocation,
} from '@/dal/materialDemands'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {getWorkOrdersByProjectId} from '@/dal/workOrders'
import {MappedWorkOrder} from '@/types/workOrder'

const OPEN_WORK_ORDER_ERROR =
  'No open work order with material closed = false was found for this project. Please ask a manager to open a new work order and retry approval.'

async function findOpenWorkOrderForProject(projectId: string) {
  return prismaClient.workOrder.findFirst({
    where: {
      projectId,
      deleted: false,
      completed: false,
      hoursMaterialClosed: false,
    },
    orderBy: {createdAt: 'asc'},
    select: {id: true},
  })
}

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
    const existingBom = await prismaClient.purchaseBOM.findUnique({
      where: {id},
      select: {projectId: true, projectBOMId: true, approvedForQuote: true},
    })
    if (!existingBom) throw new Error('Purchase BOM not found.')

    const approvingNow = data.approvedForQuote === true && !existingBom.approvedForQuote
    const openWorkOrder = approvingNow ? await findOpenWorkOrderForProject(existingBom.projectId) : null

    if (approvingNow && !openWorkOrder) {
      throw new Error(OPEN_WORK_ORDER_ERROR)
    }

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

    if (approvingNow) {
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

      if (openWorkOrder) {
        const sourceClientNumbers = purchaseStructures.map(s => `PBOMS:${s.id}`)
        const existingWorkOrderStructures = await prismaClient.workOrderStructure.findMany({
          where: {
            workOrderId: openWorkOrder.id,
            deleted: false,
            clientNumber: {in: sourceClientNumbers},
          },
          select: {clientNumber: true},
        })

        const existingClientNumbers = new Set(existingWorkOrderStructures.map(row => row.clientNumber))
        let createdWorkOrderStructures = 0

        for (const structure of purchaseStructures) {
          const clientNumber = `PBOMS:${structure.id}`
          if (existingClientNumbers.has(clientNumber)) continue

          const target = await createTargetForType('WorkOrderStructure', profile.id)
          await prismaClient.workOrderStructure.create({
            data: {
              id: crypto.randomUUID(),
              clientNumber,
              workOrderId: openWorkOrder.id,
              materialId: structure.materialId,
              tag: structure.tag?.slice(0, 100) ?? null,
              quantity: structure.ProjectBOMStructure?.BOMExecution?.requiredQuantity ?? null,
              shortDescription: structure.shortDescription?.slice(0, 100) ?? null,
              longDescription: structure.description ?? null,
              additionalInfo: structure.additionalInfo ?? null,
              createdAt: new Date(),
              createdBy: profile.id,
              targetId: target.id,
            },
          })
          createdWorkOrderStructures++
        }

        logger.info(
          `Created ${createdWorkOrderStructures} work order structure(s) on approval for PurchaseBOM ${id} in WorkOrder ${openWorkOrder.id}`,
        )
      }

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
          logger.error(
            `Failed to create MaterialDemandSource entries: ${err instanceof Error ? err.message : String(err)}`,
          )
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

      revalidatePath('/workOrder')
      revalidatePath(`/departments/project/project/${existingBom.projectId}`)
      if (openWorkOrder) {
        revalidatePath(`/departments/project/project/${existingBom.projectId}/workOrder/${openWorkOrder.id}`)
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
  serverFn: async ({
    data: {id, purchased, approvedForQuote, notCorrect, notCorrectReason, workOrderId, ...data},
    logger,
    profile,
  }) => {
    // If approving for quote, check for open work order for the related project
    let selectedWorkOrder = null
    if (approvedForQuote === true) {
      // Fetch ProjectBOMStructure to get ProjectBOMId, then ProjectBOM to get projectId
      const projectBomStructure = await prismaClient.projectBOMStructure.findUnique({
        where: {id: data.projectBOMStructureId},
        select: {
          projectBOMId: true,
          id: true,
          tag: true,
          materialId: true,
          shortDescription: true,
          description: true,
          additionalInfo: true,
        },
      })
      if (!projectBomStructure || !projectBomStructure.projectBOMId) {
        throw new Error('Project BOM Structure or Project BOM not found.')
      }
      const projectBom = await prismaClient.projectBOM.findUnique({
        where: {id: projectBomStructure.projectBOMId},
        select: {projectId: true},
      })
      if (!projectBom || !projectBom.projectId) {
        throw new Error('Project BOM or Project not found.')
      }
      // Fetch all open work orders for the project
      const openWorkOrders = await prismaClient.workOrder.findMany({
        where: {
          projectId: projectBom.projectId,
          deleted: false,
          completed: false,
          hoursMaterialClosed: false,
        },
        orderBy: {createdAt: 'asc'},
        select: {id: true},
      })
      if (!openWorkOrders || openWorkOrders.length === 0) {
        throw new Error(OPEN_WORK_ORDER_ERROR)
      }
      // Use provided workOrderId if present and valid, else fallback to oldest
      if (workOrderId && openWorkOrders.some(wo => wo.id === workOrderId)) {
        selectedWorkOrder = openWorkOrders.find(wo => wo.id === workOrderId)
      } else {
        selectedWorkOrder = openWorkOrders[0]
      }

      // Ensure a work order structure exists for this structure in the selected work order
      const clientNumber = `PBOMS:${id}`
      const existingWOStructure = await prismaClient.workOrderStructure.findFirst({
        where: {
          workOrderId: selectedWorkOrder?.id,
          clientNumber,
          deleted: false,
        },
      })
      if (!existingWOStructure) {
        const target = await createTargetForType('WorkOrderStructure', profile.id)
        await prismaClient.workOrderStructure.create({
          data: {
            id: crypto.randomUUID(),
            clientNumber,
            workOrderId: selectedWorkOrder!.id,
            materialId: projectBomStructure.materialId,
            tag: projectBomStructure.tag?.slice(0, 100) ?? null,
            quantity: data.stockReservedQuantity ?? null,
            shortDescription: projectBomStructure.shortDescription?.slice(0, 100) ?? null,
            longDescription: projectBomStructure.description ?? null,
            additionalInfo: projectBomStructure.additionalInfo ?? null,
            createdAt: new Date(),
            createdBy: profile.id,
            targetId: target.id,
          },
        })
        logger.info(`Created work order structure for PBOMStructure ${id} in WorkOrder ${selectedWorkOrder?.id}`)
      }
    }

    // Update execution fields on BOMExecution
    await prismaClient.bOMExecution.update({
      where: {projectBOMStructureId: data.projectBOMStructureId},
      data: {
        stockReservedQuantity: data.stockReservedQuantity,
        issuedQuantity: data.issuedQuantity,
        notDeliverable: data.notDeliverable,
        ...(notCorrect !== undefined ? {notCorrect} : {}),
        ...(notCorrect !== undefined ? {notCorrectReason: notCorrect ? notCorrectReason?.trim() || null : null} : {}),
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
        // Recompute total required quantities after removing this structure's sources.
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
        // Mirror the soft-delete recalculation before hard delete.
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

export async function hasOpenWorkOrderForProjectAction(projectId: string): Promise<boolean> {
  await getSessionProfileFromCookieOrThrow()
  const openWorkOrder = await findOpenWorkOrderForProject(projectId)
  return Boolean(openWorkOrder)
}

export async function getOpenWorkOrdersForProjectAction(projectId: string): Promise<MappedWorkOrder[]> {
  const orders = await getWorkOrdersByProjectId(projectId)
  return orders
    .filter((wo: any) => !wo.deleted && !wo.completed && !wo.hoursMaterialClosed)
    .map((wo: any) => ({
      id: wo.id,
      workOrderNumber: wo.workOrderNumber ?? '',
      description: wo.description ?? '',
      additionalInfo: wo.additionalInfo ?? '',
      startDate: wo.startDate ?? null,
      endDate: wo.endDate ?? null,
      createdAt: wo.createdAt ?? null,
      createdBy: wo.createdBy ?? '',
      deleted: wo.deleted ?? false,
      deletedAt: wo.deletedAt ?? null,
      deletedBy: wo.deletedBy ?? '',
      completed: wo.completed ?? false,
      completedDate: wo.completedDate ?? null,
      completedBy: wo.completedBy ?? '',
      hoursMaterialClosed: wo.hoursMaterialClosed ?? false,
      hoursMaterialClosedDate: wo.hoursMaterialClosedDate ?? null,
      hoursMaterialClosedBy: wo.hoursMaterialClosedBy ?? '',
      projectId: wo.projectId ?? '',
      employeeId: wo.employeeId ?? '',
      invoiceSent: wo.invoiceSent ?? false,
      createdByName: wo.createdByName ?? '',
      deletedByName: wo.deletedByName ?? '',
      projectNumber: wo.projectNumber ?? '',
      projectName: wo.projectName ?? '',
    }))
}
