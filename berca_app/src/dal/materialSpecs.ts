import 'server-only'
import {prismaClient} from './prismaClient'
import {Prisma as PrismaClientLib} from '@/generated/prisma/client'
import type {Unit, MaterialPerformance, MaterialSpec, MaterialFamily, Employee} from '@/generated/prisma/client'
import type {Prisma} from '@/generated/prisma/client'

// ─── MaterialGroup ───────────────────────────────────────────────────────────

export type MaterialGroupOption = {
  id: string
  groupA: string
  groupB: string | null
  groupC: string | null
  groupD: string | null
  deleted: boolean
}

export function getMaterialGroups(includeDeleted = false): Promise<MaterialGroupOption[]> {
  return prismaClient.$queryRaw<MaterialGroupOption[]>(PrismaClientLib.sql`
    SELECT id, groupA, groupB, groupC, groupD, deleted
    FROM MaterialGroup
    ${includeDeleted ? PrismaClientLib.sql`` : PrismaClientLib.sql`WHERE deleted = 0`}
    ORDER BY groupA ASC, groupB ASC, groupC ASC, groupD ASC
  `)
}

export function createMaterialGroup(data: {
  id: string
  groupA: string
  groupB?: string | null
  groupC?: string | null
  groupD?: string | null
}) {
  return prismaClient.$executeRaw(
    PrismaClientLib.sql`
      INSERT INTO MaterialGroup (id, groupA, groupB, groupC, groupD, deleted, deletedAt, deletedBy)
      VALUES (${data.id}, ${data.groupA}, ${data.groupB ?? null}, ${data.groupC ?? null}, ${data.groupD ?? null}, 0, NULL, NULL)
    `,
  )
}

export function updateMaterialGroup(
  id: string,
  data: {
    groupA?: string
    groupB?: string | null
    groupC?: string | null
    groupD?: string | null
  },
) {
  const setParts: Array<ReturnType<typeof PrismaClientLib.sql>> = []
  if (data.groupA !== undefined) setParts.push(PrismaClientLib.sql`groupA = ${data.groupA}`)
  if (data.groupB !== undefined) setParts.push(PrismaClientLib.sql`groupB = ${data.groupB}`)
  if (data.groupC !== undefined) setParts.push(PrismaClientLib.sql`groupC = ${data.groupC}`)
  if (data.groupD !== undefined) setParts.push(PrismaClientLib.sql`groupD = ${data.groupD}`)

  if (setParts.length === 0) {
    return Promise.resolve(0)
  }

  const setClause = PrismaClientLib.join(setParts, ', ')
  return prismaClient.$executeRaw(
    PrismaClientLib.sql`
      UPDATE MaterialGroup
      SET ${setClause}
      WHERE id = ${id}
    `,
  )
}

export function softDeleteMaterialGroup(id: string, deletedBy: string) {
  return prismaClient.$executeRaw(
    PrismaClientLib.sql`
      UPDATE MaterialGroup
      SET deleted = 1,
          deletedAt = ${new Date()},
          deletedBy = ${deletedBy}
      WHERE id = ${id}
    `,
  )
}

export function restoreMaterialGroup(id: string) {
  return prismaClient.$executeRaw(
    PrismaClientLib.sql`
      UPDATE MaterialGroup
      SET deleted = 0,
          deletedAt = NULL,
          deletedBy = NULL
      WHERE id = ${id}
    `,
  )
}

// ─── Unit ────────────────────────────────────────────────────────────────────

export type UnitWithCreator = Unit & {
  Employee: Pick<Employee, 'id' | 'firstName' | 'lastName'>
}

export async function getUnits(includeDeleted = false): Promise<UnitWithCreator[]> {
  return prismaClient.unit.findMany({
    where: includeDeleted ? undefined : {deleted: false},
    include: {
      Employee: {select: {id: true, firstName: true, lastName: true}},
    },
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

export async function restoreUnit(id: string) {
  return prismaClient.unit.update({
    where: {id},
    data: {deleted: false, deletedAt: null, deletedBy: null},
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

export type MaterialPerformanceWithCreator = MaterialPerformance & {
  Employee: Pick<Employee, 'id' | 'firstName' | 'lastName'> | null
}

export async function getMaterialPerformances(includeDeleted = false): Promise<MaterialPerformanceWithCreator[]> {
  return prismaClient.materialPerformance.findMany({
    where: includeDeleted ? undefined : {deleted: false},
    include: {
      Employee: {select: {id: true, firstName: true, lastName: true}},
    },
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

export async function restoreMaterialPerformance(id: string) {
  return prismaClient.materialPerformance.update({
    where: {id},
    data: {deleted: false, deletedAt: null, deletedBy: null},
  })
}

