import {z} from 'zod/v4'
import {dateSchema} from '@/schemas/schemaHelpers'
import {visibilityInputSchema} from '@/schemas/visibilityForRoleSchemas'
import {DOCUMENT_TARGET_TYPE_NAMES} from '@/types/document'

// ─── DocumentGroupA ───────────────────────────────────────────────────────────

const groupABase = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  createdBy: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})
export const createDocumentGroupASchema = groupABase.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})
export const updateDocumentGroupASchema = groupABase.omit({
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})
export const documentGroupAIdSchema = groupABase.pick({id: true})

// ─── DocumentGroupB ───────────────────────────────────────────────────────────

const groupBBase = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  createdBy: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})
export const createDocumentGroupBSchema = groupBBase.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})
export const updateDocumentGroupBSchema = groupBBase.omit({
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})
export const documentGroupBIdSchema = groupBBase.pick({id: true})

// ─── DocumentGroupC ───────────────────────────────────────────────────────────

const groupCBase = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  createdBy: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})
export const createDocumentGroupCSchema = groupCBase.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})
export const updateDocumentGroupCSchema = groupCBase.omit({
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})
export const documentGroupCIdSchema = groupCBase.pick({id: true})

// ─── DocumentGroupD ───────────────────────────────────────────────────────────

const groupDBase = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  createdBy: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})
export const createDocumentGroupDSchema = groupDBase.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})
export const updateDocumentGroupDSchema = groupDBase.omit({
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})
export const documentGroupDIdSchema = groupDBase.pick({id: true})

// ─── DocumentGroup (junction: links A+B+C+D) ──────────────────────────────────

const documentGroupBase = z.object({
  id: z.string(),
  groupAId: z.string().nullable().optional(),
  groupBId: z.string().nullable().optional(),
  groupCId: z.string().nullable().optional(),
  groupDId: z.string().nullable().optional(),
})
export const createDocumentGroupSchema = documentGroupBase.omit({id: true})
export const updateDocumentGroupSchema = documentGroupBase
export const documentGroupIdSchema = documentGroupBase.pick({id: true})

// ─── DocumentPlace ────────────────────────────────────────────────────────────

const documentPlaceBase = z.object({
  id: z.string(),
  headFolder: z.string(),
  subFolder: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  createdBy: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})
export const createDocumentPlaceSchema = documentPlaceBase.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})
export const updateDocumentPlaceSchema = documentPlaceBase.omit({
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})
export const documentPlaceIdSchema = documentPlaceBase.pick({id: true})

// ─── DocumentStatus ───────────────────────────────────────────────────────────

const documentStatusBase = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  createdBy: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})
export const createDocumentStatusSchema = documentStatusBase.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})
export const updateDocumentStatusSchema = documentStatusBase.omit({
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})
export const documentStatusIdSchema = documentStatusBase.pick({id: true})

// ─── DocumentRevision ─────────────────────────────────────────────────────────

const documentRevisionBase = z.object({
  id: z.string(),
  documentId: z.string(),
  shortDescription: z.string().nullable().optional(),
  longDescription: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  createdBy: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})
export const createDocumentRevisionSchema = documentRevisionBase.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})
export const updateDocumentRevisionSchema = documentRevisionBase.omit({
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})
export const documentRevisionIdSchema = documentRevisionBase.pick({id: true})

// ─── DocumentStructure ────────────────────────────────────────────────────────

export const documentStructureSchema = z.object({
  id: z.string(),
  documentNumber: z.string(),
  description: z.string().nullable().optional(),
  descriptionShort: z.string(),
  createdAt: z.coerce.date(),
  expiryDate: dateSchema.optional(),
  revisionNumber: z.number().int().nonnegative().nullable().optional(),
  revisionDetail: z.string().nullable().optional(),
  valid: z.boolean().default(true),
  process: z.boolean().default(false),
  canCopy: z.boolean().default(false),
  additionalInfo: z.string().nullable().optional(),
  referenceDocId: z.string().nullable().optional(),
  createdBy: z.string(),
  revisedById: z.string().nullable().optional(),
  managedById: z.string().nullable().optional(),
  targetId: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
  documentGroupId: z.string().nullable().optional(),
  documentPlaceId: z.string().nullable().optional(),
  documentStatusId: z.string().nullable().optional(),
})

export const createDocumentStructureSchema = documentStructureSchema
  .omit({id: true, createdAt: true, createdBy: true, targetId: true, deleted: true, deletedAt: true, deletedBy: true})
  .extend({
    visibilityForRoles: z.array(visibilityInputSchema).default([]),
    // Optional: link to a target entity at creation time
    documentTargetId: z.string().nullable().optional(),
    documentTargetTypeName: z.enum(DOCUMENT_TARGET_TYPE_NAMES).nullable().optional(),
  })

export const updateDocumentStructureSchema = documentStructureSchema
  .omit({createdAt: true, createdBy: true, targetId: true, deleted: true, deletedAt: true, deletedBy: true})
  .extend({
    visibilityForRoles: z.array(visibilityInputSchema).default([]),
    targetAssignments: z
      .array(
        z.object({
          typeName: z.enum(DOCUMENT_TARGET_TYPE_NAMES),
          targetId: z.string(),
        }),
      )
      .optional(),
  })

export const documentStructureIdSchema = documentStructureSchema.pick({id: true})

// ─── Copy document ────────────────────────────────────────────────────────────

export const copyDocumentStructureSchema = z.object({
  sourceId: z.string(),
  documentNumber: z.string(),
  descriptionShort: z.string(),
})
