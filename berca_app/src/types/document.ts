import type {MappedVisibilityForRole} from '@/types/visibilityForRole'

// ─── Group option helpers (for dropdowns) ────────────────────────────────────

export interface DocumentGroupOption {
  id: string
  name: string | null
}

export interface DocumentPlaceOption {
  id: string
  headFolder: string
  subFolder: string | null
  /** Display label: "headFolder / subFolder" or just "headFolder" */
  label: string
}

// ─── Mapped document (list / table row) ──────────────────────────────────────

export interface MappedDocument {
  id: string
  documentNumber: string
  description: string | null
  descriptionShort: string
  createdAt: string
  expiryDate: string | null
  revisionNumber: number | null
  revisionDetail: string | null
  valid: boolean
  process: boolean
  additionalInfo: string | null
  referenceDocId: string | null
  referenceDocNumber: string | null
  roleId: string | null
  roleName: string | null
  // Group hierarchy
  documentGroupAId: string
  documentGroupAName: string | null
  documentGroupBId: string | null
  documentGroupBName: string | null
  documentGroupCId: string | null
  documentGroupCName: string | null
  documentGroupDId: string | null
  documentGroupDName: string | null
  // Place
  documentPlaceId: string
  documentPlaceLabel: string
  // People
  createdBy: string
  createdByName: string
  revisedById: string
  revisedByName: string
  managedById: string
  managedByName: string
  // Visibility
  targetId: string
  visibilityForRoles: MappedVisibilityForRole[]
  // Soft delete
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
}

// ─── Full detail ──────────────────────────────────────────────────────────────

export interface DocumentDetailData extends MappedDocument {
  // Could be extended with related records (e.g. FollowUps, TrainingDocuments)
}

// ─── Mapped group types ───────────────────────────────────────────────────────

export interface MappedDocumentGroupA {
  id: string
  name: string | null
  createdAt: string
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
}

export interface MappedDocumentGroupB {
  id: string
  name: string | null
  documentGroupAId: string
  documentGroupAName: string | null
  createdAt: string
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
}

export interface MappedDocumentGroupC {
  id: string
  name: string | null
  documentGroupBId: string
  documentGroupBName: string | null
  createdAt: string
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
}

export interface MappedDocumentGroupD {
  id: string
  name: string | null
  documentGroupCId: string
  documentGroupCName: string | null
  createdAt: string
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
}

export interface MappedDocumentPlace {
  id: string
  headFolder: string
  subFolder: string | null
  label: string
  createdAt: string
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
}
