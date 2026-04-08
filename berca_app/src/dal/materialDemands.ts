import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

const materialDemandInclude = {
  Material: {select: {id: true, beNumber: true, name: true, shortDescription: true}},
  MaterialDemandSource: {select: {id: true}},
  QuoteSupplierLine: {select: {id: true}},
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

export async function ensureMaterialDemandForMaterial(materialId: string) {
  return prismaClient.materialDemand.upsert({
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

export async function removeMaterialDemandForMaterial(materialId: string) {
  return prismaClient.materialDemand.deleteMany({
    where: {
      materialId,
      totalRequiredQty: 0,
      OR: [{reservedQty: 0}, {reservedQty: null}],
    },
  })
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
      MaterialDemandSource: {
        where: {createdAt: {gte: new Date(Date.now() - 24 * 60 * 60 * 1000)}}, // Last 24h
        select: {requiredQty: true},
      },
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
