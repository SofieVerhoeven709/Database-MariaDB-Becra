export type TargetTypeName =
  | 'Contact'
  | 'Company'
  | 'Project'
  | 'WorkOrder'
  | 'WorkOrderStructure'
  | 'Department'
  | 'DepartmentExtern'
  | 'InvoiceIn'
  | 'InvoiceOut'
  | 'Training'
  | 'TrainingStandard'
  | 'Certificate'
  | 'DocumentStructure'
  | 'Employee'
  | 'FollowUp'
  | 'FollowUpStructure'

export type TargetOption = {
  id: string
  name: string
}

export type TargetOptions = Record<TargetTypeName, TargetOption[]>

export const TARGET_TYPE_NAMES: TargetTypeName[] = [
  'Contact',
  'Company',
  'Project',
  'WorkOrder',
  'WorkOrderStructure',
  'Department',
  'DepartmentExtern',
  'InvoiceIn',
  'InvoiceOut',
  'Training',
  'TrainingStandard',
  'Certificate',
  'DocumentStructure',
  'Employee',
  'FollowUp',
  'FollowUpStructure',
]
