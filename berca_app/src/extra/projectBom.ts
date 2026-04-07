import type {MappedProjectBOM, MappedProjectBOMStructure, ChildProjectBOM} from '@/types/projectBom'

// ─── Raw types (matching updated Prisma include shape) ─────────────────────────
type StructureEmployeeRaw = {id: string; firstName: string; lastName: string}

export type BOMExecutionRaw = {
  requiredQuantity: number
  stockReservedQuantity: number | null
  issuedQuantity: number | null
  notDeliverable: boolean
  notCorrect: boolean
  notCorrectReason: string | null
  completedDate: Date | null
}

type ProjectBOMStructureRaw = {
  id: string
  projectBOMId: string
  materialId: string
  shortDescription: string | null
  additionalInfo: string | null
  description: string | null
  tag: string | null
  readyForPurchaseDate: Date | null
  createdAt: Date
  createdBy: string
  readyForPurchase: boolean
  deleted: boolean
  deletedAt: Date | null
  deletedBy: string | null
  Material: {id: string; name: string | null; beNumber: string | null; shortDescription: string | null}
  Employee_ProjectBOMStructure_createdByToEmployee: StructureEmployeeRaw
  Employee_ProjectBOMStructure_deletedByToEmployee: StructureEmployeeRaw | null
  BOMExecution: BOMExecutionRaw | null
}

type ChildBOMRaw = {
  id: string
  projectBomNumber: string
  description: string | null
  shortDescription: string
  closed: boolean
  materialClosed: boolean
  readyForPurchase: boolean
  deleted: boolean
  ProjectBOMStructure: {id: string}[]
}

type ProjectBOMRaw = {
  id: string
  projectId: string
  projectBomId: string | null
  projectBomNumber: string
  shortDescription: string
  additionalInfo: string | null
  description: string | null
  startDate: Date
  endDate: Date | null
  createdAt: Date
  createdBy: string
  closed: boolean
  materialClosed: boolean
  readyForPurchase: boolean
  deleted: boolean
  deletedAt: Date | null
  deletedBy: string | null
  Project: {id: string; projectNumber: string | null; projectName: string | null}
  Employee_ProjectBOM_createdByToEmployee: StructureEmployeeRaw
  Employee_ProjectBOM_deletedByToEmployee: StructureEmployeeRaw | null
  other_ProjectBOM: ChildBOMRaw[]
  ProjectBOMStructure: ProjectBOMStructureRaw[]
}

function mapStructure(r: ProjectBOMStructureRaw): MappedProjectBOMStructure {
  const exec = r.BOMExecution
  return {
    id: r.id,
    projectBOMId: r.projectBOMId,
    materialId: r.materialId,
    materialName: r.Material.name ?? r.Material.shortDescription ?? r.Material.beNumber ?? r.materialId,
    materialBeNumber: r.Material.beNumber ?? '',
    shortDescription: r.shortDescription,
    additionalInfo: r.additionalInfo,
    description: r.description,
    tag: r.tag,
    requiredQuantity: exec?.requiredQuantity ?? null,
    readyForPurchaseDate: r.readyForPurchaseDate?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    createdBy: r.createdBy,
    createdByName: `${r.Employee_ProjectBOMStructure_createdByToEmployee.firstName} ${r.Employee_ProjectBOMStructure_createdByToEmployee.lastName}`,
    readyForPurchase: r.readyForPurchase,
    deleted: r.deleted,
    deletedAt: r.deletedAt?.toISOString() ?? null,
    deletedBy: r.deletedBy,
    deletedByName: r.Employee_ProjectBOMStructure_deletedByToEmployee
      ? `${r.Employee_ProjectBOMStructure_deletedByToEmployee.firstName} ${r.Employee_ProjectBOMStructure_deletedByToEmployee.lastName}`
      : null,
    // ─── Execution fields ────────────────────────────────────────────────────
    execStockReservedQuantity: exec?.stockReservedQuantity ?? null,
    execIssuedQuantity: exec?.issuedQuantity ?? null,
    execNotDeliverable: exec?.notDeliverable ?? false,
    execNotCorrect: exec?.notCorrect ?? false,
    execNotCorrectReason: exec?.notCorrectReason ?? null,
    execCompletedDate: exec?.completedDate?.toISOString() ?? null,
  }
}

function mapChild(r: ChildBOMRaw): ChildProjectBOM {
  return {
    id: r.id,
    projectBomNumber: r.projectBomNumber,
    description: r.description,
    shortDescription: r.shortDescription,
    structureCount: r.ProjectBOMStructure.length,
    closed: r.closed,
    materialClosed: r.materialClosed,
    readyForPurchase: r.readyForPurchase,
    deleted: r.deleted,
  }
}

export function mapProjectBOM(r: ProjectBOMRaw): MappedProjectBOM {
  const structures = r.ProjectBOMStructure.map(mapStructure)
  return {
    id: r.id,
    projectId: r.projectId,
    projectName: r.Project.projectName,
    projectNumber: r.Project.projectNumber,
    projectBomId: r.projectBomId,
    projectBomNumber: r.projectBomNumber,
    shortDescription: r.shortDescription,
    additionalInfo: r.additionalInfo,
    description: r.description,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    createdBy: r.createdBy,
    createdByName: `${r.Employee_ProjectBOM_createdByToEmployee.firstName} ${r.Employee_ProjectBOM_createdByToEmployee.lastName}`,
    closed: r.closed,
    materialClosed: r.materialClosed,
    readyForPurchase: r.readyForPurchase,
    deleted: r.deleted,
    deletedAt: r.deletedAt?.toISOString() ?? null,
    deletedBy: r.deletedBy,
    deletedByName: r.Employee_ProjectBOM_deletedByToEmployee
      ? `${r.Employee_ProjectBOM_deletedByToEmployee.firstName} ${r.Employee_ProjectBOM_deletedByToEmployee.lastName}`
      : null,
    structures,
    structureCount: structures.filter(s => !s.deleted).length,
    children: r.other_ProjectBOM.map(mapChild),
  }
}
