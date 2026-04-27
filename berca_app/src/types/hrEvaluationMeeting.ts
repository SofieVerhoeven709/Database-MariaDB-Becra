export type HrEvaluationStatus = 'planned' | 'completed' | 'cancelled'

export interface HrEvaluationMeeting {
  id: string
  employeeId: string
  employeeName: string
  conversationType: string
  startAt: string
  endAt: string
  place: string | null
  status: HrEvaluationStatus
  notes: string | null
  completedAt: string | null
  createdAt: string
  createdBy: string
  createdByName: string | null
  updatedAt: string | null
  deleted: boolean
}

export interface HrEvaluationEmployeeOption {
  id: string
  name: string
}
