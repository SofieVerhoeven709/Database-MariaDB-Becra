import type {MappedVisibilityForRole} from '@/types/visibilityForRole'

// ─── Group / place / status option helpers ────────────────────────────────────

export interface DocumentGroupOption {
  id: string
  name: string | null
}

export interface DocumentPlaceOption {
  id: string
  headFolder: string
  subFolder: string | null
  label: string
}

export interface DocumentStatusOption {
  id: string
  name: string | null
}

// ─── MappedDocumentGroup — the junction row ───────────────────────────────────
// DocumentGroup links optional A/B/C/D ids together into a named combo.

export interface MappedDocumentGroup {
  id: string
  groupAId: string | null
  groupAName: string | null
  groupBId: string | null
  groupBName: string | null
  groupCId: string | null
  groupCName: string | null
  groupDId: string | null
  groupDName: string | null
  label: string
}

// ─── Target link (one DocumentStructureTarget row) ────────────────────────────

export interface MappedDocumentTarget {
  id: string // DocumentStructureTarget.id
  targetId: string // Target.id
  targetTypeName: string // TargetType.name
  targetDisplayName: string | null
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
  canCopy: boolean
  additionalInfo: string | null
  referenceDocId: string | null
  referenceDocNumber: string | null
  // Group
  documentGroupId: string | null
  documentGroup: MappedDocumentGroup | null
  // Place
  documentPlaceId: string | null
  documentPlaceLabel: string | null
  // Status
  documentStatusId: string | null
  documentStatusName: string | null
  // People
  createdBy: string
  createdByName: string
  revisedById: string | null
  revisedByName: string | null
  managedById: string | null
  managedByName: string | null
  // Target link (DocumentStructureTarget)
  documentTargetId: string | null // DocumentStructureTarget.id
  documentTargetTargetId: string | null // Target.id
  documentTargetTypeName: string | null // TargetType.name
  // Visibility
  targetId: string
  visibilityForRoles: MappedVisibilityForRole[]
  // Soft delete
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
  documentStructureTargets: {targetTypeName: string; targetDisplayName: string | null}[]
}

// ─── Revision ─────────────────────────────────────────────────────────────────

export interface MappedDocumentRevision {
  id: string
  documentId: string
  shortDescription: string | null
  longDescription: string | null
  createdAt: string
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
}

// ─── Full detail (includes revisions + all target links) ─────────────────────

export interface DocumentDetailData extends MappedDocument {
  revisions: MappedDocumentRevision[]
  documentStructureTargets: MappedDocumentTarget[]
}

// ─── Mapped group types (for management tabs) ─────────────────────────────────

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

export interface MappedDocumentStatus {
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

// ─── Allowed target types for document ───────────────────────────────────────

export const DOCUMENT_TARGET_TYPE_NAMES = ['Material', 'Project', 'Company'] as const
export type DocumentTargetTypeName = (typeof DOCUMENT_TARGET_TYPE_NAMES)[number]
