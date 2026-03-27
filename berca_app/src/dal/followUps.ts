import {prismaClient} from '@/dal/prismaClient'

// ─── Shared includes ──────────────────────────────────────────────────────────

const employeeSelect = {select: {id: true, firstName: true, lastName: true}} as const

const followUpTargetInclude = {
  where: {deleted: false},
  take: 1,
  include: {
    Target: {
      select: {
        id: true,
        TargetType: {select: {name: true}},
      },
    },
  },
} as const

const visibilityInclude = {
  include: {
    RoleLevel: {include: {Role: true, SubRole: true}},
  },
} as const

const listInclude = {
  Employee_FollowUp_createdByToEmployee: employeeSelect,
  Employee_FollowUp_ownedByToEmployee: employeeSelect,
  Employee_FollowUp_executedByToEmployee: employeeSelect,
  Employee_FollowUp_deletedByToEmployee: employeeSelect,
  Status: {select: {id: true, name: true}},
  UrgencyType: {select: {id: true, name: true}},
  FollowUpType: {select: {id: true, name: true}},
  FollowUpTarget: followUpTargetInclude,
  Target: {
    select: {
      id: true,
      VisibilityForRole: visibilityInclude,
    },
  },
} as const

const detailInclude = {
  Employee_FollowUp_createdByToEmployee: employeeSelect,
  Employee_FollowUp_ownedByToEmployee: employeeSelect,
  Employee_FollowUp_executedByToEmployee: employeeSelect,
  Employee_FollowUp_deletedByToEmployee: employeeSelect,
  Status: {select: {id: true, name: true}},
  UrgencyType: {select: {id: true, name: true}},
  FollowUpType: {select: {id: true, name: true}},
  FollowUpTarget: followUpTargetInclude,
  Target: {
    include: {
      VisibilityForRole: visibilityInclude,
    },
  },
  FollowUpStructure: {
    where: {deleted: false},
    orderBy: {contactDate: 'desc' as const},
    include: {
      Status: {select: {name: true}},
      UrgencyType: {select: {name: true}},
      Employee_FollowUpStructure_createdByToEmployee: {
        select: {firstName: true, lastName: true},
      },
    },
  },
} as const

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getFollowUps() {
  return prismaClient.followUp.findMany({
    include: listInclude,
    orderBy: {createdAt: 'desc'},
  })
}

export async function getFollowUpDetail(id: string) {
  return prismaClient.followUp.findUniqueOrThrow({
    where: {id},
    include: detailInclude,
  })
}
