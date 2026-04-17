import {z} from 'zod/v4'

// FormData sends booleans as strings; "false" must map to false, not true.
const booleanFromString = z.preprocess(
  val => (val === 'false' || val === false || val === 0 ? false : Boolean(val)),
  z.boolean(),
)

const nullableText = z.preprocess(val => (val === '' ? null : val), z.string().max(255).nullable().optional())

const nullableNumber = z.preprocess(val => {
  if (val === '' || val === null || val === undefined) return null
  const parsed = Number(val)
  return Number.isFinite(parsed) ? parsed : val
}, z.number().min(0, 'Quantity value must be 0 or greater').nullable().optional())

// ─── MaterialGroup ───────────────────────────────────────────────────────────

export const materialGroupSchema = z.object({
  id: z.string().uuid(),
  groupA: z.string().min(1).max(255),
  groupB: nullableText,
  groupC: nullableText,
  groupD: nullableText,
})

export const deleteMaterialGroupSchema = z.object({
  id: z.string().uuid(),
})

// ─── Unit ────────────────────────────────────────────────────────────────────

export const unitSchema = z.object({
  id: z.string().uuid(),
  unitName: z.string().min(1).max(255),
  physicalQuantity: z.string().min(1).max(255),
  abbreviation: z.string().min(1).max(255),
  quantityValue: nullableNumber,
  shortDescription: z.string().max(255).nullable().optional(),
  longDescription: z.string().nullable().optional(),
  valid: booleanFromString,
})

export const deleteUnitSchema = z.object({
  id: z.string().uuid(),
})

// ─── Performance Specs ───────────────────────────────────────────────────────

export const performanceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  materialSpecId: z.string().uuid().nullable().optional(),
  materialFamilyId: z.string().uuid().nullable().optional(),
  shortDescription: z.string().max(255).nullable().optional(),
  longDescription: z.string().nullable().optional(),
})

export const deletePerformanceSchema = z.object({
  id: z.string().uuid(),
})
