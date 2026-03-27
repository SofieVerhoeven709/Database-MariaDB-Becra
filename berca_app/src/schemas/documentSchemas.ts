import {z} from 'zod/v4'
import {dateSchema} from '@/schemas/schemaHelpers'
import {visibilityInputSchema} from '@/schemas/visibilityForRoleSchemas'

// ─── DocumentGroupA ───────────────────────────────────────────────────────────

const documentGroupABase = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  createdBy: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})

export const createDocumentGroupASchema = documentGroupABase.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})

export const updateDocumentGroupASchema = documentGroupABase.omit({
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})

export const documentGroupAIdSchema = documentGroupABase.pick({id: true})

// ─── DocumentGroupB ───────────────────────────────────────────────────────────

const documentGroupBBase = z.object({
  id: z.string(),
  documentGroupAId: z.string(),
  name: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  createdBy: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})

export const createDocumentGroupBSchema = documentGroupBBase.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})

export const updateDocumentGroupBSchema = documentGroupBBase.omit({
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})

export const documentGroupBIdSchema = documentGroupBBase.pick({id: true})

// ─── DocumentGroupC ───────────────────────────────────────────────────────────

const documentGroupCBase = z.object({
  id: z.string(),
  documentGroupBId: z.string(),
  name: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  createdBy: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})

export const createDocumentGroupCSchema = documentGroupCBase.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})

export const updateDocumentGroupCSchema = documentGroupCBase.omit({
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})

export const documentGroupCIdSchema = documentGroupCBase.pick({id: true})

// ─── DocumentGroupD ───────────────────────────────────────────────────────────

const documentGroupDBase = z.object({
  id: z.string(),
  documentGroupCId: z.string(),
  name: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  createdBy: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})

export const createDocumentGroupDSchema = documentGroupDBase.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})

export const updateDocumentGroupDSchema = documentGroupDBase.omit({
  createdAt: true,
  createdBy: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})

export const documentGroupDIdSchema = documentGroupDBase.pick({id: true})

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
  additionalInfo: z.string().nullable().optional(),
  referenceDocId: z.string().nullable().optional(),
  roleId: z.string().nullable().optional(),
  createdBy: z.string(),
  revisedById: z.string(),
  managedById: z.string(),
  targetId: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
  documentGroupAId: z.string(),
  documentGroupBId: z.string(),
  documentGroupCId: z.string(),
  documentGroupDId: z.string(),
  documentPlaceId: z.string(),
})

export const createDocumentStructureSchema = documentStructureSchema
  .omit({
    id: true,
    createdAt: true,
    createdBy: true,
    targetId: true,
    deleted: true,
    deletedAt: true,
    deletedBy: true,
  })
  .extend({
    visibilityForRoles: z.array(visibilityInputSchema).default([]),
  })

export const updateDocumentStructureSchema = documentStructureSchema
  .omit({
    createdAt: true,
    createdBy: true,
    targetId: true,
    deleted: true,
    deletedAt: true,
    deletedBy: true,
  })
  .extend({
    visibilityForRoles: z.array(visibilityInputSchema).default([]),
  })

export const documentStructureIdSchema = documentStructureSchema.pick({id: true})
