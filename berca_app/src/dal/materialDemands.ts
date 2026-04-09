import 'server-only'
import type {Prisma} from '@/generated/prisma/client'
import {prismaClient} from '@/dal/prismaClient'

const materialDemandInclude = {
  Material: {
    select: {
      id: true,
      beNumber: true,
      name: true,
      shortDescription: true,
      Inventory_Inventory_materialIdToMaterial: {
        where: {deleted: false},
        orderBy: {quantityInStock: 'asc'},
        select: {
          id: true,
          quantityInStock: true,
          minQuantityInStock: true,
          InventoryOrder: {
            where: {deleted: false, approved: false},
            select: {id: true},
          },
        },
      },
    },
  },
  MaterialDemandSource: {select: {id: true}},
  QuoteSupplierLine: {
    select: {
      id: true,
      quoteSupplierId: true,
      quantity: true,
      unitPrice: true,
      minQuantity: true,
      selected: true,
      QuoteSupplier: {
        select: {
          quoteNumber: true,
          companyId: true,
          validUntil: true,
          deliveryTimeDays: true,
          executed: true,
          rejected: true,
          deleted: true,
          Company: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {selected: 'desc'},
  },
} as const

export async function getMaterialDemands() {
  return prismaClient.materialDemand.findMany({
    include: materialDemandInclude,
    orderBy: [{Material: {beNumber: 'asc'}}, {createdAt: 'desc'}],
  })
}

export async function getMaterialDemandMaterialOptions() {
  return prismaClient.material.findMany({
    where: {
      deleted: false,
      MaterialDemand: {
        is: null,
      },
    },
    select: {id: true, beNumber: true, name: true, shortDescription: true},
    orderBy: {beNumber: 'asc'},
  })
}

export async function ensureMaterialDemandForMaterial(materialId: string, tx?: Prisma.TransactionClient) {
  const db = tx ?? prismaClient
  return db.materialDemand.upsert({
    where: {materialId},
    update: {},
    create: {
      id: crypto.randomUUID(),
      materialId,
      totalRequiredQty: 0,
      reservedQty: 0,
      createdAt: new Date(),
    },
  })
}

export async function ensureMaterialDemandSourceType(
  name: string,
  createdBy: string,
  description?: string,
  tx?: Prisma.TransactionClient,
) {
  const db = tx ?? prismaClient
  const existing = await db.materialDemandSourceType.findFirst({where: {name}, select: {id: true}})
  if (existing) return existing.id

  const created = await db.materialDemandSourceType.create({
    data: {
      id: crypto.randomUUID(),
      name,
      description: description ?? null,
      createdAt: new Date(),
      createdBy,
    },
    select: {id: true},
  })
  return created.id
}

export async function createMaterialDemandSourceForInventoryOrder(params: {
  materialId: string
  inventoryOrderId: string
  requiredQty: number
  createdBy: string
  tx?: Prisma.TransactionClient
}) {
  const db = params.tx ?? prismaClient
  const materialDemand = await ensureMaterialDemandForMaterial(params.materialId, db)
  const sourceTypeId = await ensureMaterialDemandSourceType(
    'InventoryOrder',
    params.createdBy,
    'Approved inventory order request',
    db,
  )

  const existing = await db.materialDemandSource.findFirst({
    where: {sourceTypeId, sourceReferenceId: params.inventoryOrderId},
    select: {id: true, requiredQty: true, reservedQty: true, materialDemandId: true},
  })

  if (existing) {
    const delta = params.requiredQty - existing.requiredQty
    if (delta !== 0) {
      await db.materialDemandSource.update({
        where: {id: existing.id},
        data: {requiredQty: params.requiredQty},
      })
      if (delta !== 0) {
        await db.materialDemand.update({
          where: {id: existing.materialDemandId},
          data: {totalRequiredQty: {increment: delta}},
        })
      }
    }
    return existing.id
  }

  const source = await db.materialDemandSource.create({
    data: {
      id: crypto.randomUUID(),
      materialDemandId: materialDemand.id,
      sourceTypeId,
      sourceReferenceId: params.inventoryOrderId,
      requiredQty: params.requiredQty,
      reservedQty: 0,
      createdAt: new Date(),
      createdBy: params.createdBy,
    },
    select: {id: true},
  })

  if (params.requiredQty > 0) {
    await db.materialDemand.update({
      where: {id: materialDemand.id},
      data: {totalRequiredQty: {increment: params.requiredQty}},
    })
  }

  return source.id
}

export async function removeMaterialDemandForMaterial(materialId: string) {
  return prismaClient.materialDemand.deleteMany({
    where: {
      materialId,
      totalRequiredQty: 0,
      OR: [{reservedQty: 0}, {reservedQty: null}],
    },
  })
}

export async function syncMaterialDemandReservations(materialDemandId: string) {
  const demand = await prismaClient.materialDemand.findUnique({
    where: {id: materialDemandId},
    select: {
      id: true,
      totalRequiredQty: true,
      MaterialDemandSource: {
        select: {
          id: true,
          requiredQty: true,
          reservedQty: true,
          createdAt: true,
        },
        orderBy: [{createdAt: 'asc'}, {id: 'asc'}],
      },
      QuoteSupplierLine: {
        where: {selected: true},
        select: {quantity: true},
      },
    },
  })

  if (!demand) {
    throw new Error('MaterialDemand not found')
  }

  const selectedQty = demand.QuoteSupplierLine.reduce((sum, line) => sum + line.quantity, 0)

  if (selectedQty > demand.totalRequiredQty) {
    throw new Error('Selected quote quantities cannot exceed the total required quantity.')
  }

  let remainingQty = selectedQty
  const nextReservations = demand.MaterialDemandSource.map(source => {
    const nextReservedQty = Math.min(source.requiredQty, remainingQty)
    remainingQty -= nextReservedQty
    return {
      id: source.id,
      reservedQty: nextReservedQty,
      currentReservedQty: source.reservedQty ?? 0,
    }
  })

  await prismaClient.$transaction(async tx => {
    await tx.materialDemand.update({
      where: {id: materialDemandId},
      data: {reservedQty: selectedQty},
    })

    for (const source of nextReservations) {
      if (source.currentReservedQty !== source.reservedQty) {
        await tx.materialDemandSource.update({
          where: {id: source.id},
          data: {reservedQty: source.reservedQty},
        })
      }
    }
  })

  return {
    selectedQty,
    allocatedQty: selectedQty - remainingQty,
    unallocatedQty: remainingQty,
    sourceCount: demand.MaterialDemandSource.length,
  }
}

// ─── MaterialDemandSource tracking ──────────────────────────────────────────────

/**
 * Create MaterialDemandSource entries when PurchaseBOM is approved.
 * Links ProjectBOMStructure origins to MaterialDemand via the material.
 *
 * @param projectBomStructureIds - IDs of ProjectBOMStructure records being approved for purchase
 * @param sourceTypeId - MaterialDemandSourceType ID (typically "ProjectBOMStructure")
 * @param createdBy - Employee ID creating the source tracking
 * @returns Array of created MaterialDemandSource records
 */
export async function createMaterialDemandSourcesForProjectBOMStructures(
  projectBomStructureIds: string[],
  sourceTypeId: string,
  createdBy: string,
) {
  if (projectBomStructureIds.length === 0) return []

  // Fetch ProjectBOMStructures with their material and BOMExecution info
  const projectBomStructures = await prismaClient.projectBOMStructure.findMany({
    where: {id: {in: projectBomStructureIds}},
    include: {
      BOMExecution: {select: {requiredQuantity: true}},
      Material: {select: {id: true}},
    },
  })

  const createdSources = []

  for (const struct of projectBomStructures) {
    if (!struct.Material) continue

    const requiredQty = struct.BOMExecution?.requiredQuantity ?? 0

    // Ensure MaterialDemand exists for this material
    const materialDemand = await ensureMaterialDemandForMaterial(struct.Material.id)

    const existingSource = await prismaClient.materialDemandSource.findFirst({
      where: {
        sourceTypeId,
        sourceReferenceId: struct.id,
      },
      select: {id: true, materialDemandId: true, requiredQty: true, reservedQty: true},
    })

    if (existingSource) {
      if ((existingSource.reservedQty ?? 0) === 0 && existingSource.requiredQty !== requiredQty) {
        const delta = requiredQty - existingSource.requiredQty
        await prismaClient.materialDemandSource.update({
          where: {id: existingSource.id},
          data: {requiredQty},
        })

        if (delta !== 0) {
          await prismaClient.materialDemand.update({
            where: {id: existingSource.materialDemandId},
            data: {totalRequiredQty: {increment: delta}},
          })
        }
      }
      continue
    }

    // Create MaterialDemandSource linking this ProjectBOMStructure to the demand
    const source = await prismaClient.materialDemandSource.create({
      data: {
        id: crypto.randomUUID(),
        materialDemandId: materialDemand.id,
        sourceTypeId,
        sourceReferenceId: struct.id,
        requiredQty,
        reservedQty: 0,
        createdAt: new Date(),
        createdBy,
      },
    })

    if (requiredQty > 0) {
      await prismaClient.materialDemand.update({
        where: {id: materialDemand.id},
        data: {totalRequiredQty: {increment: requiredQty}},
      })
    }

    createdSources.push(source)
  }

  return createdSources
}

/**
 * Update MaterialDemandSource reserved quantities when QuoteSupplierLine is selected.
 * Tracks the allocation of quantity from demand source to chosen supplier.
 *
 * @param quoteSupplierLineId - ID of selected QuoteSupplierLine
 * @param materialDemandId - ID of MaterialDemand
 * @param reservedQty - Quantity being reserved at supplier level
 */
export async function updateMaterialDemandSourceReservedQty(
  materialDemandId: string,
  sourceReferenceId: string,
  reservedQty: number,
) {
  return prismaClient.materialDemandSource.updateMany({
    where: {
      materialDemandId,
      sourceReferenceId,
    },
    data: {
      reservedQty,
    },
  })
}

/**
 * Get all MaterialDemandSource records for a material, showing allocation breakdown.
 *
 * @param materialId - Material ID
 * @returns MaterialDemand with all source allocations
 */
export async function getMaterialDemandWithSources(materialId: string) {
  return prismaClient.materialDemand.findUnique({
    where: {materialId},
    include: {
      Material: {select: {id: true, beNumber: true, name: true}},
      MaterialDemandSource: {
        select: {
          id: true,
          sourceTypeId: true,
          sourceReferenceId: true,
          requiredQty: true,
          reservedQty: true,
          createdAt: true,
          createdBy: true,
        },
      },
      QuoteSupplierLine: {
        select: {
          id: true,
          quantity: true,
          selected: true,
        },
      },
    },
  })
}

/**
 * Validate that MaterialDemandSource allocations don't exceed total demand.
 *
 * @param materialDemandId - ID of MaterialDemand to validate
 * @returns {valid: boolean, message: string}
 */
export async function validateMaterialDemandSourceAllocation(materialDemandId: string) {
  const demand = await prismaClient.materialDemand.findUnique({
    where: {id: materialDemandId},
    include: {
      MaterialDemandSource: {select: {requiredQty: true}},
    },
  })

  if (!demand) return {valid: false, message: 'MaterialDemand not found'}

  const totalSourceRequired = demand.MaterialDemandSource.reduce((sum, src) => sum + src.requiredQty, 0)

  if (totalSourceRequired > demand.totalRequiredQty) {
    return {
      valid: false,
      message: `Source allocations (${totalSourceRequired}) exceed total required (${demand.totalRequiredQty})`,
    }
  }

  return {valid: true, message: 'Allocation valid'}
}
