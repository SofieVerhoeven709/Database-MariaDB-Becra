import {z} from 'zod/v4'

const booleanFromString = z.preprocess(
  val =>
    val === 'false' || val === false || val === 0
      ? false
      : val === 'true' || val === true || val === 1
        ? true
        : undefined,
  z.boolean().nullable().optional(),
)

const nullableString255Schema = z.preprocess(
  val => (val === '' || val == null ? null : val),
  z.string().trim().max(255).nullable().optional(),
)

const nullableTextSchema = z.preprocess(
  val => (val === '' || val == null ? null : val),
  z.string().trim().nullable().optional(),
)

const nullableUuidSchema = z.preprocess(
  val => (val === '' || val == null ? null : val),
  z.string().uuid().nullable().optional(),
)

const beNumberSchema = z.preprocess(
  val => (val === '' || val == null ? null : val),
  z.string().trim().min(1).max(255).regex(/^\d+$/, 'BE number can only contain digits').nullable().optional(),
)

export const materialSerialTrackedSchema = z.object({
  id: z.string().uuid(),

  materialId: nullableUuidSchema, // New: link to Material
  beNumber: beNumberSchema.optional(), // Now optional, for display only
  brandName: nullableString255Schema,
  management: nullableString255Schema,
  brandOrderNumber: nullableString255Schema,
  companyId: nullableUuidSchema,
  orderNumber: nullableString255Schema,
  shortDescription: nullableString255Schema,
  longDescription: nullableTextSchema,
  transactionType: nullableString255Schema,
  materialGroupId: nullableUuidSchema,
  fromLocation: nullableString255Schema,
  toLocation: nullableString255Schema,
  preferredSupplier: nullableString255Schema,
  rejected: booleanFromString,
  additionalInfo: nullableString255Schema,
  projectId: nullableUuidSchema,
  becraCode: nullableString255Schema,
  createdBy: nullableUuidSchema,
})

export const createMaterialSerialTrackedSchema = materialSerialTrackedSchema.extend({
  id: z.string().uuid().optional(),
  createdBy: z.string().uuid().optional(),
  beNumber: z.preprocess(
    val => (typeof val === 'string' && val.trim() === '' ? null : val),
    z.string().trim().max(255).regex(/^\d+$/, 'BE number can only contain digits').nullable().optional(),
  ),
})

export const updateMaterialSerialTrackedSchema = materialSerialTrackedSchema.partial().extend({
  id: z.string().uuid(),
})

export const deleteMaterialSerialTrackedSchema = z.object({
  id: z.string().uuid(),
})
