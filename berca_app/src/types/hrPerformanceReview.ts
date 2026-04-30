export interface HrPerformanceProjectOption {
  id: string
  name: string
}

export interface HrPerformanceTimeRegistryOption {
  id: string
  employeeIds: string[]
  projectId: string
  projectName: string
  workDate: string
  label: string
}

export interface HrPerformanceOvertime {
  id: string
  projectId: string
  sourceTimeRegistryId: string | null
  projectName: string
  overtimeDate: string
  hours: string
  description: string | null
}

export interface HrPerformanceReviewRow {
  employeeId: string
  employeeName: string
  mail: string | null
  weeklyWorkHours: string
  workScheduleType: string
  overtimeTrackingEnabled: boolean
  maxOvertimeHours: string | null
  overtimeHours: string
  overtimeRemainingHours: string | null
  latestCompletedReviewAt: string | null
  nextPlannedReviewAt: string | null
  overtimeEntries: HrPerformanceOvertime[]
}
