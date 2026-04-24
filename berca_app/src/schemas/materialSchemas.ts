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
  .regex(/^\d{7}$/, {
    message: 'Nummer moet uit exact 7 cijfers bestaan',
  })

const brandOrderNrSchema = z.preprocess(
  val => (val === '' || val == null ? null : val),
  z.string().trim().max(255).nullable().optional(),
)

const parentBeNumbersSchema = z.preprocess(
  val => {
    if (Array.isArray(val)) return val
    if (val == null || val === '') return []
    return [val]
  },
  z.array(z.string().trim().regex(/^\d+$/, 'Parent BE number can only contain numbers')).default([]),
)

const nullableUuidSchema = z.preprocess(
  val => (val === '' || val == null ? null : val),
  z.string().uuid().nullable().optional(),
)

const leadTimeValueSchema = z.preprocess(
  val => (val === '' || val == null ? null : Number(val)),
  z.number().int().min(1).nullable().optional(),
)

const leadTimeUnitSchema = z.preprocess(
  val => (val === '' || val == null ? null : val),
  z.enum(['days', 'weeks', 'months']).nullable().optional(),
)

const documentFlagSchema = z
  .preprocess(val => {
    if (val === undefined) return false
    if (val === 'false' || val === false || val === 0) return false
    if (val === 'true' || val === true || val === 1) return true
    return val
  }, z.boolean())
  .default(false)

const materialSchemaBase = z.object({
  id: z.string().uuid(),
  numberType: z.enum(['BE', 'IOS']).default('BE'),
  beNumber: z.preprocess(
    val => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    beNumberSchema.optional(),
  ),
  name: z.string().max(255).nullable().optional(),
  brandOrderNr: brandOrderNrSchema,
  shortDescription: z.string().min(1).max(255),
  longDescription: z.string().nullable().optional(),
  supplierCompanyId: nullableUuidSchema,
  parentBeNumbers: parentBeNumbersSchema,
  brandName: z.string().max(255).nullable().optional(),
  warehousePlace: nullableUuidSchema,
  rejected: booleanFromString,
  partApproved: z
    .preprocess(val => {
      if (val === undefined) return false
      if (val === 'false' || val === false || val === 0) return false
      if (val === 'true' || val === true || val === 1) return true
      return val
    }, z.boolean())
    .default(false),
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
  hasAtex: documentFlagSchema,
  hasCe: documentFlagSchema,
  hasRohs: documentFlagSchema,
  hasDs: documentFlagSchema,
  hasDoc: documentFlagSchema,
  has3dCad: documentFlagSchema,
  has2dCad: documentFlagSchema,
  hasBdoc: documentFlagSchema,
  hasInsp: documentFlagSchema,
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

export const createMaterialSchema = withLongLeadTimeValidation(materialSchemaBase).superRefine((data, ctx) => {
  const value = data.beNumber?.trim()

  if (!value) return

  if (data.numberType === 'BE' && !/^1\d{6}$/.test(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['beNumber'],
      message: 'BE number has to be in the 1000000 range.',
    })
  }

  if (data.numberType === 'IOS' && !/^4\d{6}$/.test(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['beNumber'],
      message: 'IOS number has to be in the 4000000 range.',
    })
  }
})

export const updateMaterialSchema = withLongLeadTimeValidation(
  materialSchemaBase.partial().required({id: true}),
).superRefine((data, ctx) => {
  const value = data.beNumber?.trim()

  if (!value || !data.numberType) return

  if (data.numberType === 'BE' && !/^1\d{6}$/.test(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['beNumber'],
      message: 'BE number has to be in the 1000000 range.',
    })
  }

  if (data.numberType === 'IOS' && !/^4\d{6}$/.test(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['beNumber'],
      message: 'IOS number has to be in the 4000000 range.',
    })
  }
})

export const deleteMaterialSchema = z.object({
  id: z.string().uuid(),
})
