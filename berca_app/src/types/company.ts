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

export interface MappedCompanyContact {
  id: string
  startedDate: string
  endDate: string | null
  roleWithCompany: string | null
  createdAt: string
  createdByName: string
  deleted: boolean
  contact: {
    id: string
    firstName: string
    lastName: string
    mail1: string | null
    mail2: string | null
    mail3: string | null
    generalPhone: string | null
    mobilePhone: string | null
    homePhone: string | null
    active: boolean
  }
}

export interface MappedCompanyProject {
  id: string
  projectNumber: string
  projectName: string
  startDate: string | null
  endDate: string | null
  isOpen: boolean
  isClosed: boolean
  isMainProject: boolean
  isIntern: boolean
  projectTypeName: string
  createdByName: string
  createdAt: string
}

export interface CompanyDetailData {
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
  notes: string | null
  supplier: boolean
  prefferedSupplier: boolean
  companyActive: boolean
  newsLetter: boolean
  customer: boolean
  potentialCustomer: boolean
  headQuarters: boolean
  potentialSubContractor: boolean
  subContractor: boolean
  createdAt: string
  createdByName: string
  deleted: boolean
  companyId: string | null
  parentCompanyName: string | null
  targetId: string
  addresses: MappedCompanyAddress[]
  contacts: MappedCompanyContact[]
  projects: MappedCompanyProject[]
  subsidiaries: {id: string; name: string; number: string; companyActive: boolean}[]
}
