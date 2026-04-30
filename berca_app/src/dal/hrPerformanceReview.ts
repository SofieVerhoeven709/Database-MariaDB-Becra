import 'server-only'
import {prismaClient} from '@/dal/prismaClient'
import type {HrEvaluationMeeting} from '@/types/hrEvaluationMeeting'
import type {
  HrPerformanceProjectOption,
  HrPerformanceReviewRow,
  HrPerformanceTimeRegistryOption,
} from '@/types/hrPerformanceReview'

function decimalToNumber(value: {toString(): string} | null | undefined) {
  if (!value) return 0
  return Number(value.toString())
}

function formatHours(value: number) {
  return value.toFixed(2)
}

export async function getHrPerformanceReviewRows(meetings: HrEvaluationMeeting[]): Promise<HrPerformanceReviewRow[]> {
  const employees = await prismaClient.employee.findMany({
    where: {deleted: false},
    orderBy: [{lastName: 'asc'}, {firstName: 'asc'}],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      mail: true,
      weeklyWorkHours: true,
      workScheduleType: true,
      overtimeTrackingEnabled: true,
      maxOvertimeHours: true,
      HrEmployeeOvertime_HrEmployeeOvertime_employeeIdToEmployee: {
        where: {deleted: false},
        orderBy: {overtimeDate: 'desc'},
        select: {
          id: true,
          projectId: true,
          sourceTimeRegistryId: true,
          overtimeDate: true,
          hours: true,
          description: true,
          Project: {
            select: {
              projectNumber: true,
              projectName: true,
            },
          },
        },
      },
    },
  })

  const now = new Date()

  return employees.map(employee => {
    const employeeMeetings = meetings.filter(meeting => meeting.employeeId === employee.id)
    const latestCompletedReview = employeeMeetings
      .filter(meeting => meeting.status === 'completed')
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())[0]
    const nextPlannedReview = employeeMeetings
      .filter(meeting => meeting.status === 'planned' && new Date(meeting.startAt) >= now)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0]
    const overtimeHours = employee.HrEmployeeOvertime_HrEmployeeOvertime_employeeIdToEmployee.reduce(
      (total, overtime) => total + decimalToNumber(overtime.hours),
      0,
    )
    const maxOvertimeHours = employee.maxOvertimeHours ? decimalToNumber(employee.maxOvertimeHours) : null
    const overtimeRemainingHours = maxOvertimeHours === null ? null : Math.max(maxOvertimeHours - overtimeHours, 0)

    return {
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`.trim(),
      mail: employee.mail,
      weeklyWorkHours: employee.weeklyWorkHours.toString(),
      workScheduleType: employee.workScheduleType,
      overtimeTrackingEnabled: employee.overtimeTrackingEnabled,
      maxOvertimeHours: maxOvertimeHours === null ? null : formatHours(maxOvertimeHours),
      overtimeHours: formatHours(overtimeHours),
      overtimeRemainingHours: overtimeRemainingHours === null ? null : formatHours(overtimeRemainingHours),
      latestCompletedReviewAt: latestCompletedReview?.startAt ?? null,
      nextPlannedReviewAt: nextPlannedReview?.startAt ?? null,
      overtimeEntries: employee.HrEmployeeOvertime_HrEmployeeOvertime_employeeIdToEmployee.map(overtime => ({
        id: overtime.id,
        projectId: overtime.projectId,
        sourceTimeRegistryId: overtime.sourceTimeRegistryId,
        projectName: [overtime.Project.projectNumber, overtime.Project.projectName].filter(Boolean).join(' - '),
        overtimeDate: overtime.overtimeDate.toISOString(),
        hours: overtime.hours.toString(),
        description: overtime.description,
      })),
    }
  })
}

export async function getHrPerformanceProjectOptions(): Promise<HrPerformanceProjectOption[]> {
  const projects = await prismaClient.project.findMany({
    where: {deleted: false, isClosed: false},
    orderBy: [{projectNumber: 'asc'}, {projectName: 'asc'}],
    select: {
      id: true,
      projectNumber: true,
      projectName: true,
    },
  })

  return projects.map(project => ({
    id: project.id,
    name: [project.projectNumber, project.projectName].filter(Boolean).join(' - '),
  }))
}

export async function getHrPerformanceTimeRegistryOptions(): Promise<HrPerformanceTimeRegistryOption[]> {
  const rows = await prismaClient.timeRegistry.findMany({
    where: {
      deleted: false,
      onSite: true,
      WorkOrder: {
        deleted: false,
        Project: {
          deleted: false,
          isClosed: false,
        },
      },
    },
    orderBy: {workDate: 'desc'},
    select: {
      id: true,
      workDate: true,
      createdBy: true,
      startTime: true,
      endTime: true,
      WorkOrder: {
        select: {
          workOrderNumber: true,
          projectId: true,
          Project: {
            select: {
              projectNumber: true,
              projectName: true,
            },
          },
        },
      },
      TimeRegistryEmployee: {
        select: {
          employeeId: true,
        },
      },
    },
  })

  return rows.map(row => {
    const projectName = [row.WorkOrder.Project.projectNumber, row.WorkOrder.Project.projectName]
      .filter(Boolean)
      .join(' - ')
    const employeeIds = [...new Set([row.createdBy, ...row.TimeRegistryEmployee.map(employee => employee.employeeId)])]

    return {
      id: row.id,
      employeeIds,
      projectId: row.WorkOrder.projectId,
      projectName,
      workDate: row.workDate.toISOString(),
      label: `${row.workDate.toLocaleDateString('nl-BE')} - ${row.WorkOrder.workOrderNumber ?? 'WO'} - ${projectName}`,
    }
  })
}

export async function updateHrPerformanceSettings(data: {
  employeeId: string
  weeklyWorkHours: number
  workScheduleType: 'fixed' | 'variable'
  overtimeTrackingEnabled: boolean
  maxOvertimeHours: number | null
}) {
  const currentOvertime = await getEmployeeOvertimeTotal(data.employeeId)

  if (data.maxOvertimeHours !== null && currentOvertime > data.maxOvertimeHours) {
    throw new Error('Max overtime hours cannot be lower than the already registered overtime hours.')
  }

  return prismaClient.employee.update({
    where: {id: data.employeeId},
    data: {
      weeklyWorkHours: data.weeklyWorkHours,
      workScheduleType: data.workScheduleType,
      overtimeTrackingEnabled: data.overtimeTrackingEnabled,
      maxOvertimeHours: data.maxOvertimeHours,
    },
  })
}

export async function createHrEmployeeOvertime(data: {
  employeeId: string
  projectId: string
  sourceTimeRegistryId: string
  overtimeDate: Date
  hours: number
  description: string | null
  profileId: string
}) {
  await assertOvertimeCanBeSaved(data.employeeId, data.projectId, data.sourceTimeRegistryId, data.hours)

  return prismaClient.hrEmployeeOvertime.create({
    data: {
      id: crypto.randomUUID(),
      overtimeDate: data.overtimeDate,
      hours: data.hours,
      description: data.description,
      createdAt: new Date(),
      Employee_HrEmployeeOvertime_employeeIdToEmployee: {connect: {id: data.employeeId}},
      Project: {connect: {id: data.projectId}},
      TimeRegistry: {connect: {id: data.sourceTimeRegistryId}},
      Employee_HrEmployeeOvertime_createdByToEmployee: {connect: {id: data.profileId}},
    },
  })
}

export async function updateHrEmployeeOvertime(
  id: string,
  data: {
    employeeId: string
    projectId: string
    sourceTimeRegistryId: string
    overtimeDate: Date
    hours: number
    description: string | null
    profileId: string
  },
) {
  await assertOvertimeCanBeSaved(data.employeeId, data.projectId, data.sourceTimeRegistryId, data.hours, id)

  return prismaClient.hrEmployeeOvertime.update({
    where: {id},
    data: {
      overtimeDate: data.overtimeDate,
      hours: data.hours,
      description: data.description,
      updatedAt: new Date(),
      Employee_HrEmployeeOvertime_employeeIdToEmployee: {connect: {id: data.employeeId}},
      Project: {connect: {id: data.projectId}},
      TimeRegistry: {connect: {id: data.sourceTimeRegistryId}},
      Employee_HrEmployeeOvertime_updatedByToEmployee: {connect: {id: data.profileId}},
    },
  })
}

export async function softDeleteHrEmployeeOvertime(id: string, deletedBy: string) {
  return prismaClient.hrEmployeeOvertime.update({
    where: {id},
    data: {
      deleted: true,
      deletedAt: new Date(),
      Employee_HrEmployeeOvertime_deletedByToEmployee: {connect: {id: deletedBy}},
    },
  })
}

async function getEmployeeOvertimeTotal(employeeId: string, excludedOvertimeId?: string) {
  const rows = await prismaClient.hrEmployeeOvertime.findMany({
    where: {
      employeeId,
      deleted: false,
      ...(excludedOvertimeId ? {id: {not: excludedOvertimeId}} : {}),
    },
    select: {hours: true},
  })

  return rows.reduce((total, row) => total + decimalToNumber(row.hours), 0)
}

async function assertOvertimeCanBeSaved(
  employeeId: string,
  projectId: string,
  sourceTimeRegistryId: string,
  hoursToSave: number,
  excludedOvertimeId?: string,
) {
  const employee = await prismaClient.employee.findUniqueOrThrow({
    where: {id: employeeId},
    select: {overtimeTrackingEnabled: true, maxOvertimeHours: true},
  })

  if (!employee.overtimeTrackingEnabled) {
    throw new Error('Overtime tracking is not enabled for this employee.')
  }

  const timeRegistry = await prismaClient.timeRegistry.findUniqueOrThrow({
    where: {id: sourceTimeRegistryId},
    select: {
      deleted: true,
      onSite: true,
      createdBy: true,
      WorkOrder: {select: {projectId: true}},
      TimeRegistryEmployee: {select: {employeeId: true}},
    },
  })

  if (timeRegistry.deleted || !timeRegistry.onSite) {
    throw new Error('Overtime can only be registered for on-site time registries.')
  }

  if (timeRegistry.WorkOrder.projectId !== projectId) {
    throw new Error('The selected project must match the on-site time registry project.')
  }

  const employeeIsLinked =
    timeRegistry.createdBy === employeeId ||
    timeRegistry.TimeRegistryEmployee.some(employee => employee.employeeId === employeeId)

  if (!employeeIsLinked) {
    throw new Error('The selected on-site time registry is not linked to this employee.')
  }

  const maxOvertimeHours = employee.maxOvertimeHours ? decimalToNumber(employee.maxOvertimeHours) : null
  if (maxOvertimeHours === null) return

  const currentOvertime = await getEmployeeOvertimeTotal(employeeId, excludedOvertimeId)
  if (currentOvertime + hoursToSave > maxOvertimeHours) {
    throw new Error('Maximum overtime hours cannot be exceeded.')
  }
}
