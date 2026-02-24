import {z} from 'zod/v4'

const dateSchema = z.preprocess(
  val => (val === '' || val === null || val === undefined ? null : new Date(val as string)),
  z.date().nullable(),
)

const requiredDateSchema = z.preprocess(
  val => (typeof val === 'string' || val instanceof Date ? new Date(val) : val),
  z.date(),
)

export const workOrderSchema = z.object({
  id: z.string(),
  workOrderNumber: z.string().max(100).nullable().optional(),
  description: z.string().nullable().optional(),
  aditionalInfo: z.string().nullable().optional(),
  startDate: requiredDateSchema,
  endDate: dateSchema.optional(),
  createdAt: requiredDateSchema,
  hoursMaterialClosed: z.boolean().default(false),
  invoiceSent: z.boolean().default(false),
  completed: z.boolean().default(false),
  createdBy: z.string(),
  projectId: z.string(),
  targetId: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: dateSchema.optional(),
  deletedBy: z.string().nullable().optional(),
})

export const createWorkOrderSchema = workOrderSchema.omit({
  id: true,
  createdAt: true,
  createdBy: true,
  targetId: true,
  deleted: true,
  deletedAt: true,
  deletedBy: true,
})

export const updateWorkOrderSchema = workOrderSchema.pick({
  id: true,
  workOrderNumber: true,
  description: true,
  aditionalInfo: true,
  startDate: true,
  endDate: true,
  projectId: true,
  hoursMaterialClosed: true,
  invoiceSent: true,
  completed: true,
})

export const workOrderIdSchema = workOrderSchema.pick({id: true})

// ─── Time Registry ────────────────────────────────────────────────────────────
export const createTimeRegistrySchema = z.object({
  activityDescription: z.string().nullable().optional(),
  aditionalInfo: z.string().nullable().optional(),
  invoiceInfo: z.string().nullable().optional(),
  workDate: requiredDateSchema,
  startTime: requiredDateSchema,
  endTime: dateSchema.optional(),
  startBreak: dateSchema.optional(),
  endBreak: dateSchema.optional(),
  invoiceTime: z.boolean().default(false),
  onSite: z.boolean().default(false),
  workOrderId: z.string(),
  hourtypeId: z.string(),
  // additional employees linked via TimeRegistryEmployee
  employeeIds: z.array(z.string()).default([]),
})

// ─── Work Order Structure ─────────────────────────────────────────────────────
export const createWorkOrderStructureSchema = z.object({
  clientNumber: z.string().max(100).nullable().optional(),
  tag: z.string().max(100).nullable().optional(),
  quantity: z.number().int().nullable().optional(),
  shortDesciption: z.string().max(100).nullable().optional(),
  longDescription: z.string().nullable().optional(),
  aditionalInfo: z.string().nullable().optional(),
  workOrderId: z.string(),
  materialId: z.string(),
})
