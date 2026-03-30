import type {Prisma} from '@/generated/prisma/client'
import type {
  MappedDocument,
  DocumentDetailData,
  MappedDocumentGroupA,
  MappedDocumentGroupB,
  MappedDocumentGroupC,
  MappedDocumentGroupD,
  MappedDocumentPlace,
} from '@/types/document'
import {mapVisibility} from '@/extra/visibilityForRole'

// ─── Prisma payload types ─────────────────────────────────────────────────────

export type DocumentListPayload = Prisma.DocumentStructureGetPayload<{
  include: {
    Employee_DocumentStructure_createdByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_DocumentStructure_revisedByIdToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_DocumentStructure_managedByIdToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_DocumentStructure_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    DocumentGroupA: {select: {id: true; name: true}}
    DocumentGroupB: {select: {id: true; name: true}}
    DocumentGroupC: {select: {id: true; name: true}}
    DocumentGroupD: {select: {id: true; name: true}}
    DocumentPlace: {select: {id: true; headFolder: true; subFolder: true}}
    Role: {select: {id: true; name: true}}
    DocumentStructure: {select: {id: true; documentNumber: true}}
    Target: {
      select: {
        id: true
        VisibilityForRole: {
          include: {RoleLevel: {include: {Role: true; SubRole: true}}}
        }
      }
    }
  }
}>

export type DocumentDetailPayload = DocumentListPayload

// ─── Group payload types ──────────────────────────────────────────────────────

export type DocumentGroupAPayload = Prisma.DocumentGroupAGetPayload<{
  include: {
    Employee_DocumentGroupA_createdByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_DocumentGroupA_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
  }
}>

export type DocumentGroupBPayload = Prisma.DocumentGroupBGetPayload<{
  include: {
    Employee_DocumentGroupB_createdByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_DocumentGroupB_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    DocumentGroupA: {select: {id: true; name: true}}
  }
}>

export type DocumentGroupCPayload = Prisma.DocumentGroupCGetPayload<{
  include: {
    Employee_DocumentGroupC_createdByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_DocumentGroupC_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    DocumentGroupB: {select: {id: true; name: true}}
  }
}>

export type DocumentGroupDPayload = Prisma.DocumentGroupDGetPayload<{
  include: {
    Employee_DocumentGroupD_createdByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_DocumentGroupD_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    DocumentGroupC: {select: {id: true; name: true}}
  }
}>

export type DocumentPlacePayload = Prisma.DocumentPlaceGetPayload<{
  include: {
    Employee_DocumentPlace_createdByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee: {select: {id: true; firstName: true; lastName: true}}
  }
}>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function placeLabel(headFolder: string, subFolder: string | null): string {
  return subFolder ? `${headFolder} / ${subFolder}` : headFolder
}

// ─── Document mapper ──────────────────────────────────────────────────────────

export function mapDocument(d: DocumentListPayload): MappedDocument {
  const deletedBy = d.Employee_DocumentStructure_deletedByToEmployee

  return {
    id: d.id,
    documentNumber: d.documentNumber,
    description: d.description ?? null,
    descriptionShort: d.descriptionShort,
    createdAt: d.createdAt.toISOString(),
    expiryDate: d.expiryDate?.toISOString() ?? null,
    revisionNumber: d.revisionNumber ?? null,
    revisionDetail: d.revisionDetail ?? null,
    valid: d.valid,
    process: d.process,
    additionalInfo: d.additionalInfo ?? null,
    referenceDocId: d.referenceDocId ?? null,
    referenceDocNumber: d.DocumentStructure?.documentNumber ?? null,
    roleId: d.roleId ?? null,
    roleName: d.Role?.name ?? null,
    documentGroupAId: d.documentGroupAId,
    documentGroupAName: d.DocumentGroupA.name,
    documentGroupBId: d.documentGroupBId ?? null,
    documentGroupBName: d.DocumentGroupB?.name ?? null,
    documentGroupCId: d.documentGroupCId ?? null,
    documentGroupCName: d.DocumentGroupC?.name ?? null,
    documentGroupDId: d.documentGroupDId ?? null,
    documentGroupDName: d.DocumentGroupD?.name ?? null,
    documentPlaceId: d.documentPlaceId,
    documentPlaceLabel: placeLabel(d.DocumentPlace.headFolder, d.DocumentPlace.subFolder),
    createdBy: d.createdBy,
    createdByName: `${d.Employee_DocumentStructure_createdByToEmployee.firstName} ${d.Employee_DocumentStructure_createdByToEmployee.lastName}`,
    revisedById: d.revisedById,
    revisedByName: `${d.Employee_DocumentStructure_revisedByIdToEmployee.firstName} ${d.Employee_DocumentStructure_revisedByIdToEmployee.lastName}`,
    managedById: d.managedById,
    managedByName: `${d.Employee_DocumentStructure_managedByIdToEmployee.firstName} ${d.Employee_DocumentStructure_managedByIdToEmployee.lastName}`,
    targetId: d.Target.id,
    visibilityForRoles: d.Target.VisibilityForRole.map(mapVisibility),
    deleted: d.deleted,
    deletedAt: d.deletedAt?.toISOString() ?? null,
    deletedBy: d.deletedBy ?? null,
    deletedByName: deletedBy ? `${deletedBy.firstName} ${deletedBy.lastName}` : null,
  }
}

export function mapDocumentDetail(d: DocumentDetailPayload): DocumentDetailData {
  return mapDocument(d)
}

// ─── Group A mapper ───────────────────────────────────────────────────────────

export function mapDocumentGroupA(g: DocumentGroupAPayload): MappedDocumentGroupA {
  const del = g.Employee_DocumentGroupA_deletedByToEmployee
  return {
    id: g.id,
    name: g.name,
    createdAt: g.createdAt.toISOString(),
    createdBy: g.createdBy,
    createdByName: `${g.Employee_DocumentGroupA_createdByToEmployee.firstName} ${g.Employee_DocumentGroupA_createdByToEmployee.lastName}`,
    deleted: g.deleted,
    deletedAt: g.deletedAt?.toISOString() ?? null,
    deletedBy: g.deletedBy ?? null,
    deletedByName: del ? `${del.firstName} ${del.lastName}` : null,
  }
}

// ─── Group B mapper ───────────────────────────────────────────────────────────

export function mapDocumentGroupB(g: DocumentGroupBPayload): MappedDocumentGroupB {
  const del = g.Employee_DocumentGroupB_deletedByToEmployee
  return {
    id: g.id,
    name: g.name,
    documentGroupAId: g.documentGroupAId,
    documentGroupAName: g.DocumentGroupA.name,
    createdAt: g.createdAt.toISOString(),
    createdBy: g.createdBy,
    createdByName: `${g.Employee_DocumentGroupB_createdByToEmployee.firstName} ${g.Employee_DocumentGroupB_createdByToEmployee.lastName}`,
    deleted: g.deleted,
    deletedAt: g.deletedAt?.toISOString() ?? null,
    deletedBy: g.deletedBy ?? null,
    deletedByName: del ? `${del.firstName} ${del.lastName}` : null,
  }
}

// ─── Group C mapper ───────────────────────────────────────────────────────────

export function mapDocumentGroupC(g: DocumentGroupCPayload): MappedDocumentGroupC {
  const del = g.Employee_DocumentGroupC_deletedByToEmployee
  return {
    id: g.id,
    name: g.name,
    documentGroupBId: g.documentGroupBId,
    documentGroupBName: g.DocumentGroupB.name,
    createdAt: g.createdAt.toISOString(),
    createdBy: g.createdBy,
    createdByName: `${g.Employee_DocumentGroupC_createdByToEmployee.firstName} ${g.Employee_DocumentGroupC_createdByToEmployee.lastName}`,
    deleted: g.deleted,
    deletedAt: g.deletedAt?.toISOString() ?? null,
    deletedBy: g.deletedBy ?? null,
    deletedByName: del ? `${del.firstName} ${del.lastName}` : null,
  }
}

// ─── Group D mapper ───────────────────────────────────────────────────────────

export function mapDocumentGroupD(g: DocumentGroupDPayload): MappedDocumentGroupD {
  const del = g.Employee_DocumentGroupD_deletedByToEmployee
  return {
    id: g.id,
    name: g.name,
    documentGroupCId: g.documentGroupCId,
    documentGroupCName: g.DocumentGroupC.name,
    createdAt: g.createdAt.toISOString(),
    createdBy: g.createdBy,
    createdByName: `${g.Employee_DocumentGroupD_createdByToEmployee.firstName} ${g.Employee_DocumentGroupD_createdByToEmployee.lastName}`,
    deleted: g.deleted,
    deletedAt: g.deletedAt?.toISOString() ?? null,
    deletedBy: g.deletedBy ?? null,
    deletedByName: del ? `${del.firstName} ${del.lastName}` : null,
  }
}

// ─── Place mapper ─────────────────────────────────────────────────────────────

export function mapDocumentPlace(p: DocumentPlacePayload): MappedDocumentPlace {
  const del = p.Employee
  return {
    id: p.id,
    headFolder: p.headFolder,
    subFolder: p.subFolder ?? null,
    label: placeLabel(p.headFolder, p.subFolder),
    createdAt: p.createdAt.toISOString(),
    createdBy: p.createdBy,
    createdByName: `${p.Employee_DocumentPlace_createdByToEmployee.firstName} ${p.Employee_DocumentPlace_createdByToEmployee.lastName}`,
    deleted: p.deleted,
    deletedAt: p.deletedAt?.toISOString() ?? null,
    deletedBy: p.deletedBy ?? null,
    deletedByName: del ? `${del.firstName} ${del.lastName}` : null,
  }
}
