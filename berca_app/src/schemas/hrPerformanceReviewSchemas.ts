import {z} from 'zod/v4'

const scheduleTypeSchema = z.enum(['fixed', 'variable'])

export const updateHrPerformanceSettingsSchema = z.object({
  departmentId: z.string().min(1),
  employeeId: z.string().min(1),
  weeklyWorkHours: z.coerce.number().min(0).max(80),
  workScheduleType: scheduleTypeSchema,
  overtimeTrackingEnabled: z.boolean(),
  maxOvertimeHours: z.coerce.number().min(0).max(99999).nullable(),
})

export const createHrEmployeeOvertimeSchema = z.object({
  departmentId: z.string().min(1),
  employeeId: z.string().min(1),
  projectId: z.string().min(1),
  sourceTimeRegistryId: z.string().min(1),
  overtimeDate: z.coerce.date(),
  hours: z.coerce.number().positive().max(99999),
  description: z.string().trim().max(5000).nullable(),
})

export const updateHrEmployeeOvertimeSchema = createHrEmployeeOvertimeSchema.extend({
  id: z.string().min(1),
})

export const deleteHrEmployeeOvertimeSchema = z.object({
  id: z.string().min(1),
  departmentId: z.string().min(1),
})
