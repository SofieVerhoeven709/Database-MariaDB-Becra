import type {EmergencyContact} from '@/generated/prisma/client'

export interface MappedEmployee {
  id: string
  firstName: string
  lastName: string
  mail: string | null
  username: string
  phoneNumber: string | null
  birthDate: string | null
  startDate: string
  endDate: string | null
  info: string | null
  street: string | null
  houseNumber: string | null
  busNumber: string | null
  zipCode: string | null
  place: string | null
  permanentEmployee: boolean
  checkInfo: boolean
  newYearCard: boolean
  active: boolean
  createdAt: string
  createdBy: string | null
  passwordCreatedAt: string
  pictureId: string | null
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  roleLevelId: string | null
  titleId: string | null
  roleName: string
  titleName: string
  emergencyContacts: EmergencyContact[] // can type this more precisely later
}
