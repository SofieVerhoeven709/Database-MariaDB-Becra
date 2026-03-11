import type {Prisma} from '@/generated/prisma/client'
import type {MappedFollowUpStructure, FollowUpStructureDetailData} from '@/types/followUpStructure'
import {mapVisibility} from '@/extra/visibilityForRole'

// ─── Prisma payload types ─────────────────────────────────────────────────────

export type FollowUpStructureListPayload = Prisma.FollowUpStructureGetPayload<{
  include: {
    Employee_FollowUpStructure_createdByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_FollowUpStructure_ownedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_FollowUpStructure_executedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_FollowUpStructure_taskForToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_FollowUpStructure_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Status: {select: {id: true; name: true}}
    UrgencyType: {select: {id: true; name: true}}
    Contact: {select: {id: true; firstName: true; lastName: true}}
    Target: {
      select: {
        id: true
        VisibilityForRole: {
          include: {RoleLevel: {include: {Role: true; SubRole: true}}}
        }
      }
    }
  }
}>

export type FollowUpStructureDetailPayload = Prisma.FollowUpStructureGetPayload<{
  include: {
    Employee_FollowUpStructure_createdByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_FollowUpStructure_ownedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_FollowUpStructure_executedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_FollowUpStructure_taskForToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_FollowUpStructure_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Status: {select: {id: true; name: true}}
    UrgencyType: {select: {id: true; name: true}}
    Contact: {select: {id: true; firstName: true; lastName: true}}
    Target: {
      include: {
        VisibilityForRole: {
          include: {RoleLevel: {include: {Role: true; SubRole: true}}}
        }
      }
    }
    FollowUp: {
      select: {
        id: true
        activityDescription: true
        FollowUpType: {select: {name: true}}
        Status: {select: {name: true}}
      }
    }
  }
}>

// ─── List mapper ──────────────────────────────────────────────────────────────

export function mapFollowUpStructure(s: FollowUpStructureListPayload): MappedFollowUpStructure {
  const deletedBy = s.Employee_FollowUpStructure_deletedByToEmployee

  return {
    id: s.id,
    activityDescription: s.activityDescription,
    additionalInfo: s.additionalInfo,
    actionAgenda: s.actionAgenda?.toISOString() ?? null,
    closedAgenda: s.closedAgenda?.toISOString() ?? null,
    recurringItem: s.recurringItem,
    item: s.item,
    contactDate: s.contactDate.toISOString(),
    taskDescription: s.taskDescription,
    taskStartDate: s.taskStartDate?.toISOString() ?? null,
    taskCompleteDate: s.taskCompleteDate?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    recurringActive: s.recurringActive,
    createdBy: s.createdBy,
    createdByName: `${s.Employee_FollowUpStructure_createdByToEmployee.firstName} ${s.Employee_FollowUpStructure_createdByToEmployee.lastName}`,
    ownedBy: s.ownedBy,
    ownedByName: `${s.Employee_FollowUpStructure_ownedByToEmployee.firstName} ${s.Employee_FollowUpStructure_ownedByToEmployee.lastName}`,
    executedBy: s.executedBy,
    executedByName: `${s.Employee_FollowUpStructure_executedByToEmployee.firstName} ${s.Employee_FollowUpStructure_executedByToEmployee.lastName}`,
    taskFor: s.taskFor,
    taskForName: `${s.Employee_FollowUpStructure_taskForToEmployee.firstName} ${s.Employee_FollowUpStructure_taskForToEmployee.lastName}`,
    statusId: s.statusId,
    statusName: s.Status.name,
    urgencyTypeId: s.urgencyTypeId,
    urgencyTypeName: s.UrgencyType.name,
    followUpId: s.followUpId,
    contactId: s.contactId,
    contactName: `${s.Contact.firstName} ${s.Contact.lastName}`,
    targetId: s.Target.id,
    visibilityForRoles: s.Target.VisibilityForRole.map(mapVisibility),
    deleted: s.deleted,
    deletedAt: s.deletedAt?.toISOString() ?? null,
    deletedBy: s.deletedBy,
    deletedByName: deletedBy ? `${deletedBy.firstName} ${deletedBy.lastName}` : null,
  }
}

// ─── Detail mapper ────────────────────────────────────────────────────────────

export function mapFollowUpStructureDetail(s: FollowUpStructureDetailPayload): FollowUpStructureDetailData {
  const base = mapFollowUpStructure(s as unknown as FollowUpStructureListPayload)
  return {
    ...base,
    followUp: {
      id: s.FollowUp.id,
      activityDescription: s.FollowUp.activityDescription,
      followUpTypeName: s.FollowUp.FollowUpType.name,
      statusName: s.FollowUp.Status.name,
    },
  }
}
