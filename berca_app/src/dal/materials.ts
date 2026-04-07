import 'server-only'
import {randomUUID} from 'crypto'
import {prismaClient} from './prismaClient'
import {Prisma} from '@/generated/prisma/client'

const PARENT_PART_MANAGEMENT = 'PARENT_PART'

function isMissingTrackedStructureMaterialGroupColumnError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const metaColumn = String(error.meta?.column ?? '')
    return error.code === 'P2022' && metaColumn.includes('MaterialSerialTrackedStructure.materialGroupId')
  }

  if (error instanceof Error) {
    return (
      error.message.includes('MaterialSerialTrackedStructure.materialGroupId') &&
      error.message.includes('does not exist')
    )
  }

  return false
}

async function createTrackedStructureCompat(
  tx: Prisma.TransactionClient,
  data: {
    id: string
    serialTrackedId: string
    beNumber: string | null | undefined
    createdBy: string
  },
) {
  try {
    return await tx.materialSerialTrackedStructure.create({
      data: {
        id: data.id,
        serialTrackedId: data.serialTrackedId,
        beNumber: data.beNumber ?? null,
        createdBy: data.createdBy,
        deleted: false,
      },
      select: {
        id: true,
        beNumber: true,
        serialTrackedId: true,
      },
    })
  } catch (error) {
    if (!isMissingTrackedStructureMaterialGroupColumnError(error)) {
      throw error
    }

    // Temporary compatibility path for DBs that miss the newer materialGroupId column.
    await tx.$executeRaw`
      INSERT INTO MaterialSerialTrackedStructure (id, serialTrackedId, beNumber, createdBy, deleted)
      VALUES (${data.id}, ${data.serialTrackedId}, ${data.beNumber ?? null}, ${data.createdBy}, false)
    `

    return {
      id: data.id,
      beNumber: data.beNumber ?? null,
      serialTrackedId: data.serialTrackedId,
    }
  }
}

const materialListInclude = {
  Unit: true,
  Employee: {select: {firstName: true, lastName: true}},
  Target: {select: {createdAt: true}},
  Employee_Material_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  PreferredSupplierCompany: {select: {id: true, name: true}},
  MaterialSupplier: {
    include: {
      Company: {
        select: {id: true, name: true},
      },
    },
  },
  MaterialStructure_MaterialStructure_materialIdToMaterial: {
    where: {deleted: false, management: PARENT_PART_MANAGEMENT},
    select: {
      beNumber: true,
      Material_MaterialStructure_beNumberToMaterial: {
        select: {shortDescription: true},
      },
    },
  },
  MaterialSerialTrack: {
    where: {deleted: false},
    select: {id: true},
    orderBy: {updatedAt: 'desc'},
  },
  MaterialLeadTime: true,
} as const

export type MaterialListItem = Prisma.MaterialGetPayload<{
  include: typeof materialListInclude
}>

export type MaterialGroupOption = {
  id: string
  groupA: string
  groupB: string | null
  groupC: string | null
  groupD: string | null
}

type MaterialDocumentFlagInput = {
  hasAtex?: boolean
  hasCe?: boolean
  hasRohs?: boolean
  hasDs?: boolean
  hasDoc?: boolean
  has3dCad?: boolean
  has2dCad?: boolean
  hasBdoc?: boolean
  hasInsp?: boolean
}

function toPrismaMaterialDocumentFlags(flags: MaterialDocumentFlagInput) {
  const {hasAtex, hasCe, hasRohs, hasDs, hasDoc, has3dCad, has2dCad, hasBdoc, hasInsp} = flags
  return {
    hasAtex,
    hasCE: hasCe,
    hasROHS: hasRohs,
    hasDS: hasDs,
    hasDoc,
    has3DCAD: has3dCad,
    has2DCAD: has2dCad,
    hasBDOC: hasBdoc,
    hasINSP: hasInsp,
  }
}

// Type for material with all relations included in getMaterialById
export type MaterialWithRelations = Prisma.MaterialGetPayload<{
  include: {
    Unit: true
    Employee: {select: {firstName: true; lastName: true}}
    Target: {select: {createdAt: true}}
    Employee_Material_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    PreferredSupplierCompany: {select: {id: true; name: true}}
    MaterialSupplier: {include: {Company: {select: {id: true, name: true}}}}
    MaterialStructure_MaterialStructure_materialIdToMaterial: {
      where: {deleted: false; management: typeof PARENT_PART_MANAGEMENT}
      select: {
        beNumber: true
        Material_MaterialStructure_beNumberToMaterial: {select: {shortDescription: true}}
      }
    }
    MaterialSerialTrack: {
      where: {deleted: false}
      select: {id: true}
      orderBy: {updatedAt: 'desc'}
    }
    MaterialLeadTime: true
    Inventory_Inventory_materialIdToMaterial: {
      where: {deleted: false}
      orderBy: {createdAt: 'asc'}
      include: {
        InventoryStructure: {
          where: {deleted: false}
          orderBy: {createdAt: 'asc'}
          select: {
            id: true
            inventoryPlaceId: true
            place: true
            warehousePlaceId: true
            information: true
            coordinate: true
            inventoryId: true
            forInventory: true
            forProject: true
            active: true
            materialActive: true
            valid: true
            createdAt: true
            createdBy: true
          }
        }
      }
    }
  }
}>

export async function getMaterials(options?: {includeDeleted?: boolean}): Promise<MaterialListItem[]> {
  const includeDeleted = options?.includeDeleted ?? false
  return prismaClient.material.findMany({
    where: {deleted: includeDeleted ? undefined : false},
    include: materialListInclude,
    orderBy: {beNumber: 'asc'},
  })
}

export async function getMaterialById(id: string): Promise<MaterialWithRelations | null> {
  return prismaClient.material.findUnique({
    where: {id},
    include: {
      Unit: true,
      Employee: {select: {firstName: true, lastName: true}},
      Target: {select: {createdAt: true}},
      Employee_Material_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}}, // deleter
      PreferredSupplierCompany: {
        select: {id: true, name: true},
      },
      MaterialSupplier: {
        include: {
          Company: {
            select: {id: true, name: true},
          },
        },
      },
      MaterialStructure_MaterialStructure_materialIdToMaterial: {
        where: {deleted: false, management: PARENT_PART_MANAGEMENT},
        select: {
          beNumber: true,
          Material_MaterialStructure_beNumberToMaterial: {
            select: {shortDescription: true},
          },
        },
      },
      MaterialSerialTrack: {
        where: {deleted: false},
        select: {id: true},
        orderBy: {updatedAt: 'desc'},
      },
      MaterialLeadTime: true,
      Inventory_Inventory_materialIdToMaterial: {
        where: {deleted: false},
        orderBy: {createdAt: 'asc'},
        include: {
          InventoryStructure: {
            where: {deleted: false},
            orderBy: {createdAt: 'asc'},
            select: {
              id: true,
              inventoryPlaceId: true,
              place: true,
              warehousePlaceId: true,
              information: true,
              coordinate: true,
              inventoryId: true,
              forInventory: true,
              forProject: true,
              active: true,
              materialActive: true,
              valid: true,
              createdAt: true,
              createdBy: true,
            },
          },
        },
      },
    },
  })
}

export async function getMaterialGroups(): Promise<MaterialGroupOption[]> {
  return prismaClient.materialGroup.findMany({
    where: {deleted: false},
    select: {
      id: true,
      groupA: true,
      groupB: true,
      groupC: true,
      groupD: true,
    },
    orderBy: [{groupA: 'asc'}, {groupB: 'asc'}, {groupC: 'asc'}, {groupD: 'asc'}],
  })
}

export async function getUnits() {
  return prismaClient.unit.findMany({
    where: {deleted: false, valid: true},
    orderBy: {unitName: 'asc'},
  })
}

export async function createMaterial(data: {
  id: string
  beNumber: string
  name?: string | null
  brandOrderNr?: string | null
  shortDescription: string
  longDescription?: string | null
  preferredSupplierCompanyId?: string | null
  preferredSupplierOrderId?: string | null
  preferredSupplierShortDescription?: string | null
  supplierCompanyIds?: string[]
  parentBeNumbers?: string[]
  brandName?: string | null
  warehousePlace?: string | null
  rejected?: boolean | null
  partApproved?: boolean
  longLeadTime?: boolean
  leadTimeValue?: number | null
  leadTimeUnit?: 'days' | 'weeks' | 'months' | null
  hasAtex?: boolean
  hasCe?: boolean
  hasRohs?: boolean
  hasDs?: boolean
  hasDoc?: boolean
  has3dCad?: boolean
  has2dCad?: boolean
  hasBdoc?: boolean
  hasInsp?: boolean
  materialGroupIdA: string | null
  materialGroupIdB?: string | null
  materialGroupIdC?: string | null
  materialGroupIdD?: string | null
  unitId: string
  createdBy: string
  targetId: string
  isSerialTracked: boolean
  isParentPart?: boolean
}) {
  const {
    supplierCompanyIds = [],
    parentBeNumbers = [],
    warehousePlace,
    preferredSupplierCompanyId,
    preferredSupplierOrderId,
    preferredSupplierShortDescription,
    leadTimeValue,
    leadTimeUnit,
    isParentPart,
    hasAtex,
    hasCe,
    hasRohs,
    hasDs,
    hasDoc,
    has3dCad,
    has2dCad,
    hasBdoc,
    hasInsp,
    ...materialData
  } = data

  let uniqueParentBeNumbers = Array.from(new Set(parentBeNumbers)).filter(
    parentBeNumber => parentBeNumber !== data.beNumber,
  )

  if (isParentPart === false) {
    uniqueParentBeNumbers = []
  }

  // --- Begin Transaction ---
  return await prismaClient.$transaction(async tx => {
    // Create the material
    const material = await tx.material.create({
      data: {
        ...materialData,
        ...toPrismaMaterialDocumentFlags({
          hasAtex,
          hasCe,
          hasRohs,
          hasDs,
          hasDoc,
          has3dCad,
          has2dCad,
          hasBdoc,
          hasInsp,
        }),
        warehousePlaceId: warehousePlace ?? null,
        isSerialTracked: data.isSerialTracked ?? false,
        MaterialSupplier:
          supplierCompanyIds.length > 0
            ? {
                create: supplierCompanyIds.map(companyId => ({
                  id: randomUUID(),
                  companyId,
                  isPreferred: preferredSupplierCompanyId === companyId,
                  supplierOrderNr: preferredSupplierCompanyId === companyId ? (preferredSupplierOrderId ?? null) : null,
                  shortDescription:
                    preferredSupplierCompanyId === companyId ? (preferredSupplierShortDescription ?? null) : null,
                })),
              }
            : undefined,
        MaterialStructure_MaterialStructure_materialIdToMaterial:
          uniqueParentBeNumbers.length > 0
            ? {
                create: uniqueParentBeNumbers.map(parentBeNumber => ({
                  id: randomUUID(),
                  beNumber: parentBeNumber,
                  management: PARENT_PART_MANAGEMENT,
                  createdBy: data.createdBy,
                })),
              }
            : undefined,
      } as Prisma.MaterialUncheckedCreateInput,
    })
    console.log(
      '[createMaterial] Created material:',
      material.id,
      material.beNumber,
      'isSerialTracked:',
      data.isSerialTracked,
    )

    // If serial tracked, create MaterialSerialTrack and MaterialSerialTrackedStructure
    if (data.isSerialTracked) {
      // Create MaterialSerialTrack
      const serialTrack = await tx.materialSerialTrack.create({
        data: {
          id: randomUUID(),
          materialId: material.id,
          beNumber: material.beNumber,
          materialGroupId: material.materialGroupIdA ?? null,
          shortDescription: material.shortDescription,
          longDescription: material.longDescription,
          createdBy: data.createdBy,
          deleted: false,
        },
      })
      console.log('[createMaterial] Created MaterialSerialTrack:', serialTrack.id, serialTrack.beNumber)
      // Create MaterialSerialTrackedStructure
      const trackedStruct = await createTrackedStructureCompat(tx, {
        id: randomUUID(),
        serialTrackedId: serialTrack.id,
        beNumber: material.beNumber,
        createdBy: data.createdBy,
      })
      console.log(
        '[createMaterial] Created MaterialSerialTrackedStructure:',
        trackedStruct.id,
        trackedStruct.beNumber,
        'serialTrackedId:',
        trackedStruct.serialTrackedId,
      )
    }

    if (material.longLeadTime && leadTimeValue != null && leadTimeUnit) {
      await tx.materialLeadTime.upsert({
        where: {materialId: material.id},
        update: {leadTimeValue, leadTimeUnit},
        create: {
          id: randomUUID(),
          materialId: material.id,
          leadTimeValue,
          leadTimeUnit,
        },
      })
    }

    return material
  })
}

export async function updateMaterial(
  id: string,
  data: {
    beNumber?: string
    name?: string | null
    brandOrderNr?: string | null
    shortDescription?: string
    longDescription?: string | null
    preferredSupplierCompanyId?: string | null
    preferredSupplierOrderId?: string | null
    preferredSupplierShortDescription?: string | null
    supplierCompanyIds?: string[]
    parentBeNumbers?: string[]
    brandName?: string | null
    warehousePlace?: string | null
    rejected?: boolean | null
    canCopy?: boolean
    longLeadTime?: boolean
    leadTimeValue?: number | null
    leadTimeUnit?: 'days' | 'weeks' | 'months' | null
    hasAtex?: boolean
    hasCe?: boolean
    hasRohs?: boolean
    hasDs?: boolean
    hasDoc?: boolean
    has3dCad?: boolean
    has2dCad?: boolean
    hasBdoc?: boolean
    hasInsp?: boolean
    materialGroupIdA?: string | null
    materialGroupIdB?: string | null
    materialGroupIdC?: string | null
    materialGroupIdD?: string | null
    unitId?: string
    isSerialTracked?: boolean
    isParentPart?: boolean
  },
) {
  const {
    supplierCompanyIds,
    parentBeNumbers,
    warehousePlace,
    preferredSupplierCompanyId,
    preferredSupplierOrderId,
    preferredSupplierShortDescription,
    leadTimeValue,
    leadTimeUnit,
    isParentPart,
    hasAtex,
    hasCe,
    hasRohs,
    hasDs,
    hasDoc,
    has3dCad,
    has2dCad,
    hasBdoc,
    hasInsp,
    ...materialData
  } = data

  let uniqueParentBeNumbers = parentBeNumbers ? Array.from(new Set(parentBeNumbers)) : undefined

  if (isParentPart === false) {
    uniqueParentBeNumbers = []
  }

  return prismaClient.$transaction(async tx => {
    const existing = await tx.material.findUnique({
      where: {id},
      include: {
        MaterialSerialTrack: {
          where: {deleted: false},
          select: {id: true},
          orderBy: {updatedAt: 'desc'},
        },
        MaterialLeadTime: true,
      },
    })

    if (!existing) {
      throw new Error(`Material not found: ${id}`)
    }

    if (uniqueParentBeNumbers !== undefined) {
      const currentBeNumber = materialData.beNumber ?? existing.beNumber
      uniqueParentBeNumbers = uniqueParentBeNumbers.filter(parentBeNumber => parentBeNumber !== currentBeNumber)
    }

    const updated = await tx.material.update({
      where: {id},
      data: {
        ...materialData,
        ...toPrismaMaterialDocumentFlags({
          hasAtex,
          hasCe,
          hasRohs,
          hasDs,
          hasDoc,
          has3dCad,
          has2dCad,
          hasBdoc,
          hasInsp,
        }),
        warehousePlaceId: warehousePlace !== undefined ? warehousePlace : undefined,
        MaterialSupplier:
          supplierCompanyIds === undefined
            ? undefined
            : {
                deleteMany: {},
                create: supplierCompanyIds.map(companyId => ({
                  id: randomUUID(),
                  companyId,
                  isPreferred: preferredSupplierCompanyId === companyId,
                  supplierOrderNr: preferredSupplierCompanyId === companyId ? (preferredSupplierOrderId ?? null) : null,
                  shortDescription:
                    preferredSupplierCompanyId === companyId ? (preferredSupplierShortDescription ?? null) : null,
                })),
              },
        MaterialStructure_MaterialStructure_materialIdToMaterial:
          uniqueParentBeNumbers === undefined
            ? undefined
            : {
                deleteMany: {management: PARENT_PART_MANAGEMENT},
                create: uniqueParentBeNumbers.map(parentBeNumber => ({
                  id: randomUUID(),
                  beNumber: parentBeNumber,
                  management: PARENT_PART_MANAGEMENT,
                })),
              },
      } as Prisma.MaterialUncheckedUpdateInput,
    })

    const activeSerialTrack = existing.MaterialSerialTrack[0] ?? null

    if (updated.isSerialTracked) {
      if (activeSerialTrack) {
        await tx.materialSerialTrack.update({
          where: {id: activeSerialTrack.id},
          data: {
            materialId: updated.id,
            beNumber: updated.beNumber,
            materialGroupId: updated.materialGroupIdA ?? null,
            shortDescription: updated.shortDescription,
            longDescription: updated.longDescription,
            deleted: false,
            deletedAt: null,
            deletedBy: null,
            updatedAt: new Date(),
          },
        })
      } else {
        const serialTrack = await tx.materialSerialTrack.create({
          data: {
            id: randomUUID(),
            materialId: updated.id,
            beNumber: updated.beNumber,
            materialGroupId: updated.materialGroupIdA ?? null,
            shortDescription: updated.shortDescription,
            longDescription: updated.longDescription,
            createdBy: existing.createdBy,
            deleted: false,
          },
        })

        await createTrackedStructureCompat(tx, {
          id: randomUUID(),
          serialTrackedId: serialTrack.id,
          beNumber: updated.beNumber,
          createdBy: existing.createdBy,
        })
      }
    } else if (activeSerialTrack) {
      await tx.materialSerialTrack.update({
        where: {id: activeSerialTrack.id},
        data: {
          deleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      })

      await tx.materialSerialTrackedStructure.updateMany({
        where: {serialTrackedId: activeSerialTrack.id, deleted: false},
        data: {deleted: true, deletedAt: new Date(), updatedAt: new Date()},
      })
    }

    const longLeadTimeEnabled = updated.longLeadTime ?? false
    if (!longLeadTimeEnabled) {
      await tx.materialLeadTime.deleteMany({where: {materialId: updated.id}})
    } else {
      const nextLeadTimeValue = leadTimeValue ?? existing.MaterialLeadTime?.leadTimeValue ?? null
      const nextLeadTimeUnit = leadTimeUnit ?? existing.MaterialLeadTime?.leadTimeUnit ?? null

      if (nextLeadTimeValue != null && nextLeadTimeUnit) {
        await tx.materialLeadTime.upsert({
          where: {materialId: updated.id},
          update: {
            leadTimeValue: nextLeadTimeValue,
            leadTimeUnit: nextLeadTimeUnit,
          },
          create: {
            id: randomUUID(),
            materialId: updated.id,
            leadTimeValue: nextLeadTimeValue,
            leadTimeUnit: nextLeadTimeUnit,
          },
        })
      }
    }

    return updated
  })
}

export async function softDeleteMaterial(id: string, deletedBy: string) {
  return prismaClient.material.update({
    where: {id},
    data: {
      deleted: true,
      deletedAt: new Date(),
      deletedBy,
    },
  })
}

export async function restoreMaterial(id: string) {
  return prismaClient.material.update({
    where: {id},
    data: {
      deleted: false,
      deletedAt: null,
      deletedBy: null,
    },
  })
}
