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

// ─── Type badge colours ───────────────────────────────────────────────────────

export const TYPE_COLOURS: Record<RecordType, string> = {
  // Main records
  Contact: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  Company: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  Project: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  Training: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'Work Order': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  'Invoice In': 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  'Invoice Out': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  Purchase: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  'Time Registry': 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  Employee: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  Document: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  'Follow-up': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  'Follow-up Structure': 'bg-lime-500/10 text-lime-600 border-lime-500/20',
  'Training Standard': 'bg-emerald-600/10 text-emerald-700 border-emerald-600/20',
  'Delivery Note': 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  Quote: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'WO Structure': 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20',
  // Other records
  Certificate: 'bg-red-500/10 text-red-600 border-red-500/20',
  'Certificate Type': 'bg-red-400/10 text-red-500 border-red-400/20',
  'Company Address': 'bg-violet-400/10 text-violet-500 border-violet-400/20',
  'Company Contact': 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20',
  Department: 'bg-indigo-400/10 text-indigo-500 border-indigo-400/20',
  Function: 'bg-blue-400/10 text-blue-500 border-blue-400/20',
  'Hour Type': 'bg-cyan-400/10 text-cyan-500 border-cyan-400/20',
  Inventory: 'bg-teal-400/10 text-teal-500 border-teal-400/20',
  'Inventory Change': 'bg-teal-600/10 text-teal-700 border-teal-600/20',
  'Inventory Order': 'bg-green-500/10 text-green-600 border-green-500/20',
  'Inventory Structure': 'bg-green-400/10 text-green-500 border-green-400/20',
  'Invoice Type': 'bg-rose-400/10 text-rose-500 border-rose-400/20',
  Material: 'bg-amber-400/10 text-amber-500 border-amber-400/20',
  'Material Assembly': 'bg-amber-600/10 text-amber-700 border-amber-600/20',
  'Material Code': 'bg-orange-400/10 text-orange-500 border-orange-400/20',
  'Material Family': 'bg-orange-600/10 text-orange-700 border-orange-600/20',
  'Material Movement': 'bg-yellow-400/10 text-yellow-600 border-yellow-400/20',
  'Material Other': 'bg-yellow-600/10 text-yellow-700 border-yellow-600/20',
  'Material Price': 'bg-lime-500/10 text-lime-600 border-lime-500/20',
  'Material Serial Track': 'bg-lime-700/10 text-lime-800 border-lime-700/20',
  Part: 'bg-emerald-400/10 text-emerald-500 border-emerald-400/20',
  Phantom: 'bg-slate-400/10 text-slate-500 border-slate-400/20',
  Product: 'bg-sky-400/10 text-sky-500 border-sky-400/20',
  'Project Contact': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'Project Type': 'bg-amber-700/10 text-amber-800 border-amber-700/20',
  'Purchase Detail': 'bg-indigo-600/10 text-indigo-700 border-indigo-600/20',
  'Purchase Order': 'bg-purple-400/10 text-purple-500 border-purple-400/20',
  'Quote Becra': 'bg-purple-600/10 text-purple-700 border-purple-600/20',
  Role: 'bg-pink-400/10 text-pink-500 border-pink-400/20',
  'Role Level': 'bg-pink-600/10 text-pink-700 border-pink-600/20',
  Status: 'bg-green-600/10 text-green-700 border-green-600/20',
  'Sub Role': 'bg-fuchsia-600/10 text-fuchsia-700 border-fuchsia-600/20',
  'Supplier DN Follow-up': 'bg-sky-600/10 text-sky-700 border-sky-600/20',
  Target: 'bg-cyan-600/10 text-cyan-700 border-cyan-600/20',
  'Target Type': 'bg-teal-700/10 text-teal-800 border-teal-700/20',
  'Test Procedure': 'bg-red-600/10 text-red-700 border-red-600/20',
  Title: 'bg-slate-600/10 text-slate-700 border-slate-600/20',
  'Training Contact': 'bg-emerald-700/10 text-emerald-800 border-emerald-700/20',
  Unit: 'bg-zinc-400/10 text-zinc-500 border-zinc-400/20',
  'Urgency Type': 'bg-orange-700/10 text-orange-800 border-orange-700/20',
  'Warehouse Place': 'bg-blue-700/10 text-blue-800 border-blue-700/20',
}
