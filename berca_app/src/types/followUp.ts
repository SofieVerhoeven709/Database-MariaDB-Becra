import type {MappedVisibilityForRole} from '@/types/visibilityForRole'

// ─── FollowUp target (what the follow-up is about) ───────────────────────────

export interface MappedFollowUpTarget {
  id: string // FollowUpTarget.id
  targetId: string // Target.id
  targetTypeName: string // TargetType.name  e.g. "Contact", "Company"
  deleted: boolean
}

// ─── FollowUpStructure summary (used inside FollowUp detail tab) ──────────────

export interface MappedFollowUpStructureSummary {
  id: string
  contactDate: string
  item: string | null
  activityDescription: string | null
  taskDescription: string | null
  actionAgenda: string | null
  closedAgenda: string | null
  statusName: string
  urgencyTypeName: string
  createdByName: string
  deleted: boolean
}

// ─── List / table row ────────────────────────────────────────────────────────

export interface MappedFollowUp {
  id: string
  activityDescription: string | null
  additionalInfo: string | null
  actionAgenda: string | null
  closedAgenda: string | null
  recurringCallDays: number | null
  createdAt: string
  itemClosed: boolean
  salesFollowUp: boolean
  nonConform: boolean
  periodicControl: boolean
  recurringActive: boolean
  review: boolean
  // Relations — resolved names
  createdBy: string
  createdByName: string
  ownedBy: string
  ownedByName: string
  executedBy: string
  executedByName: string
  statusId: string
  statusName: string
  urgencyTypeId: string
  urgencyTypeName: string
  followUpTypeId: string
  followUpTypeName: string
  // Target (what this follow-up is about)
  targetTypeName: string | null // null if no FollowUpTarget link yet
  followUpTargetId: string | null // FollowUpTarget.id
  followUpTargetTargetId: string | null // the actual Target.id it points to
  // Visibility
  targetId: string // FollowUp's own Target for visibility
  visibilityForRoles: MappedVisibilityForRole[]
  // Soft delete
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
}

// ─── Full detail (includes structure tab) ────────────────────────────────────

export interface FollowUpDetailData extends MappedFollowUp {
  structures: MappedFollowUpStructureSummary[]
}
