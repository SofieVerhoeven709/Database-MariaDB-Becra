export interface HrHseTraining {
  id: string
  documentNumber: string | null
  name: string
  type: string
  validUntil: string | null
  providerName: string
}

export interface HrHseEmergencyContact {
  id: string
  name: string
  relationship: string
  mail: string
  phoneNumber: string
}

export interface HrHseFileRow {
  employeeId: string
  employeeName: string
  photoFileId: string | null
  mail: string | null
  phoneNumber: string | null
  birthDate: string | null
  address: string | null
  employmentStatus: string | null
  contractType: string | null
  hseConfigured: boolean
  includeEmployeeData: boolean
  includePartnerData: boolean
  partnerName: string | null
  partnerPhone: string | null
  partnerEmail: string | null
  includeEmergencyContact: boolean
  emergencyContacts: HrHseEmergencyContact[]
  includeEmployerData: boolean
  employerName: string | null
  employerContactName: string | null
  employerPhone: string | null
  employerEmail: string | null
  includeMedicalExamination: boolean
  lastMedicalExaminationDate: string | null
  lastMedicalExaminationValidUntil: string | null
  lastMedicalExaminationProvider: string | null
  includeTrainingData: boolean
  trainings: HrHseTraining[]
}

export type HrHseIncludeField =
  | 'includeEmployeeData'
  | 'includePartnerData'
  | 'includeEmergencyContact'
  | 'includeEmployerData'
  | 'includeMedicalExamination'
  | 'includeTrainingData'
