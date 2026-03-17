import type {Prisma} from '@/generated/prisma/client'
import type {
  MappedCertificateType,
  MappedCertificate,
  CertificateDetailData,
  MappedTrainingStandard,
  TrainingStandardDetailData,
  MappedTraining,
  TrainingDetailData,
  MappedTrainingContact,
} from '@/types/training'
import {mapVisibility} from '@/extra/visibilityForRole'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCurrentCompanyName(links: {endDate: Date | null; Company: {name: string}}[]): string | null {
  const now = new Date()
  return links.find(cc => cc.endDate === null || cc.endDate > now)?.Company.name ?? null
}

// ─── Certificate Type ─────────────────────────────────────────────────────────

type CertificateTypeWithRelations = Prisma.CertificateTypeGetPayload<{
  include: {
    Employee: {select: {id: true; firstName: true; lastName: true}}
    Employee_CertificateType_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
  }
}>

export function mapCertificateType(c: CertificateTypeWithRelations): MappedCertificateType {
  return {
    id: c.id,
    name: c.name,
    createdAt: c.createdAt.toISOString(),
    createdByName: `${c.Employee.firstName} ${c.Employee.lastName}`,
    deleted: c.deleted,
    deletedAt: c.deletedAt?.toISOString() ?? null,
    deletedByName: c.Employee_CertificateType_deletedByToEmployee
      ? `${c.Employee_CertificateType_deletedByToEmployee.firstName} ${c.Employee_CertificateType_deletedByToEmployee.lastName}`
      : null,
  }
}

// ─── Certificate ──────────────────────────────────────────────────────────────

type CertificateWithRelations = Prisma.CertificateGetPayload<{
  include: {
    Employee: {select: {id: true; firstName: true; lastName: true}}
    Employee_Certificate_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    CertificateType: {select: {id: true; name: true}}
    Target: {
      select: {
        id: true
        VisibilityForRole: {include: {RoleLevel: {include: {Role: true; SubRole: true}}}}
      }
    }
  }
}>

export function mapCertificate(c: CertificateWithRelations): MappedCertificate {
  return {
    id: c.id,
    description: c.description,
    descriptionShort: c.descriptionShort,
    createdAt: c.createdAt.toISOString(),
    createdByName: `${c.Employee.firstName} ${c.Employee.lastName}`,
    certificateTypeId: c.certificateTypeId,
    certificateTypeName: c.CertificateType.name,
    targetId: c.Target.id,
    deleted: c.deleted,
    deletedAt: c.deletedAt?.toISOString() ?? null,
    deletedByName: c.Employee_Certificate_deletedByToEmployee
      ? `${c.Employee_Certificate_deletedByToEmployee.firstName} ${c.Employee_Certificate_deletedByToEmployee.lastName}`
      : null,
    visibilityForRoles: c.Target.VisibilityForRole.map(mapVisibility),
  }
}

type CertificateDetailPayload = Prisma.CertificateGetPayload<{
  include: {
    Employee: {select: {id: true; firstName: true; lastName: true}}
    Employee_Certificate_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    CertificateType: {select: {id: true; name: true}}
    TrainingStandard: {
      select: {
        id: true
        descriptionShort: true
        location: true
        repeat: true
        certificate: true
        createdAt: true
        deleted: true
      }
    }
    Target: {
      include: {VisibilityForRole: {include: {RoleLevel: {include: {Role: true; SubRole: true}}}}}
    }
  }
}>

export function mapCertificateDetail(c: CertificateDetailPayload): CertificateDetailData {
  return {
    ...mapCertificate(c as CertificateWithRelations),
    trainingStandards: c.TrainingStandard.map(ts => ({
      id: ts.id,
      descriptionShort: ts.descriptionShort,
      location: ts.location,
      repeat: ts.repeat,
      certificate: ts.certificate,
      createdAt: ts.createdAt.toISOString(),
      deleted: ts.deleted,
    })),
  }
}

// ─── Training Standard ────────────────────────────────────────────────────────

type TrainingStandardWithRelations = Prisma.TrainingStandardGetPayload<{
  include: {
    Employee: {select: {id: true; firstName: true; lastName: true}}
    Employee_TrainingStandard_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Certificate: {select: {id: true; descriptionShort: true}}
    Target: {
      select: {
        id: true
        VisibilityForRole: {include: {RoleLevel: {include: {Role: true; SubRole: true}}}}
      }
    }
  }
}>

export function mapTrainingStandard(ts: TrainingStandardWithRelations): MappedTrainingStandard {
  return {
    id: ts.id,
    description: ts.description,
    descriptionShort: ts.descriptionShort,
    location: ts.location,
    certificate: ts.certificate,
    repeat: ts.repeat,
    createdAt: ts.createdAt.toISOString(),
    createdByName: `${ts.Employee.firstName} ${ts.Employee.lastName}`,
    certificateId: ts.certificateId,
    certificateName: ts.Certificate.descriptionShort ?? null,
    targetId: ts.Target.id,
    deleted: ts.deleted,
    deletedAt: ts.deletedAt?.toISOString() ?? null,
    deletedByName: ts.Employee_TrainingStandard_deletedByToEmployee
      ? `${ts.Employee_TrainingStandard_deletedByToEmployee.firstName} ${ts.Employee_TrainingStandard_deletedByToEmployee.lastName}`
      : null,
    visibilityForRoles: ts.Target.VisibilityForRole.map(mapVisibility),
  }
}

type TrainingStandardDetailPayload = Prisma.TrainingStandardGetPayload<{
  include: {
    Employee: {select: {id: true; firstName: true; lastName: true}}
    Employee_TrainingStandard_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    Certificate: {select: {id: true; descriptionShort: true}}
    Training: {
      select: {
        id: true
        trainingNumber: true
        trainingDate: true
        closed: true
        deleted: true
        createdAt: true
        Employee: {select: {firstName: true; lastName: true}}
      }
    }
    TrainingDocument: {
      select: {
        id: true
        documentId: true
        deleted: true
        deletedAt: true
        Employee: {select: {firstName: true; lastName: true}}
      }
    }
    Target: {
      include: {VisibilityForRole: {include: {RoleLevel: {include: {Role: true; SubRole: true}}}}}
    }
  }
}>

export function mapTrainingStandardDetail(ts: TrainingStandardDetailPayload): TrainingStandardDetailData {
  return {
    ...mapTrainingStandard(ts as TrainingStandardWithRelations),
    trainings: ts.Training.map(t => ({
      id: t.id,
      trainingNumber: t.trainingNumber,
      trainingDate: t.trainingDate.toISOString(),
      closed: t.closed,
      deleted: t.deleted,
      createdAt: t.createdAt.toISOString(),
      createdByName: `${t.Employee.firstName} ${t.Employee.lastName}`,
    })),
    documents: ts.TrainingDocument.map(d => ({
      id: d.id,
      documentId: d.documentId,
      deleted: d.deleted,
      deletedAt: d.deletedAt?.toISOString() ?? null,
      deletedByName: d.Employee ? `${d.Employee.firstName} ${d.Employee.lastName}` : null,
    })),
  }
}

// ─── Training ─────────────────────────────────────────────────────────────────

type TrainingWithRelations = Prisma.TrainingGetPayload<{
  include: {
    Employee: {select: {id: true; firstName: true; lastName: true}}
    Employee_Training_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    TrainingStandard: {select: {id: true; descriptionShort: true}}
    WorkOrder: {select: {id: true; workOrderNumber: true}}
    Target: {
      select: {
        id: true
        VisibilityForRole: {include: {RoleLevel: {include: {Role: true; SubRole: true}}}}
      }
    }
  }
}>

export function mapTraining(t: TrainingWithRelations): MappedTraining {
  return {
    id: t.id,
    trainingNumber: t.trainingNumber,
    trainingDate: t.trainingDate.toISOString(),
    closed: t.closed,
    createdAt: t.createdAt.toISOString(),
    createdByName: `${t.Employee.firstName} ${t.Employee.lastName}`,
    workOrderId: t.workOrderId,
    workOrderNumber: t.WorkOrder.workOrderNumber ?? null,
    trainingStandardId: t.trainingStandardId,
    trainingStandardDescriptionShort: t.TrainingStandard.descriptionShort ?? null,
    targetId: t.Target.id,
    deleted: t.deleted,
    deletedAt: t.deletedAt?.toISOString() ?? null,
    deletedByName: t.Employee_Training_deletedByToEmployee
      ? `${t.Employee_Training_deletedByToEmployee.firstName} ${t.Employee_Training_deletedByToEmployee.lastName}`
      : null,
    visibilityForRoles: t.Target.VisibilityForRole.map(mapVisibility),
  }
}

type TrainingDetailPayload = Prisma.TrainingGetPayload<{
  include: {
    Employee: {select: {id: true; firstName: true; lastName: true}}
    Employee_Training_deletedByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    WorkOrder: {select: {id: true; workOrderNumber: true}}
    TrainingStandard: {
      select: {
        id: true
        description: true
        descriptionShort: true
        location: true
        certificate: true
        repeat: true
        Certificate: {select: {descriptionShort: true}}
      }
    }
    TrainingContact: {
      include: {
        Contact: {
          select: {
            id: true
            firstName: true
            lastName: true
            Function: {select: {name: true}}
            CompanyContact: {
              where: {deleted: false}
              select: {endDate: true; Company: {select: {name: true}}}
            }
          }
        }
        Employee: {select: {firstName: true; lastName: true}}
        Employee_TrainingContact_deletedByToEmployee: {select: {firstName: true; lastName: true}}
      }
    }
    Target: {
      include: {VisibilityForRole: {include: {RoleLevel: {include: {Role: true; SubRole: true}}}}}
    }
  }
}>

function mapTrainingContact(tc: TrainingDetailPayload['TrainingContact'][number]): MappedTrainingContact {
  return {
    id: tc.id,
    clientNumber: tc.clientNumber,
    succeeded: tc.succeeded,
    attended: tc.attended,
    certificateSent: tc.certificateSent,
    certSentDate: tc.certSentDate?.toISOString() ?? null,
    createdAt: tc.createdAt.toISOString(),
    createdByName: `${tc.Employee.firstName} ${tc.Employee.lastName}`,
    deleted: tc.deleted,
    deletedAt: tc.deletedAt?.toISOString() ?? null,
    deletedByName: tc.Employee_TrainingContact_deletedByToEmployee
      ? `${tc.Employee_TrainingContact_deletedByToEmployee.firstName} ${tc.Employee_TrainingContact_deletedByToEmployee.lastName}`
      : null,
    contact: {
      id: tc.Contact.id,
      firstName: tc.Contact.firstName,
      lastName: tc.Contact.lastName,
      functionName: tc.Contact.Function?.name ?? null,
      currentCompanyName: getCurrentCompanyName(tc.Contact.CompanyContact),
    },
  }
}

export function mapTrainingDetail(t: TrainingDetailPayload): TrainingDetailData {
  return {
    ...mapTraining(t as TrainingWithRelations),
    trainingStandard: {
      id: t.TrainingStandard.id,
      description: t.TrainingStandard.description,
      descriptionShort: t.TrainingStandard.descriptionShort,
      location: t.TrainingStandard.location,
      certificate: t.TrainingStandard.certificate,
      repeat: t.TrainingStandard.repeat,
      certificateName: t.TrainingStandard.Certificate.descriptionShort ?? null,
    },
    contacts: t.TrainingContact.map(mapTrainingContact),
  }
}
