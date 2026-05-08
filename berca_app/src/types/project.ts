import {MappedProjectBOM} from '@/types/projectBom'

export interface MappedProjectContact {
  id: string
  contactId: string
  contactName: string
  contactEmail: string | null
  contactPhone: string | null
  additionalInfo: string | null
  description: string | null
  extraInfo: string | null
  isValid: boolean
  createdAt: string
  createdBy: string
  createdByName: string
  deleted: boolean
  deletedAt: string | null
}

export interface MappedWorkOrder {
  id: string
  workOrderNumber: string | null
  description: string | null
  startDate: string | null
  endDate: string | null
  completed: boolean
  invoiceSent: boolean
  hoursMaterialClosed: boolean
  createdAt: string
  employeeId: string | null
  employeeName: string | null
  deleted: boolean
}

export interface MappedMaterialSerialTrack {
  id: string
  materialId: string | null
  companyId: string | null
  companyName: string | null
  employeeId: string | null
  employeeName: string | null
  serialNumber: string | null
  becraCode: string | null
  shortDescription: string | null
  brandName: string | null
  transactionType: string | null
  createdAt: string
  deleted: boolean
}

export interface MappedSubProject {
  id: string
  projectNumber: string | null
  projectName: string | null
  companyName: string
  projectTypeName: string
  startDate: string | null
  endDate: string | null
  isOpen: boolean
  isClosed: boolean
  deleted: boolean
}

export interface MappedProjectEmployee {
  id: string
  employeeId: string
  employeeName: string
  additionalInfo: string | null
  manager: boolean
  supervisor: boolean
}

export interface MappedProject {
  id: string
  projectNumber: string
  projectName: string
  description: string | null
  extraInfo: string | null
  startDate: string | null
  endDate: string | null
  closingDate: string | null
  engineeringStartDate: string | null
  createdAt: string
  isMainProject: boolean
  isIntern: boolean
  isOpen: boolean
  isClosed: boolean
  createdBy: string
  companyId: string
  companyName: string
  projectTypeId: string
  projectTypeName: string
  parentProjectId: string | null
  parentProjectNumber: string | null
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  targetId: string
  projectEmployees: MappedProjectEmployee[]
  // ─── Detail-only relations ────────────────────────────────────────────────
  contacts: MappedProjectContact[]
  workOrders: MappedWorkOrder[]
  materialSerialTracks: MappedMaterialSerialTrack[]
  subProjects: MappedSubProject[]
  projectBoms: MappedProjectBOM[]
  createdByEmployeeId: string | null
  createdByEmployeeName: string | null
}
