import 'server-only'
import {randomUUID} from 'crypto'
import {prismaClient} from './prismaClient'
import type {Prisma} from '@/generated/prisma/client'

export type MaterialGroupOption = {
  id: string
  groupA: string
  groupB: string | null
  groupC: string | null
  groupD: string | null
}

export type MaterialWithRelations = Prisma.MaterialGetPayload<{
  include: {
    Unit: true
    Employee: {select: {id: true; firstName: true; lastName: true}}
    PreferredSupplierCompany: {select: {id: true; name: true}}
    MaterialSupplier: {include: {Company: {select: {id: true; name: true}}}}
  }
}>

export type MaterialWithDetails = Prisma.MaterialGetPayload<{
  include: {
    Unit: true
    Employee: {select: {id: true; firstName: true; lastName: true}}
    PreferredSupplierCompany: {select: {id: true; name: true}}
    MaterialSupplier: {include: {Company: {select: {id: true; name: true}}}}
    Inventory_Inventory_materialIdToMaterial: {
      where: {deleted: false}
      orderBy: {createdAt: 'asc'}
    }
  }
}>

export async function getMaterials(): Promise<MaterialWithRelations[]> {
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
    },
    orderBy: {beNumber: 'asc'},
  })
}

export async function getMaterialById(id: string): Promise<MaterialWithDetails | null> {
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
  brandOrderNr: string
  shortDescription: string
  longDescription?: string | null
  preferredSupplierCompanyId?: string | null
  supplierCompanyIds?: string[]
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
}) {
  const {supplierCompanyIds = [], ...materialData} = data

  return prismaClient.material.create({
    data: {
      ...materialData,
      MaterialSupplier:
        supplierCompanyIds.length > 0
          ? {
              create: supplierCompanyIds.map(companyId => ({
                id: randomUUID(),
                companyId,
              })),
            }
          : undefined,
    },
  })
}

export async function updateMaterial(
  id: string,
  data: {
    beNumber?: string
    name?: string | null
    brandOrderNr?: string
    shortDescription?: string
    longDescription?: string | null
    preferredSupplierCompanyId?: string | null
    supplierCompanyIds?: string[]
    brandName?: string | null
    documentationPlace?: string | null
    bePartDoc?: number | null
    rejected?: boolean | null
    materialGroupIdA?: string | null
    materialGroupIdB?: string | null
    materialGroupIdC?: string | null
    materialGroupIdD?: string | null
    unitId?: string
  },
) {
  const {supplierCompanyIds, ...materialData} = data

  return prismaClient.material.update({
    where: {id},
    data: {
      ...materialData,
      MaterialSupplier:
        supplierCompanyIds === undefined
          ? undefined
          : {
              deleteMany: {},
              create: supplierCompanyIds.map(companyId => ({
                id: randomUUID(),
                companyId,
              })),
            },
    },
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
