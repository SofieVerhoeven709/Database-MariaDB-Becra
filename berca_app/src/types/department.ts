export interface DepartmentOption {
  id: string
  name: string
}

export interface MappedDepartment {
  id: string
  name: string
  color: string | null
  icon: string | null
  description: string | null
  number: number | null
  createdAt: string
  createdBy: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  targetId: string
  // display fields
  createdByName: string
  deletedByName: string | null
}
