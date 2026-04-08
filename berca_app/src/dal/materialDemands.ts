import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

const materialDemandInclude = {
  Material: {select: {id: true, beNumber: true, name: true, shortDescription: true}},
  MaterialDemandSource: {select: {id: true}},
  QuoteSupplierLine: {select: {id: true}},
} as const

export async function getMaterialDemands() {
  return prismaClient.materialDemand.findMany({
    include: materialDemandInclude,
    orderBy: [{Material: {beNumber: 'asc'}}, {createdAt: 'desc'}],
  })
}

export async function getMaterialDemandMaterialOptions() {
  return prismaClient.material.findMany({
    where: {deleted: false},
    select: {id: true, beNumber: true, name: true, shortDescription: true},
    orderBy: {beNumber: 'asc'},
  })
}

export async function ensureMaterialDemandForMaterial(materialId: string) {
  return prismaClient.materialDemand.upsert({
    where: {materialId},
    update: {},
    create: {
      id: crypto.randomUUID(),
      materialId,
      totalRequiredQty: 0,
      reservedQty: 0,
      createdAt: new Date(),
    },
  })
}

export async function removeMaterialDemandForMaterial(materialId: string) {
  return prismaClient.materialDemand.deleteMany({
    where: {
      materialId,
      totalRequiredQty: 0,
      OR: [{reservedQty: 0}, {reservedQty: null}],
    },
  })
}

