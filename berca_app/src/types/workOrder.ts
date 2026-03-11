import type {WorkOrderDetailData} from '@/extra/workOrders'

export interface MappedWorkOrder {
  id: string
  workOrderNumber: string | null
  description: string | null
  additionalInfo: string | null
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
  // display fields
  createdByName: string
  deletedByName: string | null
  projectNumber: string
  projectName: string
}

export interface EmployeeOption {
  id: string
  firstName: string
  lastName: string
}

export interface HourTypeOption {
  id: string
  name: string
}

export interface MaterialOption {
  id: string
  name: string
}

export interface PermissionProps {
  canAdd: boolean
  canDelete: boolean
  isAdmin: boolean
}

export type TimeRegistryRow = WorkOrderDetailData['TimeRegistry'][number]
export type StructureRow = WorkOrderDetailData['WorkOrderStructure'][number]
