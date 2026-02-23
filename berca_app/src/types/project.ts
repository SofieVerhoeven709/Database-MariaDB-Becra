export interface MappedProject {
  id: string
  projectNumber: string
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
  targetId: string
  targetName: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
}
