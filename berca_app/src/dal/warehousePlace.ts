import 'server-only'
import {prismaClient} from './prismaClient'
import type {WarehousePlace, Employee, Prisma} from '@/generated/prisma/client'

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

async function syncMaterialWarehousePlace(
  tx: Prisma.TransactionClient,
  data: {
    warehousePlaceId: string
    beNumber?: string | null
  },
) {
  const beNumber = data.beNumber?.trim() || null

  if (!beNumber) {
    await tx.material.updateMany({
      where: {warehousePlaceId: data.warehousePlaceId},
      data: {warehousePlaceId: null},
    })
    return
  }

  await tx.material.updateMany({
    where: {warehousePlaceId: data.warehousePlaceId, beNumber: {not: beNumber}},
    data: {warehousePlaceId: null},
  })

  await tx.material.updateMany({
    where: {beNumber},
    data: {warehousePlaceId: data.warehousePlaceId},
  })
}

export async function createWarehousePlace(data: {
  id: string
  abbreviation: string
  beNumber?: string | null
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
  return prismaClient.$transaction(async tx => {
    const place = await tx.warehousePlace.create({data})
    await syncMaterialWarehousePlace(tx, {warehousePlaceId: place.id, beNumber: place.beNumber})
    return place
  })
}

export async function updateWarehousePlace(
  id: string,
  data: {
    abbreviation?: string
    beNumber?: string | null
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
  return prismaClient.$transaction(async tx => {
    const place = await tx.warehousePlace.update({where: {id}, data})
    if ('beNumber' in data) {
      await syncMaterialWarehousePlace(tx, {warehousePlaceId: place.id, beNumber: place.beNumber})
    }
    return place
  })
}

export async function softDeleteWarehousePlace(id: string, deletedBy: string) {
  return prismaClient.$transaction(async tx => {
    const place = await tx.warehousePlace.update({
      where: {id},
      data: {deleted: true, deletedAt: new Date(), deletedBy},
    })
    await tx.material.updateMany({
      where: {warehousePlaceId: id},
      data: {warehousePlaceId: null},
    })
    return place
  })
}
