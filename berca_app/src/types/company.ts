import type {MappedVisibilityForRole} from '@/types/visibilityForRole'

export interface MappedCompanyAddress {
  id: string
  street: string | null
  houseNumber: string | null
  busNumber: string | null
  zipCode: string | null
  place: string | null
  typeAdress: string | null
  createdAt: string
  createdBy: string
  companyId: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
}

export interface MappedCompany {
  id: string
  name: string
  number: string
  mail: string | null
  businessPhone: string | null
  website: string | null
  vatNumber: string | null
  bankNumber: string | null
  iban: string | null
  bic: string | null
  becraCustomerNumber: string | null
  becraWebsiteLogin: string | null
  supplier: boolean
  prefferedSupplier: boolean
  companyActive: boolean
  newsLetter: boolean
  customer: boolean
  potentialCustomer: boolean
  headQuarters: boolean
  potentialSubContractor: boolean
  subContractor: boolean
  notes: string | null
  createdAt: string
  createdBy: string
  createdByName: string
  companyId: string | null
  parentCompanyName: string | null
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  deletedByName: string | null
  addresses: MappedCompanyAddress[]
  targetId: string
  visibilityForRoles: MappedVisibilityForRole[]
}
