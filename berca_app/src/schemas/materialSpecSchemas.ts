import {z} from 'zod/v4'

// FormData sends booleans as strings; "false" must map to false, not true.
const booleanFromString = z.preprocess(
  val => (val === 'false' || val === false || val === 0 ? false : Boolean(val)),
  z.boolean(),
)

// ─── MaterialGroup ───────────────────────────────────────────────────────────

export const materialGroupSchema = z.object({
  id: z.string().uuid(),
  groupA: z.string().min(1).max(255),
  groupB: z.string().max(255).nullable().optional(),
  groupC: z.string().max(255).nullable().optional(),
  groupD: z.string().max(255).nullable().optional(),
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
  shortDescription: z.string().max(255).nullable().optional(),
  longDescription: z.string().nullable().optional(),
  valid: booleanFromString,
})

export const deleteUnitSchema = z.object({
  id: z.string().uuid(),
})
