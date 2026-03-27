import 'server-only'
import {prismaClient} from './prismaClient'
import type {MaterialPrice, Employee, Company} from '@/generated/prisma/client'

export type MaterialPriceWithRelations = MaterialPrice & {
  Employee: Pick<Employee, 'id'> & {firstName: string; lastName: string}
  Company: Pick<Company, 'id' | 'name'> | null
  // beNumber on MaterialPrice is just a plain string; we look up the material manually in the mapper
}

export async function getMaterialPrices(): Promise<MaterialPriceWithRelations[]> {
  return prismaClient.materialPrice.findMany({
    where: {deleted: false},
    include: {
      Employee: {select: {id: true, firstName: true, lastName: true}},
      Company: {select: {id: true, name: true}},
    },
    orderBy: {updatedAt: 'desc'},
  })
}

/** Lightweight materials list for the price form picker */
export async function getMaterialsForPicker() {
  return prismaClient.material.findMany({
    where: {deleted: false},
    select: {beNumber: true, shortDescription: true, name: true},
    orderBy: {beNumber: 'asc'},
  })
}

export async function getMaterialPriceById(id: string): Promise<MaterialPriceWithRelations | null> {
  return prismaClient.materialPrice.findUnique({
    where: {id},
    include: {
      Employee: {select: {id: true, firstName: true, lastName: true}},
      Company: {select: {id: true, name: true}},
    },
  })
}

export async function createMaterialPrice(data: {
  id: string
  beNumber?: string | null
  orderNr?: string | null
  quoteBecra?: string | null
  supplierOrderNr?: string | null
  brandOrderNr?: string | null
  shortDescription?: string | null
  longDescription?: string | null
  brandName?: string | null
  rejected?: boolean | null
  additionalInfo?: string | null
  unitPrice?: number | null
  quantityPrice?: number | null
  companyId: string
  createdBy: string
}) {
  return prismaClient.materialPrice.create({data})
}

export async function updateMaterialPrice(
  id: string,
  data: {
    beNumber?: string | null
    orderNr?: string | null
    quoteBecra?: string | null
    supplierOrderNr?: string | null
    brandOrderNr?: string | null
    shortDescription?: string | null
    longDescription?: string | null
    brandName?: string | null
    rejected?: boolean | null
    additionalInfo?: string | null
    unitPrice?: number | null
    quantityPrice?: number | null
    companyId: string
    updatedAt?: Date
  },
) {
  return prismaClient.materialPrice.update({where: {id}, data})
}

export async function softDeleteMaterialPrice(id: string, deletedBy: string) {
  return prismaClient.materialPrice.update({
    where: {id},
    data: {deleted: true, deletedAt: new Date(), deletedBy},
  })
}

export async function hardDeleteMaterialPrice(id: string) {
  return prismaClient.materialPrice.delete({where: {id}})
}
