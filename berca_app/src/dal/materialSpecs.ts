import 'server-only'
import {prismaClient} from './prismaClient'
import type {MaterialGroup, Unit, MaterialPerformance, MaterialSpec, MaterialFamily} from '@/generated/prisma/client'
import type {Prisma} from '@/generated/prisma/client'

// ─── MaterialGroup ───────────────────────────────────────────────────────────

export async function getMaterialGroups(): Promise<MaterialGroup[]> {
  return prismaClient.materialGroup.findMany({
    where: {deleted: false},
    orderBy: {groupA: 'asc'},
  })
}

export async function createMaterialGroup(data: {
  id: string
  groupA: string
  groupB?: string | null
  groupC?: string | null
  groupD?: string | null
}) {
  return prismaClient.materialGroup.create({data})
}

export async function updateMaterialGroup(
  id: string,
  data: {
    groupA?: string
    groupB?: string | null
    groupC?: string | null
    groupD?: string | null
  },
) {
  return prismaClient.materialGroup.update({where: {id}, data})
}

export async function softDeleteMaterialGroup(id: string, deletedBy: string) {
  return prismaClient.materialGroup.update({
    where: {id},
    data: {deleted: true, deletedAt: new Date(), deletedBy},
  })
}

// ─── Unit ────────────────────────────────────────────────────────────────────

export async function getUnits(): Promise<Unit[]> {
  return prismaClient.unit.findMany({
    where: {deleted: false},
    orderBy: {unitName: 'asc'},
  })
}

export async function createUnit(data: Prisma.UnitUncheckedCreateInput) {
  return prismaClient.unit.create({data})
}

export async function updateUnit(id: string, data: Prisma.UnitUncheckedUpdateInput) {
  return prismaClient.unit.update({where: {id}, data})
}

export async function softDeleteUnit(id: string, deletedBy: string) {
  return prismaClient.unit.update({
    where: {id},
    data: {deleted: true, deletedAt: new Date(), deletedBy},
  })
}

// ─── MaterialSpec (for dropdown) ──────────────────────────────────────────────

export async function getMaterialSpecs(): Promise<MaterialSpec[]> {
  return prismaClient.materialSpec.findMany({
    where: {deleted: false},
    orderBy: {name: 'asc'},
  })
}

// ─── MaterialFamily (for dropdown) ───────────────────────────────────────────

export async function getMaterialFamilies(): Promise<MaterialFamily[]> {
  return prismaClient.materialFamily.findMany({
    where: {deleted: false},
    orderBy: {name: 'asc'},
  })
}

// ─── MaterialPerformance ──────────────────────────────────────────────────────

export async function getMaterialPerformances(): Promise<MaterialPerformance[]> {
  return prismaClient.materialPerformance.findMany({
    where: {deleted: false},
    orderBy: {name: 'asc'},
  })
}

export async function createMaterialPerformance(data: {
  id: string
  name: string
  materialSpecId?: string | null
  materialFamilyId?: string | null
  shortDescription?: string | null
  longDescription?: string | null
  createdBy: string
  createdAt: Date
}) {
  return prismaClient.materialPerformance.create({data})
}

export async function updateMaterialPerformance(
  id: string,
  data: {
    name?: string
    materialSpecId?: string | null
    materialFamilyId?: string | null
    shortDescription?: string | null
    longDescription?: string | null
  },
) {
  return prismaClient.materialPerformance.update({where: {id}, data})
}

export async function softDeleteMaterialPerformance(id: string, deletedBy: string) {
  return prismaClient.materialPerformance.update({
    where: {id},
    data: {deleted: true, deletedAt: new Date(), deletedBy},
  })
}
