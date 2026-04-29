import 'server-only'
import {prismaClient} from '@/dal/prismaClient'
import type {Prisma} from '@/generated/prisma/client'
import type {
  HrAbsence,
  HrAbsenceType,
  HrCertificationTraining,
  HrCertificationTrainingEmployeeOption,
  HrRecurrenceInterval,
  HrTrainingType,
} from '@/types/hrCertificationTraining'

type HrCertificationTrainingWithEmployee = Prisma.HrCertificationTrainingGetPayload<{
  include: {
    Employee_HrCertificationTraining_employeeIdToEmployee: {
      select: {firstName: true; lastName: true}
    }
  }
}>

type HrAbsenceWithEmployee = Prisma.HrEmployeeAbsenceGetPayload<{
  include: {
    Employee_HrEmployeeAbsence_employeeIdToEmployee: {
      select: {firstName: true; lastName: true}
    }
  }
}>

export interface SaveHrCertificationTrainingInput {
  employeeId: string
  trainingName: string
  trainingType: HrTrainingType
  recurrenceInterval: HrRecurrenceInterval
  trainingDate: Date
  certificateValidUntil: Date | null
  providerName: string
  additionalInfo: string | null
  profileId: string
}

export interface SaveHrAbsenceInput {
  employeeId: string
  year: number
  absenceType: HrAbsenceType
  days: number
  additionalInfo: string | null
  profileId: string
}

function toIsoDate(value: Date | null) {
  return value?.toISOString() ?? null
}

function mapCertification(row: HrCertificationTrainingWithEmployee): HrCertificationTraining {
  const employee = row.Employee_HrCertificationTraining_employeeIdToEmployee

  return {
    id: row.id,
    employeeId: row.employeeId,
    employeeName: `${employee.firstName} ${employee.lastName}`.trim(),
    trainingName: row.trainingName,
    trainingType: row.trainingType as HrTrainingType,
    recurrenceInterval: row.recurrenceInterval as HrRecurrenceInterval,
    trainingDate: row.trainingDate.toISOString(),
    certificateValidUntil: toIsoDate(row.certificateValidUntil),
    providerName: row.providerName,
    additionalInfo: row.additionalInfo,
    createdAt: row.createdAt.toISOString(),
    updatedAt: toIsoDate(row.updatedAt),
  }
}

function mapAbsence(row: HrAbsenceWithEmployee): HrAbsence {
  const employee = row.Employee_HrEmployeeAbsence_employeeIdToEmployee

  return {
    id: row.id,
    employeeId: row.employeeId,
    employeeName: `${employee.firstName} ${employee.lastName}`.trim(),
    year: row.year,
    absenceType: row.absenceType as HrAbsenceType,
    days: Number(row.days),
    additionalInfo: row.additionalInfo,
    createdAt: row.createdAt.toISOString(),
    updatedAt: toIsoDate(row.updatedAt),
  }
}

export async function getHrCertificationTrainingEmployeeOptions(): Promise<HrCertificationTrainingEmployeeOption[]> {
  const employees = await prismaClient.employee.findMany({
    where: {deleted: false, active: true},
    select: {id: true, firstName: true, lastName: true},
    orderBy: [{lastName: 'asc'}, {firstName: 'asc'}],
  })

  return employees.map(employee => ({
    id: employee.id,
    name: `${employee.firstName} ${employee.lastName}`.trim(),
  }))
}

export async function getHrCertificationTrainings(): Promise<HrCertificationTraining[]> {
  const rows = await prismaClient.hrCertificationTraining.findMany({
    where: {deleted: false},
    include: {
      Employee_HrCertificationTraining_employeeIdToEmployee: {
        select: {firstName: true, lastName: true},
      },
    },
    orderBy: [{certificateValidUntil: {sort: 'asc', nulls: 'last'}}, {trainingDate: 'desc'}],
  })

  return rows.map(mapCertification)
}

export async function createHrCertificationTraining(data: SaveHrCertificationTrainingInput) {
  return prismaClient.hrCertificationTraining.create({
    data: {
      id: crypto.randomUUID(),
      trainingName: data.trainingName,
      trainingType: data.trainingType,
      recurrenceInterval: data.recurrenceInterval,
      trainingDate: data.trainingDate,
      certificateValidUntil: data.certificateValidUntil,
      providerName: data.providerName,
      additionalInfo: data.additionalInfo,
      createdAt: new Date(),
      Employee_HrCertificationTraining_employeeIdToEmployee: {connect: {id: data.employeeId}},
      Employee_HrCertificationTraining_createdByToEmployee: {connect: {id: data.profileId}},
    },
  })
}

export async function updateHrCertificationTraining(id: string, data: SaveHrCertificationTrainingInput) {
  return prismaClient.hrCertificationTraining.update({
    where: {id},
    data: {
      trainingName: data.trainingName,
      trainingType: data.trainingType,
      recurrenceInterval: data.recurrenceInterval,
      trainingDate: data.trainingDate,
      certificateValidUntil: data.certificateValidUntil,
      providerName: data.providerName,
      additionalInfo: data.additionalInfo,
      updatedAt: new Date(),
      Employee_HrCertificationTraining_employeeIdToEmployee: {connect: {id: data.employeeId}},
      Employee_HrCertificationTraining_updatedByToEmployee: {connect: {id: data.profileId}},
    },
  })
}

export async function softDeleteHrCertificationTraining(id: string, deletedBy: string) {
  return prismaClient.hrCertificationTraining.update({
    where: {id},
    data: {
      deleted: true,
      deletedAt: new Date(),
      Employee_HrCertificationTraining_deletedByToEmployee: {connect: {id: deletedBy}},
    },
  })
}

export async function getHrAbsences(): Promise<HrAbsence[]> {
  const rows = await prismaClient.hrEmployeeAbsence.findMany({
    where: {deleted: false},
    include: {
      Employee_HrEmployeeAbsence_employeeIdToEmployee: {
        select: {firstName: true, lastName: true},
      },
    },
    orderBy: [
      {year: 'desc'},
      {Employee_HrEmployeeAbsence_employeeIdToEmployee: {lastName: 'asc'}},
      {Employee_HrEmployeeAbsence_employeeIdToEmployee: {firstName: 'asc'}},
      {absenceType: 'asc'},
    ],
  })

  return rows.map(mapAbsence)
}

export async function createHrAbsence(data: SaveHrAbsenceInput) {
  return prismaClient.hrEmployeeAbsence.create({
    data: {
      id: crypto.randomUUID(),
      year: data.year,
      absenceType: data.absenceType,
      days: data.days,
      additionalInfo: data.additionalInfo,
      createdAt: new Date(),
      Employee_HrEmployeeAbsence_employeeIdToEmployee: {connect: {id: data.employeeId}},
      Employee_HrEmployeeAbsence_createdByToEmployee: {connect: {id: data.profileId}},
    },
  })
}

export async function updateHrAbsence(id: string, data: SaveHrAbsenceInput) {
  return prismaClient.hrEmployeeAbsence.update({
    where: {id},
    data: {
      year: data.year,
      absenceType: data.absenceType,
      days: data.days,
      additionalInfo: data.additionalInfo,
      updatedAt: new Date(),
      Employee_HrEmployeeAbsence_employeeIdToEmployee: {connect: {id: data.employeeId}},
      Employee_HrEmployeeAbsence_updatedByToEmployee: {connect: {id: data.profileId}},
    },
  })
}

export async function softDeleteHrAbsence(id: string, deletedBy: string) {
  return prismaClient.hrEmployeeAbsence.update({
    where: {id},
    data: {
      deleted: true,
      deletedAt: new Date(),
      Employee_HrEmployeeAbsence_deletedByToEmployee: {connect: {id: deletedBy}},
    },
  })
}
