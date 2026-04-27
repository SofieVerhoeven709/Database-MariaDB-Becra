import 'server-only'
import {prismaClient} from '@/dal/prismaClient'
import type {Prisma} from '@/generated/prisma/client'
import type {HrEvaluationMeeting, HrEvaluationStatus} from '@/types/hrEvaluationMeeting'

export type ScheduleMeetingWithRelations = Prisma.ScheduleMeetingGetPayload<{
  include: {
    Employee_ScheduleMeeting_employeeIdToEmployee: {
      select: {
        id: true
        firstName: true
        lastName: true
      }
    }
    Employee_ScheduleMeeting_createdByToEmployee: {
      select: {
        id: true
        firstName: true
        lastName: true
      }
    }
  }
}>

export interface SaveHrEvaluationMeetingInput {
  id?: string
  employeeId: string
  conversationType: string
  startAt: Date
  endAt: Date
  place: string | null
  status: HrEvaluationStatus
  notes: string | null
  completedAt?: Date | null
  profileId: string
}

function mapScheduleMeeting(meeting: ScheduleMeetingWithRelations): HrEvaluationMeeting {
  const employee = meeting.Employee_ScheduleMeeting_employeeIdToEmployee
  const createdBy = meeting.Employee_ScheduleMeeting_createdByToEmployee

  return {
    id: meeting.id,
    employeeId: meeting.employeeId,
    employeeName: `${employee.firstName} ${employee.lastName}`.trim(),
    conversationType: meeting.conversationType,
    startAt: meeting.startAt.toISOString(),
    endAt: meeting.endAt.toISOString(),
    place: meeting.place,
    status: meeting.status as HrEvaluationStatus,
    notes: meeting.notes,
    completedAt: meeting.completedAt?.toISOString() ?? null,
    createdAt: meeting.createdAt.toISOString(),
    createdBy: meeting.createdBy,
    createdByName: `${createdBy.firstName} ${createdBy.lastName}`.trim(),
    updatedAt: meeting.updatedAt?.toISOString() ?? null,
    deleted: meeting.deleted,
  }
}

const scheduleMeetingInclude = {
  Employee_ScheduleMeeting_employeeIdToEmployee: {
    select: {id: true, firstName: true, lastName: true},
  },
  Employee_ScheduleMeeting_createdByToEmployee: {
    select: {id: true, firstName: true, lastName: true},
  },
} satisfies Prisma.ScheduleMeetingInclude

export async function getHrEvaluationMeetings(options?: {includeDeleted?: boolean}): Promise<HrEvaluationMeeting[]> {
  const includeDeleted = options?.includeDeleted ?? false

  const meetings = await prismaClient.scheduleMeeting.findMany({
    where: includeDeleted ? undefined : {deleted: false},
    include: scheduleMeetingInclude,
    orderBy: {startAt: 'desc'},
  })

  return meetings.map(mapScheduleMeeting)
}

export async function getUpcomingHrEvaluationMeetingsForEmployee(
  employeeId: string,
  today = new Date(),
  days = 30,
): Promise<HrEvaluationMeeting[]> {
  const until = new Date(today)
  until.setDate(until.getDate() + days)

  const meetings = await prismaClient.scheduleMeeting.findMany({
    where: {
      deleted: false,
      status: 'planned',
      employeeId,
      startAt: {
        gte: today,
        lte: until,
      },
    },
    include: scheduleMeetingInclude,
    orderBy: {startAt: 'asc'},
  })

  return meetings.map(mapScheduleMeeting)
}

export async function createHrEvaluationMeeting(data: SaveHrEvaluationMeetingInput) {
  return prismaClient.scheduleMeeting.create({
    data: {
      id: crypto.randomUUID(),
      conversationType: data.conversationType,
      startAt: data.startAt,
      endAt: data.endAt,
      place: data.place,
      status: data.status,
      notes: data.notes,
      completedAt: data.completedAt ?? null,
      createdAt: new Date(),
      Employee_ScheduleMeeting_employeeIdToEmployee: {connect: {id: data.employeeId}},
      Employee_ScheduleMeeting_createdByToEmployee: {connect: {id: data.profileId}},
    },
  })
}

export async function updateHrEvaluationMeeting(id: string, data: Omit<SaveHrEvaluationMeetingInput, 'id' | 'profileId'>) {
  return prismaClient.scheduleMeeting.update({
    where: {id},
    data: {
      conversationType: data.conversationType,
      startAt: data.startAt,
      endAt: data.endAt,
      place: data.place,
      status: data.status,
      notes: data.notes,
      completedAt: data.completedAt ?? null,
      updatedAt: new Date(),
      Employee_ScheduleMeeting_employeeIdToEmployee: {connect: {id: data.employeeId}},
    },
  })
}

export async function softDeleteHrEvaluationMeeting(id: string, deletedBy: string) {
  return prismaClient.scheduleMeeting.update({
    where: {id},
    data: {
      deleted: true,
      deletedAt: new Date(),
      Employee_ScheduleMeeting_deletedByToEmployee: {connect: {id: deletedBy}},
    },
  })
}
