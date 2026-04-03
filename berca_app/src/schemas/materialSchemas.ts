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

const beNumberSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .regex(/^(1\d{6}|4\d{6})$/, 'Nummer moet in de 1000000-reeks (BE) of 4000000-reeks (IOS) liggen')

const brandOrderNrSchema = z.preprocess(
  val => (val === '' || val == null ? null : val),
  z.string().trim().max(255).nullable().optional(),
)

const supplierCompanyIdsSchema = z.preprocess(val => {
  if (Array.isArray(val)) return val
  if (val == null || val === '') return []
  return [val]
}, z.array(z.string().uuid()).default([]))

const parentBeNumbersSchema = z.preprocess(
  val => {
    if (Array.isArray(val)) return val
    if (val == null || val === '') return []
    return [val]
  },
  z.array(z.string().trim().regex(/^\d+$/, 'Parent BE number can only contains numbers')).default([]),
)

const nullableUuidSchema = z.preprocess(
  val => (val === '' || val == null ? null : val),
  z.string().uuid().nullable().optional(),
)

const preferredSupplierOrderIdSchema = z.preprocess(
  val => (val === '' || val == null ? null : val),
  z.string().trim().max(255).nullable().optional(),
)

const preferredSupplierShortDescriptionSchema = z.preprocess(
  val => (val === '' || val == null ? null : val),
  z.string().trim().max(255).nullable().optional(),
)

const leadTimeValueSchema = z.preprocess(
  val => (val === '' || val == null ? null : Number(val)),
  z.number().int().min(1).nullable().optional(),
)

const leadTimeUnitSchema = z.preprocess(
  val => (val === '' || val == null ? null : val),
  z.enum(['days', 'weeks']).nullable().optional(),
)

const materialSchemaBase = z.object({
  id: z.string().uuid(),
  beNumber: z.preprocess(
    val => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    beNumberSchema.optional(),
  ),
  name: z.string().max(255).nullable().optional(),
  brandOrderNr: brandOrderNrSchema,
  shortDescription: z.string().min(1).max(255),
  longDescription: z.string().nullable().optional(),
  preferredSupplierCompanyId: nullableUuidSchema,
  preferredSupplierOrderId: preferredSupplierOrderIdSchema,
  preferredSupplierShortDescription: preferredSupplierShortDescriptionSchema,
  supplierCompanyIds: supplierCompanyIdsSchema,
  parentBeNumbers: parentBeNumbersSchema,
  brandName: z.string().max(255).nullable().optional(),
  warehousePlace: nullableUuidSchema,
  rejected: booleanFromString,
  longLeadTime: z
    .preprocess(val => {
      if (val === undefined) return false
      if (val === 'false' || val === false || val === 0) return false
      if (val === 'true' || val === true || val === 1) return true
      return val
    }, z.boolean())
    .default(false),
  leadTimeValue: leadTimeValueSchema,
  leadTimeUnit: leadTimeUnitSchema,
  materialGroupIdA: z.string().uuid(),
  materialGroupIdB: nullableUuidSchema,
  materialGroupIdC: nullableUuidSchema,
  materialGroupIdD: nullableUuidSchema,
  unitId: z.string().uuid(),
  isSerialTracked: z
    .preprocess(val => {
      if (val === undefined) return false
      if (val === 'false' || val === false || val === 0) return false
      if (val === 'true' || val === true || val === 1) return true
      return val
    }, z.boolean())
    .default(false),
  isParentPart: z
    .preprocess(val => {
      if (val === undefined) return false
      if (val === 'false' || val === false || val === 0) return false
      if (val === 'true' || val === true || val === 1) return true
      return val
    }, z.boolean())
    .default(false),
})

function withLongLeadTimeValidation<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((data: any, ctx) => {
  if (!data.longLeadTime) return

  if (data.leadTimeValue == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['leadTimeValue'],
      message: 'Lead time value is required when long lead time is enabled.',
    })
  }

  if (data.leadTimeUnit == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['leadTimeUnit'],
      message: 'Lead time unit is required when long lead time is enabled.',
    })
  }
  })
}

export const materialSchema = withLongLeadTimeValidation(materialSchemaBase)

export const createMaterialSchema = withLongLeadTimeValidation(materialSchemaBase)

export const updateMaterialSchema = withLongLeadTimeValidation(materialSchemaBase.partial().required({id: true}))
export const deleteMaterialSchema = z.object({
  id: z.string().uuid(),
})
