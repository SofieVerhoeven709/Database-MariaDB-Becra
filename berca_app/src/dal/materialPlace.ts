import 'server-only'
import {prismaClient} from './prismaClient'
import type {WarehousePlace, Employee} from '@/generated/prisma/client'

// Material Place is currently backed by the warehousePlace table until a dedicated model is introduced.
export type MaterialPlaceWithRelations = WarehousePlace & {
  Employee: Pick<Employee, 'id' | 'firstName' | 'lastName'>
  Employee_WarehousePlace_deletedByToEmployee: Pick<Employee, 'id' | 'firstName' | 'lastName'> | null
}

export async function getMaterialPlaces(options?: {includeDeleted?: boolean}): Promise<MaterialPlaceWithRelations[]> {
  const includeDeleted = options?.includeDeleted ?? false

  return prismaClient.warehousePlace.findMany({
    where: includeDeleted ? undefined : {deleted: false},
    include: {
      Employee: {select: {id: true, firstName: true, lastName: true}},
      Employee_WarehousePlace_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
    },
    orderBy: {place: 'asc'},
  })
}

export async function getMaterialPlaceById(id: string): Promise<MaterialPlaceWithRelations | null> {
  return prismaClient.warehousePlace.findUnique({
    where: {id},
    include: {
      Employee: {select: {id: true, firstName: true, lastName: true}},
      Employee_WarehousePlace_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
    },
  })
}

export async function createMaterialPlace(data: {
  id: string
  abbreviation: string
  beNumber?: string
  serialTrackedId?: string
  place?: string
  shelf?: string
  column?: string
  layer?: string
  layerPlace?: string
  information?: string
  quantityInStock: number
  createdAt: Date
  createdBy: string
}) {
  return prismaClient.warehousePlace.create({data})
}

export async function updateMaterialPlace(
  id: string,
  data: {
    abbreviation?: string
    beNumber?: string
    serialTrackedId?: string
    place?: string
    shelf?: string
    column?: string
    layer?: string
    layerPlace?: string
    information?: string
    quantityInStock?: number
  },
) {
  return prismaClient.warehousePlace.update({where: {id}, data})
}

export async function softDeleteMaterialPlace(id: string, deletedBy: string) {
  return prismaClient.warehousePlace.update({
    where: {id},
    data: {deleted: true, deletedAt: new Date(), deletedBy},
  })
}

export async function restoreMaterialPlace(id: string) {
  return prismaClient.warehousePlace.update({
    where: {id},
    data: {deleted: false, deletedAt: null, deletedBy: null},
  })
}

