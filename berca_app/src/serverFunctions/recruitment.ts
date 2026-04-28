'use server'

import {revalidatePath} from 'next/cache'
import {
  createRecruitmentApplicant,
  createRecruitmentVacancy,
  softDeleteRecruitmentApplicant,
  softDeleteRecruitmentVacancy,
  updateRecruitmentApplicant,
  updateRecruitmentVacancy,
} from '@/dal/recruitment'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {
  createRecruitmentApplicantSchema,
  createRecruitmentVacancySchema,
  recruitmentIdSchema,
  updateRecruitmentApplicantSchema,
  updateRecruitmentVacancySchema,
} from '@/schemas/recruitmentSchemas'

function revalidateRecruitment(departmentId: string) {
  revalidatePath(`/departments/${departmentId}/recruitment`)
}

export const createRecruitmentApplicantAction = protectedServerFunction({
  schema: createRecruitmentApplicantSchema,
  functionName: 'Create recruitment applicant',
  serverFn: async ({data, profile, logger}) => {
    const {departmentId, ...applicantData} = data

    await createRecruitmentApplicant({
      ...applicantData,
      profileId: profile.id,
    })

    logger.info(`Recruitment applicant created: ${data.candidateName}`)
    revalidateRecruitment(departmentId)
  },
})

export const updateRecruitmentApplicantAction = protectedServerFunction({
  schema: updateRecruitmentApplicantSchema,
  functionName: 'Update recruitment applicant',
  serverFn: async ({data, logger}) => {
    const {id, departmentId, ...applicantData} = data

    await updateRecruitmentApplicant(id, applicantData)

    logger.info(`Recruitment applicant updated: ${id}`)
    revalidateRecruitment(departmentId)
  },
})

export const deleteRecruitmentApplicantAction = protectedServerFunction({
  schema: recruitmentIdSchema,
  functionName: 'Delete recruitment applicant',
  serverFn: async ({data, profile, logger}) => {
    await softDeleteRecruitmentApplicant(data.id, profile.id)

    logger.info(`Recruitment applicant deleted: ${data.id}`)
    revalidateRecruitment(data.departmentId)
  },
})

export const createRecruitmentVacancyAction = protectedServerFunction({
  schema: createRecruitmentVacancySchema,
  functionName: 'Create recruitment vacancy',
  serverFn: async ({data, profile, logger}) => {
    const {departmentId, ...vacancyData} = data

    await createRecruitmentVacancy({
      ...vacancyData,
      profileId: profile.id,
    })

    logger.info(`Recruitment vacancy created: ${data.title}`)
    revalidateRecruitment(departmentId)
  },
})

export const updateRecruitmentVacancyAction = protectedServerFunction({
  schema: updateRecruitmentVacancySchema,
  functionName: 'Update recruitment vacancy',
  serverFn: async ({data, logger}) => {
    const {id, departmentId, ...vacancyData} = data

    await updateRecruitmentVacancy(id, vacancyData)

    logger.info(`Recruitment vacancy updated: ${id}`)
    revalidateRecruitment(departmentId)
  },
})

export const deleteRecruitmentVacancyAction = protectedServerFunction({
  schema: recruitmentIdSchema,
  functionName: 'Delete recruitment vacancy',
  serverFn: async ({data, profile, logger}) => {
    await softDeleteRecruitmentVacancy(data.id, profile.id)

    logger.info(`Recruitment vacancy deleted: ${data.id}`)
    revalidateRecruitment(data.departmentId)
  },
})
