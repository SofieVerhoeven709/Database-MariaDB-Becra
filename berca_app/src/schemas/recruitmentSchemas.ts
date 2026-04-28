import {z} from 'zod/v4'

const optionalText = (max?: number) => {
  const base = max ? z.string().trim().max(max) : z.string().trim()
  return base.transform(value => (value === '' ? null : value)).nullable()
}

const contactTypeSchema = z.enum(['email', 'phone'])
const contractTypeSchema = z.enum(['permanent', 'temporary'])
const workRegimeSchema = z.enum(['fulltime', 'parttime'])

const salarySchema = z
  .union([z.coerce.number().min(0), z.literal(''), z.null(), z.undefined()])
  .transform(value => (value === '' || value == null ? null : value))

export const recruitmentIdSchema = z.object({
  id: z.string().min(1),
  departmentId: z.string().min(1),
})

export const createRecruitmentApplicantSchema = z.object({
  departmentId: z.string().min(1),
  candidateName: z.string().trim().min(1).max(255),
  profile: optionalText(),
  contactDate: z.coerce.date().nullable(),
  interviewDate: z.coerce.date().nullable(),
  contactType: contactTypeSchema,
  description: optionalText(),
  cvPath: optionalText(500),
  potential: z.coerce.boolean(),
  retained: z.coerce.boolean(),
})

export const updateRecruitmentApplicantSchema = createRecruitmentApplicantSchema.extend({
  id: z.string().min(1),
})

export const createRecruitmentVacancySchema = z
  .object({
    departmentId: z.string().min(1),
    title: z.string().trim().min(1).max(255),
    description: optionalText(),
    department: z.string().trim().min(1).max(100),
    contractType: contractTypeSchema,
    workRegime: workRegimeSchema,
    salaryMin: salarySchema,
    salaryMax: salarySchema,
    publishWebsite: z.coerce.boolean(),
    publishVdab: z.coerce.boolean(),
    publishOther: z.coerce.boolean(),
    publishLinkedIn: z.coerce.boolean(),
    publishTempAgencies: z.coerce.boolean(),
    publishRecruitmentAgencies: z.coerce.boolean(),
    otherPublication: optionalText(255),
  })
  .refine(data => data.salaryMin == null || data.salaryMax == null || data.salaryMax >= data.salaryMin, {
    message: 'Maximum salary must be greater than or equal to minimum salary',
    path: ['salaryMax'],
  })

export const updateRecruitmentVacancySchema = createRecruitmentVacancySchema.extend({
  id: z.string().min(1),
})
