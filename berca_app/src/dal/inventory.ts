import 'server-only'
import {prismaClient} from './prismaClient'
import type {Inventory, Material, Employee} from '@/generated/prisma/client'

export type InventoryWithRelations = Inventory & {
  Material_Inventory_materialIdToMaterial: Pick<Material, 'id' | 'name' | 'shortDescription' | 'beNumber' | 'unitId'>
  Employee: Pick<Employee, 'id'> & {firstName: string; lastName: string}
}

export async function getInventory(): Promise<InventoryWithRelations[]> {
  return prismaClient.inventory.findMany({
    where: {deleted: false},
    include: {
      Material_Inventory_materialIdToMaterial: {
        select: {id: true, name: true, shortDescription: true, beNumber: true, unitId: true},
      },
      Employee: {
        select: {id: true, firstName: true, lastName: true},
      },
    },
    orderBy: {beNumber: 'asc'},
  })
}

export async function getInventoryById(id: string): Promise<InventoryWithRelations | null> {
  return prismaClient.inventory.findUnique({
    where: {id},
    include: {
      Material_Inventory_materialIdToMaterial: {
        select: {id: true, name: true, shortDescription: true, beNumber: true, unitId: true},
      },
      Employee: {
        select: {id: true, firstName: true, lastName: true},
      },
    },
  })
}

export async function createInventory(data: {
  id: string
  materialId: string
  beNumber: string
  place: string
  shortDescription: string
  longDescription: string
  serieNumber: string
  quantityInStock: number
  minQuantityInStock: number
  maxQuantityInStock: number
  information: string
  valid: boolean
  noValidDate: Date
  createdBy: string
}) {
  return prismaClient.inventory.create({data})
}

export async function updateInventory(
  id: string,
  data: {
    place?: string
    shortDescription?: string
    longDescription?: string
    serieNumber?: string
    quantityInStock?: number
    minQuantityInStock?: number
    maxQuantityInStock?: number
    information?: string
    valid?: boolean
    noValidDate?: Date
  },
) {
  return prismaClient.inventory.update({where: {id}, data})
}

export async function softDeleteInventory(id: string, deletedBy: string) {
  return prismaClient.inventory.update({
    where: {id},
    data: {deleted: true, deletedAt: new Date(), deletedBy},
  })
}
