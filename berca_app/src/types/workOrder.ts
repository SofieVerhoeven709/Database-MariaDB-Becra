export interface MappedWorkOrder {
  id: string
  workOrderNumber: string | null
  description: string | null
  aditionalInfo: string | null
  startDate: string
  endDate: string | null
  createdAt: string
  hoursMaterialClosed: boolean
  invoiceSent: boolean
  completed: boolean
  createdBy: string
  projectId: string
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  // relations
  createdByFirstName: string
  createdByLastName: string
  projectNumber: string
  projectName: string
}
