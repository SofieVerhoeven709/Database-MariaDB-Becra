export interface MappedTimeRegistry {
  // Flattened time registry row used by tables and forms.
  id: string
  activityDescription: string | null
  additionalInfo: string | null
  invoiceInfo: string | null
  startTime: string
  endTime: string | null
  workDate: string
  startBreak: string | null
  endBreak: string | null
  createdAt: string
  invoiceTime: boolean
  onSite: boolean
  createdBy: string
  workOrderId: string
  hourTypeId: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  stayOver: boolean

  // Relations
  employeeFirstName: string
  employeeLastName: string
  hourTypeName: string
  workOrderNumber: string | null
  additionalEmployees: {
    id: string
    employeeId: string
    employeeFirstName: string
    employeeLastName: string
  }[]
}
