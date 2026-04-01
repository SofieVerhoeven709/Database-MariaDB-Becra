import 'server-only'
import {randomUUID} from 'crypto'
import {prismaClient} from './prismaClient'
import type {Prisma} from '@/generated/prisma/client'

const PARENT_PART_MANAGEMENT = 'PARENT_PART'

const materialListInclude = {
  Unit: true,
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

// Type for material with all relations included in getMaterialById
export type MaterialWithRelations = Prisma.MaterialGetPayload<{
  include: {
    Unit: true
    Employee_Material_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    PreferredSupplierCompany: {select: {id: true; name: true}}
    MaterialSupplier: {include: {Company: {select: {id: true; name: true}}}}
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
    Inventory_Inventory_materialIdToMaterial: {
      where: {deleted: false}
      orderBy: {createdAt: 'asc'}
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
      Inventory_Inventory_materialIdToMaterial: {
        where: {deleted: false},
        orderBy: {createdAt: 'asc'},
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
  documentationPlace?: string | null
  bePartDoc?: number | null
  rejected?: boolean | null
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
    bePartDoc,
    preferredSupplierCompanyId,
    preferredSupplierOrderId,
    preferredSupplierShortDescription,
    isParentPart,
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
        isSerialTracked: data.isSerialTracked ?? false,
        bePartDoc: bePartDoc != null ? String(bePartDoc) : null,
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
      const trackedStruct = await tx.materialSerialTrackedStructure.create({
        data: {
          id: randomUUID(),
          serialTrackedId: serialTrack.id,
          beNumber: material.beNumber,
          createdBy: data.createdBy,
          deleted: false,
        },
      })
      console.log(
        '[createMaterial] Created MaterialSerialTrackedStructure:',
        trackedStruct.id,
        trackedStruct.beNumber,
        'serialTrackedId:',
        trackedStruct.serialTrackedId,
      )
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
    documentationPlace?: string | null
    bePartDoc?: number | null
    rejected?: boolean | null
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
    bePartDoc,
    preferredSupplierCompanyId,
    preferredSupplierOrderId,
    preferredSupplierShortDescription,
    isParentPart,
    ...materialData
  } = data

  let uniqueParentBeNumbers = parentBeNumbers
    ? Array.from(new Set(parentBeNumbers)).filter(parentBeNumber => parentBeNumber !== materialData.beNumber)
    : undefined

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
      },
    })

    if (!existing) {
      throw new Error(`Material not found: ${id}`)
    }

    const updated = await tx.material.update({
      where: {id},
      data: {
        ...materialData,
        bePartDoc: bePartDoc !== undefined ? (bePartDoc != null ? String(bePartDoc) : null) : undefined,
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

        await tx.materialSerialTrackedStructure.create({
          data: {
            id: randomUUID(),
            serialTrackedId: serialTrack.id,
            beNumber: updated.beNumber,
            createdBy: existing.createdBy,
            deleted: false,
          },
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

export async function cloneMaterial(id: string) {
  const original = await prismaClient.material.findUniqueOrThrow({where: {id}})
  const {id: _oldId, deleted: _deleted, deletedAt: _deletedAt, deletedBy: _deletedBy, beNumber, ...rest} = original
  const newId = randomUUID()

  let baseBeNumber = beNumber ? String(beNumber) : 'CLONE'
  let newBeNumber = baseBeNumber + '-copy'
  let counter = 1
  while (await prismaClient.material.findUnique({where: {beNumber: newBeNumber}})) {
    newBeNumber = `${baseBeNumber}-copy${counter}`
    counter++
  }

  return prismaClient.material.create({
    data: {
      ...rest,
      id: newId,
      beNumber: newBeNumber,
      deleted: false,
      deletedAt: null,
      deletedBy: null,
    },
  })
}
