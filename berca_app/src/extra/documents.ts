import type {Prisma} from '@/generated/prisma/client'
import type {
  MappedDocument,
  DocumentDetailData,
  MappedDocumentRevision,
  MappedDocumentGroup,
  MappedDocumentGroupA,
  MappedDocumentGroupB,
  MappedDocumentGroupC,
  MappedDocumentGroupD,
  MappedDocumentPlace,
  MappedDocumentStatus,
} from '@/types/document'
import {mapVisibility} from '@/extra/visibilityForRole'

// ─── Prisma payload types ─────────────────────────────────────────────────────

const employeeSelect = {select: {id: true, firstName: true, lastName: true}} as const

export type DocumentListPayload = Prisma.DocumentStructureGetPayload<{
  include: {
    Employee_DocumentStructure_createdByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_DocumentStructure_revisedByIdToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_DocumentStructure_managedByIdToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_DocumentStructure_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    DocumentGroup: {
      include: {
        DocumentGroupA: {select: {id: true; name: true}}
        DocumentGroupB: {select: {id: true; name: true}}
        DocumentGroupC: {select: {id: true; name: true}}
        DocumentGroupD: {select: {id: true; name: true}}
      }
    }
    DocumentPlace: {select: {id: true; headFolder: true; subFolder: true}}
    DocumentStatus: {select: {id: true; name: true}}
    DocumentStructure: {select: {id: true, documentNumber: true}}
    DocumentStructureTarget: {
      include: {
        Target: {
          select: {
            id: true
            TargetType: {select: {name: true}}
            Material: {select: {name: true}}
            Project: {select: {projectName: true}}
            Company: {select: {name: true}}
          }
        }
      }
    }
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

export type DocumentDetailPayload = Prisma.DocumentStructureGetPayload<{
  include: {
    Employee_DocumentStructure_createdByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_DocumentStructure_revisedByIdToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_DocumentStructure_managedByIdToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_DocumentStructure_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    DocumentGroup: {
      include: {
        DocumentGroupA: {select: {id: true; name: true}}
        DocumentGroupB: {select: {id: true; name: true}}
        DocumentGroupC: {select: {id: true; name: true}}
        DocumentGroupD: {select: {id: true; name: true}}
      }
    }
    DocumentPlace: {select: {id: true; headFolder: true; subFolder: true}}
    DocumentStatus: {select: {id: true; name: true}}
    DocumentStructure: {select: {id: true, documentNumber: true}}
    DocumentStructureTarget: {
      take: 1
      include: {
        Target: {
          select: {
            id: true
            TargetType: {select: {name: true}}
          }
        }
      }
    }
    Target: {
      include: {
        VisibilityForRole: {
          include: {RoleLevel: {include: {Role: true; SubRole: true}}}
        }
      }
    }
    DocumentRevision: {
      where: {deleted: false}
      orderBy: {createdAt: 'desc'}
      include: {
        Employee_DocumentRevision_createdByToEmployee: {select: {id: true; firstName: true; lastName: true}}
        Employee_DocumentRevision_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
      }
    }
  }
}>

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
  }
}>

export type DocumentGroupCPayload = Prisma.DocumentGroupCGetPayload<{
  include: {
    Employee_DocumentGroupC_createdByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_DocumentGroupC_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
  }
}>

export type DocumentGroupDPayload = Prisma.DocumentGroupDGetPayload<{
  include: {
    Employee_DocumentGroupD_createdByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_DocumentGroupD_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
  }
}>

export type DocumentPlacePayload = Prisma.DocumentPlaceGetPayload<{
  include: {
    Employee_DocumentPlace_createdByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee: {select: {id: true; firstName: true; lastName: true}}
  }
}>

export type DocumentStatusPayload = Prisma.DocumentStatusGetPayload<{
  include: {
    Employee_DocumentStatus_createdByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Employee_DocumentStatus_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
  }
}>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function placeLabel(headFolder: string, subFolder: string | null): string {
  // Build a single label for display in dropdowns/tables.
  return subFolder ? `${headFolder} / ${subFolder}` : headFolder
}

function buildGroupLabel(a: string | null, b: string | null, c: string | null, d: string | null): string {
  // Show a compact A › B › C › D path, falling back to a dash.
  return [a, b, c, d].filter(Boolean).join(' › ') || '—'
}

function mapDocumentGroup(g: DocumentListPayload['DocumentGroup']): MappedDocumentGroup | null {
  if (!g) return null
  return {
    id: g.id,
    groupAId: g.groupAId,
    groupAName: g.DocumentGroupA?.name ?? null,
    groupBId: g.groupBId,
    groupBName: g.DocumentGroupB?.name ?? null,
    groupCId: g.groupCId,
    groupCName: g.DocumentGroupC?.name ?? null,
    groupDId: g.groupDId,
    groupDName: g.DocumentGroupD?.name ?? null,
    label: buildGroupLabel(
      g.DocumentGroupA?.name ?? null,
      g.DocumentGroupB?.name ?? null,
      g.DocumentGroupC?.name ?? null,
      g.DocumentGroupD?.name ?? null,
    ),
  }
}

// ─── Document mapper ──────────────────────────────────────────────────────────

export function mapDocument(d: DocumentListPayload): MappedDocument {
  const deletedBy = d.Employee_DocumentStructure_deletedByToEmployee
  const docTarget = d.DocumentStructureTarget[0] ?? null

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
    canCopy: d.canCopy,
    additionalInfo: d.additionalInfo ?? null,
    referenceDocId: d.referenceDocId ?? null,
    referenceDocNumber: d.DocumentStructure?.documentNumber ?? null,
    documentGroupId: d.documentGroupId ?? null,
    documentGroup: mapDocumentGroup(d.DocumentGroup),
    documentPlaceId: d.documentPlaceId ?? null,
    documentPlaceLabel: placeLabel(d.DocumentPlace!.headFolder, d.DocumentPlace!.subFolder),
    documentStatusId: d.documentStatusId ?? null,
    documentStatusName: d.DocumentStatus?.name ?? null,
    createdBy: d.createdBy,
    createdByName: `${d.Employee_DocumentStructure_createdByToEmployee.firstName} ${d.Employee_DocumentStructure_createdByToEmployee.lastName}`,
    revisedById: d.revisedById ?? null,
    revisedByName: d.Employee_DocumentStructure_revisedByIdToEmployee
      ? `${d.Employee_DocumentStructure_revisedByIdToEmployee.firstName} ${d.Employee_DocumentStructure_revisedByIdToEmployee.lastName}`
      : null,
    managedById: d.managedById ?? null,
    managedByName: d.Employee_DocumentStructure_managedByIdToEmployee
      ? `${d.Employee_DocumentStructure_managedByIdToEmployee.firstName} ${d.Employee_DocumentStructure_managedByIdToEmployee.lastName}`
      : null,
    documentTargetId: docTarget?.id ?? null,
    documentTargetTargetId: docTarget?.Target.id ?? null,
    documentTargetTypeName: docTarget?.Target.TargetType.name ?? null,
    documentStructureTargets: d.DocumentStructureTarget.map(t => ({
      targetTypeName: t.Target.TargetType.name,
      // Prefer the first populated related entity name for display.
      targetDisplayName:
        t.Target.Material[0]?.name ?? t.Target.Project[0]?.projectName ?? t.Target.Company[0]?.name ?? null,
    })),
    targetId: d.Target.id,
    visibilityForRoles: d.Target.VisibilityForRole.map(mapVisibility),
    deleted: d.deleted,
    deletedAt: d.deletedAt?.toISOString() ?? null,
    deletedBy: d.deletedBy ?? null,
    deletedByName: deletedBy ? `${deletedBy.firstName} ${deletedBy.lastName}` : null,
  }
}

// ─── Detail mapper ────────────────────────────────────────────────────────────

function mapRevision(r: DocumentDetailPayload['DocumentRevision'][number]): MappedDocumentRevision {
  const del = r.Employee_DocumentRevision_deletedByToEmployee
  return {
    id: r.id,
    documentId: r.documentId,
    shortDescription: r.shortDescription ?? null,
    longDescription: r.longDescription ?? null,
    createdAt: r.createdAt.toISOString(),
    createdBy: r.createdBy,
    createdByName: `${r.Employee_DocumentRevision_createdByToEmployee.firstName} ${r.Employee_DocumentRevision_createdByToEmployee.lastName}`,
    deleted: r.deleted,
    deletedAt: r.deletedAt?.toISOString() ?? null,
    deletedBy: r.deletedBy ?? null,
    deletedByName: del ? `${del.firstName} ${del.lastName}` : null,
  }
}

export function mapDocumentDetail(
  d: DocumentDetailPayload,
  targetDisplayNames?: {id: string; targetId: string; targetTypeName: string; targetDisplayName: string | null}[],
): DocumentDetailData {
  const base = mapDocument(d as unknown as DocumentListPayload)
  return {
    ...base,
    revisions: d.DocumentRevision.map(mapRevision),
    // Allow the caller to provide pre-resolved display names (e.g., from a separate query).
    documentStructureTargets:
      targetDisplayNames ??
      d.DocumentStructureTarget.map(t => ({
        id: t.id,
        targetId: t.Target.id,
        targetTypeName: t.Target.TargetType.name,
        targetDisplayName: null,
      })),
  }
}

// ─── Group A–D mappers ────────────────────────────────────────────────────────

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

export function mapDocumentGroupB(g: DocumentGroupBPayload): MappedDocumentGroupB {
  const del = g.Employee_DocumentGroupB_deletedByToEmployee
  return {
    id: g.id,
    name: g.name,
    createdAt: g.createdAt.toISOString(),
    createdBy: g.createdBy,
    createdByName: `${g.Employee_DocumentGroupB_createdByToEmployee.firstName} ${g.Employee_DocumentGroupB_createdByToEmployee.lastName}`,
    deleted: g.deleted,
    deletedAt: g.deletedAt?.toISOString() ?? null,
    deletedBy: g.deletedBy ?? null,
    deletedByName: del ? `${del.firstName} ${del.lastName}` : null,
  }
}

export function mapDocumentGroupC(g: DocumentGroupCPayload): MappedDocumentGroupC {
  const del = g.Employee_DocumentGroupC_deletedByToEmployee
  return {
    id: g.id,
    name: g.name,
    createdAt: g.createdAt.toISOString(),
    createdBy: g.createdBy,
    createdByName: `${g.Employee_DocumentGroupC_createdByToEmployee.firstName} ${g.Employee_DocumentGroupC_createdByToEmployee.lastName}`,
    deleted: g.deleted,
    deletedAt: g.deletedAt?.toISOString() ?? null,
    deletedBy: g.deletedBy ?? null,
    deletedByName: del ? `${del.firstName} ${del.lastName}` : null,
  }
}

export function mapDocumentGroupD(g: DocumentGroupDPayload): MappedDocumentGroupD {
  const del = g.Employee_DocumentGroupD_deletedByToEmployee
  return {
    id: g.id,
    name: g.name,
    createdAt: g.createdAt.toISOString(),
    createdBy: g.createdBy,
    createdByName: `${g.Employee_DocumentGroupD_createdByToEmployee.firstName} ${g.Employee_DocumentGroupD_createdByToEmployee.lastName}`,
    deleted: g.deleted,
    deletedAt: g.deletedAt?.toISOString() ?? null,
    deletedBy: g.deletedBy ?? null,
    deletedByName: del ? `${del.firstName} ${del.lastName}` : null,
  }
}

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

export function mapDocumentStatus(s: DocumentStatusPayload): MappedDocumentStatus {
  const del = s.Employee_DocumentStatus_deletedByToEmployee
  return {
    id: s.id,
    name: s.name,
    createdAt: s.createdAt.toISOString(),
    createdBy: s.createdBy,
    createdByName: `${s.Employee_DocumentStatus_createdByToEmployee.firstName} ${s.Employee_DocumentStatus_createdByToEmployee.lastName}`,
    deleted: s.deleted,
    deletedAt: s.deletedAt?.toISOString() ?? null,
    deletedBy: s.deletedBy ?? null,
    deletedByName: del ? `${del.firstName} ${del.lastName}` : null,
  }
}
