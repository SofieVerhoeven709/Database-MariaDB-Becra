import type {Project, Company, ProjectType} from '@/generated/prisma/client'
import type {MappedProject} from '@/types/project'

type ProjectWithRelations = Project & {
  Company: Company
  ProjectType: ProjectType
}

export function mapProject(p: ProjectWithRelations): MappedProject {
  return {
    id: p.id,
    projectNumber: p.projectNumber,
    projectName: p.projectName,
    description: p.description,
    extraInfo: p.extraInfo,
    startDate: p.startDate?.toISOString() ?? null,
    endDate: p.endDate?.toISOString() ?? null,
    closingDate: p.closingDate?.toISOString() ?? null,
    engineeringStartDate: p.engineeringStartDate?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    isMainProject: p.isMainProject,
    isIntern: p.isIntern,
    isOpen: p.isOpen,
    isClosed: p.isClosed,
    createdBy: p.createdBy,
    companyId: p.companyId,
    companyName: p.Company.name,
    projectTypeId: p.projectTypeId,
    projectTypeName: p.ProjectType.name,
    parentProjectId: p.parentProjectId,
    deleted: p.deleted,
    deletedAt: p.deletedAt?.toISOString() ?? null,
    deletedBy: p.deletedBy,
  }
}
