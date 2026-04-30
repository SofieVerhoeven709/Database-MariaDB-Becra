export interface HrCertificationTrainingEmployeeOption {
  id: string
  name: string
}

export type HrTrainingType = 'one_time' | 'recurring' | 'certification'
export type HrRecurrenceInterval = '5y' | '10y' | 'none'
export type HrAbsenceType = 'ADV' | 'VACATION' | 'SICKNESS' | 'SMALL_LEAVE' | 'HOLIDAY'

export interface HrCertificationTraining {
  id: string
  employeeId: string
  employeeName: string
  trainingName: string
  trainingType: HrTrainingType
  recurrenceInterval: HrRecurrenceInterval
  trainingDate: string
  certificateValidUntil: string | null
  providerName: string
  additionalInfo: string | null
  createdAt: string
  updatedAt: string | null
}

export interface HrAbsence {
  id: string
  employeeId: string
  employeeName: string
  year: number
  absenceType: HrAbsenceType
  days: number
  additionalInfo: string | null
  createdAt: string
  updatedAt: string | null
}
