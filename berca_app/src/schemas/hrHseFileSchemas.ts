import {z} from 'zod/v4'

export const updateHrHseIncludeFieldSchema = z.object({
  departmentId: z.string().min(1),
  employeeId: z.string().min(1),
  field: z.enum([
    'includeEmployeeData',
    'includePartnerData',
    'includeEmergencyContact',
    'includeEmployerData',
    'includeMedicalExamination',
    'includeTrainingData',
  ]),
  value: z.boolean(),
})
