import 'server-only'
import {prismaClient} from '@/dal/prismaClient'
import type {Prisma} from '@/generated/prisma/client'
import type {
  RecruitmentApplicant,
  RecruitmentContactType,
  RecruitmentContractType,
  RecruitmentVacancy,
  RecruitmentWorkRegime,
} from '@/types/recruitment'

type RecruitmentApplicantWithRelations = Prisma.RecruitmentApplicantGetPayload<{
  include: {
    Employee_RecruitmentApplicant_createdByToEmployee: {
      select: {id: true; firstName: true; lastName: true}
    }
  }
}>

type RecruitmentVacancyWithRelations = Prisma.RecruitmentVacancyGetPayload<{
  include: {
    Employee_RecruitmentVacancy_createdByToEmployee: {
      select: {id: true; firstName: true; lastName: true}
    }
  }
}>

export interface SaveRecruitmentApplicantInput {
  candidateName: string
  profile: string | null
  contactDate: Date | null
  interviewDate: Date | null
  contactType: RecruitmentContactType
  description: string | null
  cvPath: string | null
  potential: boolean
  retained: boolean
  profileId: string
}

export interface SaveRecruitmentVacancyInput {
  title: string
  description: string | null
  department: string
  contractType: RecruitmentContractType
  workRegime: RecruitmentWorkRegime
  salaryMin: number | null
  salaryMax: number | null
  publishWebsite: boolean
  publishVdab: boolean
  publishOther: boolean
  publishLinkedIn: boolean
  publishTempAgencies: boolean
  publishRecruitmentAgencies: boolean
  otherPublication: string | null
  profileId: string
}

const applicantInclude = {
  Employee_RecruitmentApplicant_createdByToEmployee: {
    select: {id: true, firstName: true, lastName: true},
  },
} satisfies Prisma.RecruitmentApplicantInclude

const vacancyInclude = {
  Employee_RecruitmentVacancy_createdByToEmployee: {
    select: {id: true, firstName: true, lastName: true},
  },
} satisfies Prisma.RecruitmentVacancyInclude

function employeeName(employee: {firstName: string; lastName: string} | null) {
  return employee ? `${employee.firstName} ${employee.lastName}`.trim() : null
}

function mapApplicant(applicant: RecruitmentApplicantWithRelations): RecruitmentApplicant {
  return {
    id: applicant.id,
    candidateName: applicant.candidateName ?? '',
    profile: applicant.profile,
    contactDate: applicant.contactDate?.toISOString() ?? null,
    interviewDate: applicant.interviewDate?.toISOString() ?? null,
    contactType: (applicant.contactType ?? 'email') as RecruitmentContactType,
    description: applicant.description,
    cvPath: applicant.cvPath,
    potential: applicant.potential ?? false,
    retained: applicant.retained ?? false,
    createdAt: applicant.createdAt.toISOString(),
    createdBy: applicant.createdBy ?? '',
    createdByName: employeeName(applicant.Employee_RecruitmentApplicant_createdByToEmployee),
    updatedAt: applicant.updatedAt?.toISOString() ?? null,
    deleted: applicant.deleted ?? false,
  }
}

function mapVacancy(vacancy: RecruitmentVacancyWithRelations): RecruitmentVacancy {
  return {
    id: vacancy.id,
    title: vacancy.title ?? '',
    description: vacancy.description,
    department: vacancy.department ?? '',
    contractType: (vacancy.contractType ?? 'permanent') as RecruitmentContractType,
    workRegime: (vacancy.workRegime ?? 'fulltime') as RecruitmentWorkRegime,
    salaryMin: vacancy.salaryMin?.toNumber() ?? null,
    salaryMax: vacancy.salaryMax?.toNumber() ?? null,
    publishWebsite: vacancy.publishWebsite ?? false,
    publishVdab: vacancy.publishVdab ?? false,
    publishOther: vacancy.publishOther ?? false,
    publishLinkedIn: vacancy.publishLinkedIn ?? false,
    publishTempAgencies: vacancy.publishTempAgencies ?? false,
    publishRecruitmentAgencies: vacancy.publishRecruitmentAgencies ?? false,
    otherPublication: vacancy.otherPublication,
    createdAt: vacancy.createdAt.toISOString(),
    createdBy: vacancy.createdBy ?? '',
    createdByName: employeeName(vacancy.Employee_RecruitmentVacancy_createdByToEmployee),
    updatedAt: vacancy.updatedAt?.toISOString() ?? null,
    deleted: vacancy.deleted ?? false,
  }
}

export async function getRecruitmentApplicants(options?: {includeDeleted?: boolean}): Promise<RecruitmentApplicant[]> {
  const applicants = await prismaClient.recruitmentApplicant.findMany({
    where: options?.includeDeleted ? undefined : {deleted: false},
    include: applicantInclude,
    orderBy: [{interviewDate: 'desc'}, {contactDate: 'desc'}, {createdAt: 'desc'}],
  })

  return applicants.map(mapApplicant)
}

export async function getRecruitmentVacancies(options?: {includeDeleted?: boolean}): Promise<RecruitmentVacancy[]> {
  const vacancies = await prismaClient.recruitmentVacancy.findMany({
    where: options?.includeDeleted ? undefined : {deleted: false},
    include: vacancyInclude,
    orderBy: [{createdAt: 'desc'}],
  })

  return vacancies.map(mapVacancy)
}

export async function createRecruitmentApplicant(data: SaveRecruitmentApplicantInput) {
  return prismaClient.recruitmentApplicant.create({
    data: {
      id: crypto.randomUUID(),
      candidateName: data.candidateName,
      profile: data.profile,
      contactDate: data.contactDate,
      interviewDate: data.interviewDate,
      contactType: data.contactType,
      description: data.description,
      cvPath: data.cvPath,
      potential: data.potential,
      retained: data.retained,
      createdAt: new Date(),
      Employee_RecruitmentApplicant_createdByToEmployee: {connect: {id: data.profileId}},
    },
  })
}

export async function updateRecruitmentApplicant(id: string, data: Omit<SaveRecruitmentApplicantInput, 'profileId'>) {
  return prismaClient.recruitmentApplicant.update({
    where: {id},
    data: {
      candidateName: data.candidateName,
      profile: data.profile,
      contactDate: data.contactDate,
      interviewDate: data.interviewDate,
      contactType: data.contactType,
      description: data.description,
      cvPath: data.cvPath,
      potential: data.potential,
      retained: data.retained,
      updatedAt: new Date(),
    },
  })
}

export async function softDeleteRecruitmentApplicant(id: string, deletedBy: string) {
  return prismaClient.recruitmentApplicant.update({
    where: {id},
    data: {
      deleted: true,
      deletedAt: new Date(),
      Employee_RecruitmentApplicant_deletedByToEmployee: {connect: {id: deletedBy}},
    },
  })
}

export async function createRecruitmentVacancy(data: SaveRecruitmentVacancyInput) {
  return prismaClient.recruitmentVacancy.create({
    data: {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      department: data.department,
      contractType: data.contractType,
      workRegime: data.workRegime,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      publishWebsite: data.publishWebsite,
      publishVdab: data.publishVdab,
      publishOther: data.publishOther,
      publishLinkedIn: data.publishLinkedIn,
      publishTempAgencies: data.publishTempAgencies,
      publishRecruitmentAgencies: data.publishRecruitmentAgencies,
      otherPublication: data.otherPublication,
      createdAt: new Date(),
      Employee_RecruitmentVacancy_createdByToEmployee: {connect: {id: data.profileId}},
    },
  })
}

export async function updateRecruitmentVacancy(id: string, data: Omit<SaveRecruitmentVacancyInput, 'profileId'>) {
  return prismaClient.recruitmentVacancy.update({
    where: {id},
    data: {
      title: data.title,
      description: data.description,
      department: data.department,
      contractType: data.contractType,
      workRegime: data.workRegime,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      publishWebsite: data.publishWebsite,
      publishVdab: data.publishVdab,
      publishOther: data.publishOther,
      publishLinkedIn: data.publishLinkedIn,
      publishTempAgencies: data.publishTempAgencies,
      publishRecruitmentAgencies: data.publishRecruitmentAgencies,
      otherPublication: data.otherPublication,
      updatedAt: new Date(),
    },
  })
}

export async function softDeleteRecruitmentVacancy(id: string, deletedBy: string) {
  return prismaClient.recruitmentVacancy.update({
    where: {id},
    data: {
      deleted: true,
      deletedAt: new Date(),
      Employee_RecruitmentVacancy_deletedByToEmployee: {connect: {id: deletedBy}},
    },
  })
}
