import type {MappedVisibilityForRole} from '@/types/visibilityForRole'

// ─── List / table row ────────────────────────────────────────────────────────

export interface MappedFollowUpStructure {
  id: string
  activityDescription: string | null
  additionalInfo: string | null
  actionAgenda: string | null
  closedAgenda: string | null
  recurringItem: string | null
  item: string | null
  contactDate: string
  taskDescription: string | null
  taskStartDate: string | null
  taskCompleteDate: string | null
  createdAt: string
  recurringActive: boolean
  // Relations — resolved names
  createdBy: string
  createdByName: string
  ownedBy: string
  ownedByName: string
  executedBy: string
  executedByName: string
  taskFor: string
  taskForName: string
  statusId: string
  statusName: string
  urgencyTypeId: string
  urgencyTypeName: string
  // Parent follow-up
  followUpId: string
  // Contact (who was contacted)
  contactId: string
  contactName: string // firstName + lastName
  // Visibility
  targetId: string // FollowUpStructure's own Target for visibility
  visibilityForRoles: MappedVisibilityForRole[]
  // Soft delete
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
}

// ─── Full detail ──────────────────────────────────────────────────────────────

export interface FollowUpStructureDetailData extends MappedFollowUpStructure {
  // Parent follow-up summary for breadcrumb / header
  followUp: {
    id: string
    activityDescription: string | null
    followUpTypeName: string
    statusName: string
  }
}
