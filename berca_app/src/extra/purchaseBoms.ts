import type {MappedPurchaseBOM, MappedPurchaseBOMStructure, ChildPurchaseBOM} from '@/types/purchaseBom'
import type {BOMExecutionRaw} from '@/extra/projectBom'

// ─── Raw types (matching updated Prisma include shape) ─────────────────────────
type StructureEmployeeRaw = {id: string; firstName: string; lastName: string}

type PurchaseBOMStructureRaw = {
  id: string
  purchaseBOMId: string
  projectBOMStructureId: string
  materialId: string
  shortDescription: string | null
  additionalInfo: string | null
  description: string | null
  tag: string | null
  readyForPurchaseDate: Date | null
  createdAt: Date
  createdBy: string
  // PurchaseBOMStructure in the schema does NOT have readyForPurchase or notDeliverable —
  // those live on ProjectBOMStructure / BOMExecution. We read them from the joined
  // ProjectBOMStructure below.
  deleted: boolean
  approvedForQuote: boolean
  purchased: boolean
  deletedAt: Date | null
  deletedBy: string | null
  Material: {id: string; name: string | null; beNumber: string | null; shortDescription: string | null}
  Employee_PurchaseBOMStructure_createdByToEmployee: StructureEmployeeRaw
  Employee_PurchaseBOMStructure_deletedByToEmployee: StructureEmployeeRaw | null
  ProjectBOMStructure: {
    Material: {id: string; name: string | null; beNumber: string | null; shortDescription: string | null}
    BOMExecution: BOMExecutionRaw | null
  }
}

type ChildBOMRaw = {
  id: string
  purchaseBomNumber: string
  description: string | null
  shortDescription: string
  closed: boolean
  materialClosed: boolean
  approvedForQuote: boolean
  purchased: boolean
  deleted: boolean
  PurchaseBOMStructure: {id: string}[]
}

type PurchaseBOMRaw = {
  id: string
  projectId: string
  purchaseBomId: string | null
  purchaseBomNumber: string
  shortDescription: string
  additionalInfo: string | null
  description: string | null
  startDate: Date
  endDate: Date | null
  createdAt: Date
  createdBy: string
  closed: boolean
  materialClosed: boolean
  approvedForQuote: boolean
  deleted: boolean
  purchased: boolean
  deletedAt: Date | null
  deletedBy: string | null
  Project: {id: string; projectNumber: string | null; projectName: string | null}
  Employee_PurchaseBOM_createdByToEmployee: StructureEmployeeRaw
  Employee_PurchaseBOM_deletedByToEmployee: StructureEmployeeRaw | null
  other_PurchaseBOM: ChildBOMRaw[]
  PurchaseBOMStructure: PurchaseBOMStructureRaw[]
}

function mapStructure(r: PurchaseBOMStructureRaw): MappedPurchaseBOMStructure {
  const exec = r.ProjectBOMStructure.BOMExecution
  return {
    id: r.id,
    purchaseBOMId: r.purchaseBOMId,
    projectBOMStructureId: r.projectBOMStructureId,
    materialId: r.materialId,
    // Prefer the most descriptive material label available.
    materialName: r.Material.name ?? r.Material.shortDescription ?? r.Material.beNumber ?? r.materialId,
    materialBeNumber: r.Material.beNumber ?? '',
    // ─── Read-only (from project side) ──────────────────────────────────────
    shortDescription: r.shortDescription,
    additionalInfo: r.additionalInfo,
    description: r.description,
    tag: r.tag,
    requiredQuantity: exec?.requiredQuantity ?? null,
    readyForPurchaseDate: r.readyForPurchaseDate?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    createdBy: r.createdBy,
    createdByName: `${r.Employee_PurchaseBOMStructure_createdByToEmployee.firstName} ${r.Employee_PurchaseBOMStructure_createdByToEmployee.lastName}`,
    deleted: r.deleted,
    approvedForQuote: r.approvedForQuote,
    purchased: r.purchased,
    deletedAt: r.deletedAt?.toISOString() ?? null,
    deletedBy: r.deletedBy,
    deletedByName: r.Employee_PurchaseBOMStructure_deletedByToEmployee
      ? `${r.Employee_PurchaseBOMStructure_deletedByToEmployee.firstName} ${r.Employee_PurchaseBOMStructure_deletedByToEmployee.lastName}`
      : null,
    // ─── Execution fields (editable on purchase side) ───────────────────────
    reservedQuantity: exec?.stockReservedQuantity ?? null,
    issuedQuantity: exec?.issuedQuantity ?? null,
    notDeliverable: exec?.notDeliverable ?? false,
    notCorrect: exec?.notCorrect ?? false,
    notCorrectReason: exec?.notCorrectReason ?? null,
    completedDate: exec?.completedDate?.toISOString() ?? null,
  }
}

function mapChild(r: ChildBOMRaw): ChildPurchaseBOM {
  return {
    id: r.id,
    purchaseBomNumber: r.purchaseBomNumber,
    description: r.description,
    shortDescription: r.shortDescription,
    structureCount: r.PurchaseBOMStructure.length,
    closed: r.closed,
    purchased: r.purchased,
    approvedForQuote: r.approvedForQuote,
    materialClosed: r.materialClosed,
    deleted: r.deleted,
  }
}

export function mapPurchaseBOM(r: PurchaseBOMRaw): MappedPurchaseBOM {
  const structures = r.PurchaseBOMStructure.map(mapStructure)
  return {
    id: r.id,
    projectId: r.projectId,
    projectName: r.Project.projectName,
    projectNumber: r.Project.projectNumber,
    purchaseBomId: r.purchaseBomId,
    purchaseBomNumber: r.purchaseBomNumber,
    shortDescription: r.shortDescription,
    additionalInfo: r.additionalInfo,
    description: r.description,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    createdBy: r.createdBy,
    createdByName: `${r.Employee_PurchaseBOM_createdByToEmployee.firstName} ${r.Employee_PurchaseBOM_createdByToEmployee.lastName}`,
    closed: r.closed,
    materialClosed: r.materialClosed,
    approvedForQuote: r.approvedForQuote,
    deleted: r.deleted,
    purchased: r.purchased,
    deletedAt: r.deletedAt?.toISOString() ?? null,
    deletedBy: r.deletedBy,
    deletedByName: r.Employee_PurchaseBOM_deletedByToEmployee
      ? `${r.Employee_PurchaseBOM_deletedByToEmployee.firstName} ${r.Employee_PurchaseBOM_deletedByToEmployee.lastName}`
      : null,
    structures,
    // Count only active (non-deleted) structures for summary displays.
    structureCount: structures.filter(s => !s.deleted).length,
    children: r.other_PurchaseBOM.map(mapChild),
  }
}
