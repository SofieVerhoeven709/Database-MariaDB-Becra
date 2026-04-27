import {z} from 'zod/v4'

const statusSchema = z.enum(['planned', 'completed', 'cancelled'])

export const hrEvaluationMeetingIdSchema = z.object({
  id: z.string().min(1),
  departmentId: z.string().min(1),
})

export const createHrEvaluationMeetingSchema = z.object({
  departmentId: z.string().min(1),
  employeeId: z.string().min(1),
  conversationType: z.string().trim().min(1).max(100),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  place: z.string().trim().max(255).nullable(),
  status: statusSchema,
  notes: z.string().trim().nullable(),
})

export const updateHrEvaluationMeetingSchema = createHrEvaluationMeetingSchema.extend({
  id: z.string().min(1),
  completedAt: z.coerce.date().nullable(),
})
