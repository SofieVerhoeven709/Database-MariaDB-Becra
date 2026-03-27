import {prismaClient} from '@/dal/prismaClient'

// ─── Shared includes ──────────────────────────────────────────────────────────

const employeeSelect = {select: {id: true, firstName: true, lastName: true}} as const

const visibilityInclude = {
  include: {
    RoleLevel: {include: {Role: true, SubRole: true}},
  },
} as const

const listInclude = {
  Employee_FollowUpStructure_createdByToEmployee: employeeSelect,
  Employee_FollowUpStructure_ownedByToEmployee: employeeSelect,
  Employee_FollowUpStructure_executedByToEmployee: employeeSelect,
  Employee_FollowUpStructure_taskForToEmployee: employeeSelect,
  Employee_FollowUpStructure_deletedByToEmployee: employeeSelect,
  Status: {select: {id: true, name: true}},
  UrgencyType: {select: {id: true, name: true}},
  Contact: {select: {id: true, firstName: true, lastName: true}},
  Target: {
    select: {
      id: true,
      VisibilityForRole: visibilityInclude,
    },
  },
} as const

const detailInclude = {
  Employee_FollowUpStructure_createdByToEmployee: employeeSelect,
  Employee_FollowUpStructure_ownedByToEmployee: employeeSelect,
  Employee_FollowUpStructure_executedByToEmployee: employeeSelect,
  Employee_FollowUpStructure_taskForToEmployee: employeeSelect,
  Employee_FollowUpStructure_deletedByToEmployee: employeeSelect,
  Status: {select: {id: true, name: true}},
  UrgencyType: {select: {id: true, name: true}},
  Contact: {select: {id: true, firstName: true, lastName: true}},
  Target: {
    include: {
      VisibilityForRole: visibilityInclude,
    },
  },
  FollowUp: {
    select: {
      id: true,
      activityDescription: true,
      FollowUpType: {select: {name: true}},
      Status: {select: {name: true}},
    },
  },
} as const

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getFollowUpStructures() {
  return prismaClient.followUpStructure.findMany({
    include: listInclude,
    orderBy: {contactDate: 'desc'},
  })
}

export async function getFollowUpStructuresByFollowUp(followUpId: string) {
  return prismaClient.followUpStructure.findMany({
    where: {followUpId},
    include: listInclude,
    orderBy: {contactDate: 'desc'},
  })
}

export async function getFollowUpStructureDetail(id: string) {
  return prismaClient.followUpStructure.findUniqueOrThrow({
    where: {id},
    include: detailInclude,
  })
}
