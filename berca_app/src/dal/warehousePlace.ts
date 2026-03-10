import 'server-only'
import {prismaClient} from './prismaClient'
import type {WarehousePlace, Employee} from '@/generated/prisma/client'

export type WarehousePlaceWithRelations = WarehousePlace & {
  Employee: Pick<Employee, 'id' | 'firstName' | 'lastName'>
}

export async function getWarehousePlaces(): Promise<WarehousePlaceWithRelations[]> {
  return prismaClient.warehousePlace.findMany({
    where: {deleted: false},
    include: {
      Employee: {select: {id: true, firstName: true, lastName: true}},
    },
    orderBy: {place: 'asc'},
  })
}

export async function getWarehousePlaceById(id: string): Promise<WarehousePlaceWithRelations | null> {
  return prismaClient.warehousePlace.findUnique({
    where: {id},
    include: {
      Employee: {select: {id: true, firstName: true, lastName: true}},
    },
  })
}

export async function createWarehousePlace(data: {
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

export async function updateWarehousePlace(
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

export async function softDeleteWarehousePlace(id: string, deletedBy: string) {
  return prismaClient.warehousePlace.update({
    where: {id},
    data: {deleted: true, deletedAt: new Date(), deletedBy},
  })
}
