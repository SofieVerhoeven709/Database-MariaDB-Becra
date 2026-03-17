import {z} from 'zod/v4'

// FormData sends booleans as strings; "false" must map to false, not true.
const booleanFromString = z.preprocess(
  val =>
    val === 'false' || val === false || val === 0
      ? false
      : val === 'true' || val === true || val === 1
        ? true
        : undefined,
  z.boolean().nullable().optional(),
)

const beNumberSchema = z.string().trim().min(1).max(255)
const brandOrderNrSchema = z.string().trim().min(1).max(255)
const supplierCompanyIdsSchema = z.preprocess(
  val => {
    if (Array.isArray(val)) return val
    if (val == null || val === '') return []
    return [val]
  },
  z.array(z.string().uuid()).default([]),
)

export const materialSchema = z.object({
  id: z.string().uuid(),
  beNumber: beNumberSchema,
  name: z.string().max(255).nullable().optional(),
  brandOrderNr: brandOrderNrSchema,
  shortDescription: z.string().min(1).max(255),
  longDescription: z.string().nullable().optional(),
  preferredSupplierCompanyId: z.string().uuid().nullable().optional(),
  supplierCompanyIds: supplierCompanyIdsSchema,
  brandName: z.string().max(255).nullable().optional(),
  documentationPlace: z.string().max(255).nullable().optional(),
  bePartDoc: z.coerce.number().int().nullable().optional(),
  rejected: booleanFromString,
  materialGroupId: z.string().uuid(),
  unitId: z.string().uuid(),
})

export const createMaterialSchema = materialSchema.extend({
  // Empty BE number is allowed on create; server action then generates one.
  beNumber: z.preprocess(
    val => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    beNumberSchema.optional(),
  ),
})

export const updateMaterialSchema = materialSchema.partial().extend({
  id: z.string().uuid(),
})

export const deleteMaterialSchema = z.object({
  id: z.string().uuid(),
})
