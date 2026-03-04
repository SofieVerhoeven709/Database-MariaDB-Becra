import 'server-only'
import type {Department} from '@/generated/prisma/client'
import {prismaClient} from '@/dal/prismaClient'

const departmentWithRelations = {
  Target: {
    include: {
      VisibilityForRole: {
        include: {
          RoleLevel: {
            include: {
              Role: true,
              SubRole: true,
            },
          },
        },
      },
    },
  },
  Employee_Department_createdByToEmployee: {
    select: {id: true, firstName: true, lastName: true},
  },
  Employee_Department_deletedByToEmployee: {
    select: {id: true, firstName: true, lastName: true},
  },
} as const

export async function getDepartments() {
  return prismaClient.department.findMany({
    include: departmentWithRelations,
    orderBy: [{number: 'asc'}, {name: 'asc'}],
  })
}

export async function getDepartmentsActive() {
  return prismaClient.department.findMany({
    where: {deleted: false},
    include: departmentWithRelations,
    orderBy: [{number: 'asc'}, {name: 'asc'}],
  })
}

export async function getDepartmentById(id: string): Promise<Department | null> {
  return prismaClient.department.findFirst({where: {id}})
}

export async function getDepartmentByIdWithRelations(id: string) {
  return prismaClient.department.findFirst({
    where: {id},
    include: departmentWithRelations,
  })
}

export async function getDepartmentByIdOrThrow(id: string) {
  return prismaClient.department.findFirstOrThrow({
    where: {id},
    include: departmentWithRelations,
  })
}
