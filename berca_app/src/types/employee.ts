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
  emergencyContacts: EmergencyContact[]
}

// ─── Assigned (unchanged) ─────────────────────────────────────────────────────

export interface MappedEmployeeFollowUp {
  id: string
  activityDescription: string | null
  actionAgenda: string | null
  closedAgenda: string | null
  createdAt: string
  itemClosed: boolean
  statusName: string
  followUpTypeName: string
  urgencyTypeName: string
  role: 'owner' | 'executor'
}

export interface MappedEmployeeFollowUpStructure {
  id: string
  item: string | null
  activityDescription: string | null
  contactDate: string
  actionAgenda: string | null
  closedAgenda: string | null
  statusName: string
  urgencyTypeName: string
  role: 'owner' | 'executor' | 'taskFor'
}

export interface MappedEmployeeDocument {
  id: string
  documentNumber: string
  descriptionShort: string
  valid: boolean
  createdAt: string
  role: 'manager' | 'revisor'
}

export interface MappedEmployeeTimeRegistryParticipation {
  id: string
  timeRegistryId: string
  workDate: string
  startTime: string
  endTime: string | null
  activityDescription: string | null
  workOrderNumber: string | null
}

// ─── Unified flat row for Created / Deleted tables ────────────────────────────

export type RecordType =
  // Main records
  | 'Contact'
  | 'Company'
  | 'Project'
  | 'Training'
  | 'Work Order'
  | 'Invoice In'
  | 'Invoice Out'
  | 'Purchase'
  | 'Time Registry'
  | 'Employee'
  | 'Document'
  | 'Follow-up'
  | 'Follow-up Structure'
  | 'Training Standard'
  | 'Delivery Note'
  | 'Quote'
  | 'WO Structure'
  // Other records
  | 'Certificate'
  | 'Certificate Type'
  | 'Company Address'
  | 'Company Contact'
  | 'Department'
  | 'Function'
  | 'Hour Type'
  | 'Inventory'
  | 'Inventory Change'
  | 'Inventory Order'
  | 'Inventory Structure'
  | 'Invoice Type'
  | 'Material'
  | 'Material Assembly'
  | 'Material Code'
  | 'Material Family'
  | 'Material Movement'
  | 'Material Other'
  | 'Material Price'
  | 'Material Serial Track'
  | 'Part'
  | 'Phantom'
  | 'Product'
  | 'Project Contact'
  | 'Project Type'
  | 'Purchase Detail'
  | 'Purchase Order'
  | 'Quote Becra'
  | 'Role'
  | 'Role Level'
  | 'Status'
  | 'Sub Role'
  | 'Supplier DN Follow-up'
  | 'Target'
  | 'Target Type'
  | 'Test Procedure'
  | 'Title'
  | 'Training Contact'
  | 'Unit'
  | 'Urgency Type'
  | 'Warehouse Place'

export interface UnifiedRecord {
  id: string
  /** Human-readable record type shown in the Type column */
  type: RecordType
  /** Primary label: name, number, title of the record */
  label: string
  /** Secondary detail: company name, project name, etc. */
  detail: string | null
  /** The main date of the record (createdAt or the domain date like invoiceDate) */
  date: string | null
  /** Only present for deleted records */
  deletedAt: string | null
  /** Optional deep-link to the record's own detail page */
  href: string | null
}

// ─── Full detail type ─────────────────────────────────────────────────────────

export interface EmployeeDetailData {
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
  createdByName: string | null
  passwordCreatedAt: string
  pictureId: string | null
  deleted: boolean
  deletedAt: string | null
  deletedByName: string | null
  roleName: string
  roleLevelId: string | null
  titleName: string
  titleId: string | null
  emergencyContacts: EmergencyContact[]

  // Section 1 – Assigned (rich, per-entity arrays)
  assignedFollowUps: MappedEmployeeFollowUp[]
  assignedFollowUpStructures: MappedEmployeeFollowUpStructure[]
  assignedDocuments: MappedEmployeeDocument[]
  participatedTimeRegistries: MappedEmployeeTimeRegistryParticipation[]

  // Section 2 – Created
  createdMainRecords: UnifiedRecord[]
  createdOtherRecords: UnifiedRecord[]

  // Section 3 – Deleted
  deletedMainRecords: UnifiedRecord[]
  deletedOtherRecords: UnifiedRecord[]
}
