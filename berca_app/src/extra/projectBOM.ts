import type {MappedProjectBOM, MappedProjectBOMStructure} from '@/types/projectBOM'

// ─── Raw types (matching Prisma include shape) ─────────────────────────────────
type ProjectBOMStructureRaw = {
  id: string
  projectBOMId: string
  materialId: string
  shortDescription: string | null
  additionalInfo: string | null
  description: string | null
  tag: string | null
  requiredQuantity: number | null
  reservedQuantity: number | null
  issuedQuantity: number | null
  readyForPurchaseDate: Date | null
  createdAt: Date
  createdBy: string
  deleted: boolean
  deletedAt: Date | null
  deletedBy: string | null
  Material: {id: string; name: string | null; beNumber: string; shortDescription: string | null}
  Employee_ProjectBOMStructure_createdByToEmployee: {id: string; firstName: string; lastName: string}
}

type ProjectBOMRaw = {
  id: string
  projectId: string
  parentPart: string | null
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
  Employee_ProjectBOM_createdByToEmployee: {id: string; firstName: string; lastName: string}
  Employee_ProjectBOM_deletedByToEmployee: {id: string; firstName: string; lastName: string} | null
  ProjectBOMStructure: ProjectBOMStructureRaw[]
}

function mapStructure(r: ProjectBOMStructureRaw): MappedProjectBOMStructure {
  return {
    id: r.id,
    projectBOMId: r.projectBOMId,
    materialId: r.materialId,
    materialName: r.Material.name ?? r.Material.shortDescription ?? r.Material.beNumber,
    materialBeNumber: r.Material.beNumber,
    shortDescription: r.shortDescription,
    additionalInfo: r.additionalInfo,
    description: r.description,
    tag: r.tag,
    requiredQuantity: r.requiredQuantity,
    reservedQuantity: r.reservedQuantity,
    issuedQuantity: r.issuedQuantity,
    readyForPurchaseDate: r.readyForPurchaseDate?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    createdBy: r.createdBy,
    createdByName: `${r.Employee_ProjectBOMStructure_createdByToEmployee.firstName} ${r.Employee_ProjectBOMStructure_createdByToEmployee.lastName}`,
    deleted: r.deleted,
    deletedAt: r.deletedAt?.toISOString() ?? null,
    deletedBy: r.deletedBy,
  }
}

export function mapProjectBOM(r: ProjectBOMRaw): MappedProjectBOM {
  const structures = r.ProjectBOMStructure.map(mapStructure)
  return {
    id: r.id,
    projectId: r.projectId,
    parentPart: r.parentPart,
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
  }
}
