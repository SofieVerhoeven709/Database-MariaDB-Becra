export interface HrScheduleEmployee {
  id: string
  firstName: string
  lastName: string
  startDate?: string | Date | null
  active?: boolean | null
  deleted?: boolean | null
}

export interface HrScheduleMeeting {
  id: string
  employeeId: string
  employeeName: string
  conversationType: string
  startAt: string
  endAt: string
  place: string
}

const EVALUATION_WARNING_DAYS = 30
const DEFAULT_MEETING_HOUR = 10
const DEFAULT_MEETING_DURATION_MINUTES = 45

function startOfDay(date: Date) {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

function getNextAnniversary(startDate: Date, today: Date) {
  const next = new Date(today.getFullYear(), startDate.getMonth(), startDate.getDate())
  next.setHours(DEFAULT_MEETING_HOUR, 0, 0, 0)

  if (startOfDay(next).getTime() < startOfDay(today).getTime()) {
    next.setFullYear(next.getFullYear() + 1)
  }

  return next
}

export function getEvaluationWarningDays() {
  return EVALUATION_WARNING_DAYS
}

export function buildHrScheduleMeetings(employees: HrScheduleEmployee[], today = new Date()): HrScheduleMeeting[] {
  return employees
    .filter(employee => employee.active !== false && !employee.deleted && employee.startDate)
    .map(employee => {
      const startDate = new Date(employee.startDate as string | Date)
      if (Number.isNaN(startDate.getTime())) return null

      const startAt = getNextAnniversary(startDate, today)
      const endAt = new Date(startAt.getTime() + DEFAULT_MEETING_DURATION_MINUTES * 60 * 1000)
      const employeeName = `${employee.firstName} ${employee.lastName}`.trim()

      return {
        id: `${employee.id}-${startAt.getFullYear()}-evaluation`,
        employeeId: employee.id,
        employeeName,
        conversationType: 'Evaluation meeting',
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        place: 'HR meeting room',
      }
    })
    .filter((meeting): meeting is HrScheduleMeeting => meeting !== null)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
}

export function getUpcomingHrMeetingsForEmployee(
  meetings: HrScheduleMeeting[],
  employeeId: string,
  today = new Date(),
  warningDays = EVALUATION_WARNING_DAYS,
) {
  const todayStart = startOfDay(today).getTime()

  return meetings.filter(meeting => {
    if (meeting.employeeId !== employeeId) return false

    const meetingStart = startOfDay(new Date(meeting.startAt)).getTime()
    const diffDays = Math.ceil((meetingStart - todayStart) / (1000 * 60 * 60 * 24))

    return diffDays >= 0 && diffDays <= warningDays
  })
}
