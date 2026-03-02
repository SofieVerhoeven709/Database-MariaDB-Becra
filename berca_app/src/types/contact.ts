import type {MappedVisibilityForRole} from '@/types/visibilityForRole'

export interface MappedContact {
  id: string
  firstName: string
  lastName: string
  mail1: string | null
  mail2: string | null
  mail3: string | null
  generalPhone: string | null
  homePhone: string | null
  mobilePhone: string | null
  info: string | null
  birthDate: string | null
  trough: string | null
  description: string | null
  infoCorrect: boolean
  checkInfo: boolean
  newYearCard: boolean
  active: boolean
  newsLetter: boolean
  mailing: boolean
  trainingAdvice: boolean
  contactForTrainingAndAdvice: boolean
  customerTrainingAndAdvice: boolean
  potentialCustomerTrainingAndAdvice: boolean
  potentialTeacherTrainingAndAdvice: boolean
  teacherTrainingAndAdvice: boolean
  participantTrainingAndAdvice: boolean
  createdAt: string
  createdBy: string
  createdByName: string
  functionId: string | null
  functionName: string | null
  departmentExternId: string | null
  departmentExternName: string | null
  titleId: string | null
  titleName: string | null
  businessCardId: string | null
  targetId: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
  visibilityForRoles: MappedVisibilityForRole[]
}

// ─── Tab types ────────────────────────────────────────────────────────────────

export interface MappedContactCompany {
  id: string // CompanyContact id
  startedDate: string
  endDate: string | null
  roleWithCompany: string | null
  createdAt: string
  createdByName: string
  deleted: boolean
  company: {
    id: string
    name: string
    number: string
    companyActive: boolean
  }
}

export interface MappedContactProject {
  id: string // ProjectContact id
  createdAt: string
  createdByName: string
  project: {
    id: string
    projectNumber: string
    projectName: string
    startDate: string | null
    endDate: string | null
    isOpen: boolean
    isClosed: boolean
    projectTypeName: string
  }
}

export interface MappedContactTraining {
  id: string // TrainingContact id
  createdAt: string
  createdByName: string
  succeeded: boolean
  attended: boolean
  certificateSent: boolean
  certSentDate: string | null
  training: {
    id: string
    trainingNumber: string | null
    trainingDate: string
    trainingStandardDescriptionShort: string
  }
}

export interface MappedContactFollowUp {
  id: string // FollowUpStructure id
  contactDate: string
  activityDescription: string | null
  additionalInfo: string | null
  item: string | null
  taskDescription: string | null
  actionAgenda: string | null
  closedAgenda: string | null
  createdAt: string
  createdByName: string
}

// ─── Full detail type ─────────────────────────────────────────────────────────

export interface ContactDetailData {
  id: string
  firstName: string
  lastName: string
  mail1: string | null
  mail2: string | null
  mail3: string | null
  generalPhone: string | null
  homePhone: string | null
  mobilePhone: string | null
  info: string | null
  birthDate: string | null
  trough: string | null
  description: string | null
  infoCorrect: boolean
  checkInfo: boolean
  newYearCard: boolean
  active: boolean
  newsLetter: boolean
  mailing: boolean
  trainingAdvice: boolean
  contactForTrainingAndAdvice: boolean
  customerTrainingAndAdvice: boolean
  potentialCustomerTrainingAndAdvice: boolean
  potentialTeacherTrainingAndAdvice: boolean
  teacherTrainingAndAdvice: boolean
  participantTrainingAndAdvice: boolean
  createdAt: string
  createdByName: string
  functionId: string | null
  functionName: string | null
  departmentExternId: string | null
  departmentExternName: string | null
  titleId: string | null
  titleName: string | null
  businessCardId: string | null
  targetId: string
  deleted: boolean
  // Tabs
  companies: MappedContactCompany[]
  projects: MappedContactProject[]
  trainings: MappedContactTraining[]
  followUps: MappedContactFollowUp[]
  visibilityForRoles: MappedVisibilityForRole[]
}
