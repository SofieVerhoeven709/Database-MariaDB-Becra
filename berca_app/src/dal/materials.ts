import 'server-only'
import {prismaClient} from './prismaClient'
import type {Material, MaterialGroup, Unit, Employee, Inventory} from '@/generated/prisma/client'

export type MaterialWithRelations = Material & {
  MaterialGroup: MaterialGroup
  Unit: Unit
  Employee: Pick<Employee, 'id'> & {firstName: string; lastName: string}
}

export type MaterialWithDetails = MaterialWithRelations & {
  Inventory_Inventory_materialIdToMaterial: Inventory[]
}

export async function getMaterials(): Promise<MaterialWithRelations[]> {
  return prismaClient.material.findMany({
    where: {deleted: false},
    include: {
      MaterialGroup: true,
      Unit: true,
      Employee: {
        select: {id: true, firstName: true, lastName: true},
      },
    },
    orderBy: {beNumber: 'asc'},
  })
}

export async function getMaterialById(id: string): Promise<MaterialWithDetails | null> {
  return prismaClient.material.findUnique({
    where: {id},
    include: {
      MaterialGroup: true,
      Unit: true,
      Employee: {
        select: {id: true, firstName: true, lastName: true},
      },
      Inventory_Inventory_materialIdToMaterial: {
        where: {deleted: false},
        orderBy: {createdAt: 'asc'},
      },
    },
  }) as Promise<MaterialWithDetails | null>
}

export async function getMaterialGroups() {
  return prismaClient.materialGroup.findMany({
    where: {deleted: false},
    orderBy: {groupA: 'asc'},
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
  brandOrderNr: number
  shortDescription: string
  longDescription?: string | null
  preferredSupplier?: string | null
  brandName?: string | null
  documentationPlace?: string | null
  bePartDoc?: number | null
  rejected?: boolean | null
  materialGroupId: string
  unitId: string
  createdBy: string
}) {
  return prismaClient.material.create({data})
}

export async function updateMaterial(
  id: string,
  data: {
    beNumber?: string
    name?: string | null
    brandOrderNr?: number
    shortDescription?: string
    longDescription?: string | null
    preferredSupplier?: string | null
    brandName?: string | null
    documentationPlace?: string | null
    bePartDoc?: number | null
    rejected?: boolean | null
    materialGroupId?: string
    unitId?: string
  },
) {
  return prismaClient.material.update({where: {id}, data})
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
