import type {Prisma} from '@/generated/prisma/client'
import type {MappedFollowUp, FollowUpDetailData, MappedFollowUpStructureSummary} from '@/types/followUp'
import {mapVisibility} from '@/extra/visibilityForRole'

// ─── Prisma payload types ─────────────────────────────────────────────────────

export type FollowUpListPayload = Prisma.FollowUpGetPayload<{
  include: {
    Employee_FollowUp_createdByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_FollowUp_ownedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_FollowUp_executedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_FollowUp_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Status: {select: {id: true; name: true}}
    UrgencyType: {select: {id: true; name: true}}
    FollowUpType: {select: {id: true; name: true}}
    FollowUpTarget: {
      where: {deleted: false}
      take: 1
      include: {
        Target: {
          select: {
            id: true
            TargetType: {select: {name: true}}
          }
        }
      }
    }
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

export type FollowUpDetailPayload = Prisma.FollowUpGetPayload<{
  include: {
    Employee_FollowUp_createdByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_FollowUp_ownedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_FollowUp_executedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_FollowUp_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Status: {select: {id: true; name: true}}
    UrgencyType: {select: {id: true; name: true}}
    FollowUpType: {select: {id: true; name: true}}
    FollowUpTarget: {
      where: {deleted: false}
      take: 1
      include: {
        Target: {
          select: {
            id: true
            TargetType: {select: {name: true}}
          }
        }
      }
    }
    Target: {
      include: {
        VisibilityForRole: {
          include: {RoleLevel: {include: {Role: true; SubRole: true}}}
        }
      }
    }
    FollowUpStructure: {
      where: {deleted: false}
      orderBy: {contactDate: 'desc'}
      include: {
        Status: {select: {name: true}}
        UrgencyType: {select: {name: true}}
        Employee_FollowUpStructure_createdByToEmployee: {select: {firstName: true; lastName: true}}
      }
    }
  }
}>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveTarget(followUpTargets: FollowUpListPayload['FollowUpTarget']): {
  targetTypeName: string | null
  followUpTargetId: string | null
  followUpTargetTargetId: string | null
} {
  const first = followUpTargets[0]
  if (!first) return {targetTypeName: null, followUpTargetId: null, followUpTargetTargetId: null}
  return {
    targetTypeName: first.Target.TargetType.name,
    followUpTargetId: first.id,
    followUpTargetTargetId: first.Target.id,
  }
}

// ─── List mapper ──────────────────────────────────────────────────────────────

export function mapFollowUp(f: FollowUpListPayload): MappedFollowUp {
  const {targetTypeName, followUpTargetId, followUpTargetTargetId} = resolveTarget(f.FollowUpTarget)
  const deletedBy = f.Employee_FollowUp_deletedByToEmployee

  return {
    id: f.id,
    activityDescription: f.activityDescription,
    additionalInfo: f.additionalInfo,
    actionAgenda: f.actionAgenda?.toISOString() ?? null,
    closedAgenda: f.closedAgenda?.toISOString() ?? null,
    recurringCallDays: f.recurringCallDays,
    createdAt: f.createdAt.toISOString(),
    itemClosed: f.itemClosed,
    salesFollowUp: f.salesFollowUp,
    nonConform: f.nonConform,
    periodicControl: f.periodicControl,
    recurringActive: f.recurringActive,
    review: f.review,
    createdBy: f.createdBy,
    createdByName: `${f.Employee_FollowUp_createdByToEmployee.firstName} ${f.Employee_FollowUp_createdByToEmployee.lastName}`,
    ownedBy: f.ownedBy,
    ownedByName: `${f.Employee_FollowUp_ownedByToEmployee.firstName} ${f.Employee_FollowUp_ownedByToEmployee.lastName}`,
    executedBy: f.executedBy,
    executedByName: `${f.Employee_FollowUp_executedByToEmployee.firstName} ${f.Employee_FollowUp_executedByToEmployee.lastName}`,
    statusId: f.statusId,
    statusName: f.Status.name,
    urgencyTypeId: f.urgencyTypeId,
    urgencyTypeName: f.UrgencyType.name,
    followUpTypeId: f.followUpTypeId,
    followUpTypeName: f.FollowUpType.name,
    targetTypeName,
    followUpTargetId,
    followUpTargetTargetId,
    targetId: f.Target.id,
    visibilityForRoles: f.Target.VisibilityForRole.map(mapVisibility),
    deleted: f.deleted,
    deletedAt: f.deletedAt?.toISOString() ?? null,
    deletedBy: f.deletedBy,
    deletedByName: deletedBy ? `${deletedBy.firstName} ${deletedBy.lastName}` : null,
  }
}

// ─── Structure summary mapper (for detail tab) ────────────────────────────────

function mapStructureSummary(s: FollowUpDetailPayload['FollowUpStructure'][number]): MappedFollowUpStructureSummary {
  const emp = s.Employee_FollowUpStructure_createdByToEmployee
  return {
    id: s.id,
    contactDate: s.contactDate.toISOString(),
    item: s.item,
    activityDescription: s.activityDescription,
    taskDescription: s.taskDescription,
    actionAgenda: s.actionAgenda?.toISOString() ?? null,
    closedAgenda: s.closedAgenda?.toISOString() ?? null,
    statusName: s.Status.name,
    urgencyTypeName: s.UrgencyType.name,
    createdByName: `${emp.firstName} ${emp.lastName}`,
    deleted: s.deleted,
  }
}

// ─── Detail mapper ────────────────────────────────────────────────────────────

export function mapFollowUpDetail(f: FollowUpDetailPayload): FollowUpDetailData {
  const base = mapFollowUp(f as unknown as FollowUpListPayload)
  return {
    ...base,
    structures: f.FollowUpStructure.map(mapStructureSummary),
  }
}
