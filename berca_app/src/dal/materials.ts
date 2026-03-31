import 'server-only'
import {randomUUID} from 'crypto'
import {prismaClient} from './prismaClient'
import type {Prisma} from '@/generated/prisma/client'

const PARENT_PART_MANAGEMENT = 'PARENT_PART'

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
    Employee: {select: {id: true; firstName: true; lastName: true}}
    PreferredSupplierCompany: {select: {id: true; name: true}}
    MaterialSupplier: {include: {Company: {select: {id: true; name: true}}}}
    MaterialStructure_MaterialStructure_materialIdToMaterial: {
      where: {deleted: false; management: typeof PARENT_PART_MANAGEMENT}
      select: {
        beNumber: true
        Material_MaterialStructure_beNumberToMaterial: {select: {shortDescription: true}}
      }
    }
    Inventory_Inventory_materialIdToMaterial: {
      where: {deleted: false}
      orderBy: {createdAt: 'asc'}
    }
  }
}>

export async function getMaterials(options?: {includeDeleted?: boolean}) {
  const includeDeleted = options?.includeDeleted ?? false

export async function getMaterials() {
  return prismaClient.material.findMany({
    where: {deleted: false},
    include: {
      Unit: true,
      Employee: {
        select: {id: true, firstName: true, lastName: true},
      },
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
      // Removed invalid MaterialSerialTrack include
    },
    orderBy: {beNumber: 'asc'},
  })
}

export async function getMaterialById(id: string): Promise<MaterialWithRelations | null> {
  return prismaClient.material.findUnique({
    where: {id},
    include: {
      Unit: true,
      Employee: {
        select: {id: true, firstName: true, lastName: true},
      },
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
      Inventory_Inventory_materialIdToMaterial: {
        where: {deleted: false},
        orderBy: {createdAt: 'asc'},
      },
      // Removed invalid MaterialSerialTrack include
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

  return prismaClient.material.create({
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

  return prismaClient.material.update({
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

export async function getNonBeNumberItems() {
  return prismaClient.material.findMany({
    where: {
      beNumber: {
        not: null,
        notIn: [''],
        contains: '-', // Example: only include beNumbers with a dash (customize as needed)
      },
      deleted: false,
      // Optionally, filter by relation to the given materialId if needed
    },
    orderBy: {beNumber: 'asc'},
  })
}

export async function cloneMaterial(id: string, createdBy: string) {
  const original = await prismaClient.material.findUniqueOrThrow({where: {id}})
  const {id: _oldId, deleted: _deleted, deletedAt: _deletedAt, deletedBy: _deletedBy, beNumber, ...rest} = original
  const newId = randomUUID()

  // Generate a unique beNumber for the clone
  let baseBeNumber = beNumber ? String(beNumber) : 'CLONE'
  let newBeNumber = baseBeNumber + '-copy'
  let counter = 1
  while (await prismaClient.material.findUnique({where: {beNumber: newBeNumber}})) {
    newBeNumber = `${baseBeNumber}-copy${counter}`
    counter++
  }

  return await prismaClient.material.create({
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
