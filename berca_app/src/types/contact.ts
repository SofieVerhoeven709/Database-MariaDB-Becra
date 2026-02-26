export interface MappedCompanyContact {
  id: string
  startedDate: string
  endDate: string | null
  roleWithCompany: string | null

  createdAt: string
  createdBy: string

  contactId: string
  companyId: string

  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
}

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

  createdAt: string
  createdBy: string
  createdByName: string

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

  functionId: string | null
  departmentExternId: string | null
  titleId: string | null
  businessCardId: string | null
  targetId: string

  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null

  companyContacts: MappedCompanyContact[]
}
