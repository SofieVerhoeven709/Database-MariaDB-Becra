import {prismaClient} from '@/dal/prismaClient'

// ─── Certificate Type ─────────────────────────────────────────────────────────

export async function getCertificateTypes() {
  return prismaClient.certificateType.findMany({
    include: {
      Employee: {select: {id: true, firstName: true, lastName: true}},
      Employee_CertificateType_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
    },
    orderBy: {name: 'asc'},
  })
}

// ─── Certificate ──────────────────────────────────────────────────────────────

export async function getCertificates() {
  return prismaClient.certificate.findMany({
    include: {
      Employee: {select: {id: true, firstName: true, lastName: true}},
      Employee_Certificate_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
      CertificateType: {select: {id: true, name: true}},
      Target: {
        select: {
          id: true,
          VisibilityForRole: {include: {RoleLevel: {include: {Role: true, SubRole: true}}}},
        },
      },
    },
    orderBy: {createdAt: 'desc'},
  })
}

export async function getCertificateDetail(id: string) {
  return prismaClient.certificate.findUniqueOrThrow({
    where: {id},
    include: {
      Employee: {select: {id: true, firstName: true, lastName: true}},
      Employee_Certificate_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
      CertificateType: {select: {id: true, name: true}},
      TrainingStandard: {
        select: {
          id: true,
          descriptionShort: true,
          location: true,
          repeat: true,
          certificate: true,
          createdAt: true,
          deleted: true,
        },
      },
      Target: {
        include: {
          VisibilityForRole: {include: {RoleLevel: {include: {Role: true, SubRole: true}}}},
        },
      },
    },
  })
}

// ─── Training Standard ────────────────────────────────────────────────────────

export async function getTrainingStandards() {
  return prismaClient.trainingStandard.findMany({
    include: {
      Employee: {select: {id: true, firstName: true, lastName: true}},
      Employee_TrainingStandard_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
      Certificate: {select: {id: true, descriptionShort: true}},
      Target: {
        select: {
          id: true,
          VisibilityForRole: {include: {RoleLevel: {include: {Role: true, SubRole: true}}}},
        },
      },
    },
    orderBy: {createdAt: 'desc'},
  })
}

export async function getTrainingStandardDetail(id: string) {
  return prismaClient.trainingStandard.findUniqueOrThrow({
    where: {id},
    include: {
      Employee: {select: {id: true, firstName: true, lastName: true}},
      Employee_TrainingStandard_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
      Certificate: {select: {id: true, descriptionShort: true}},
      Training: {
        orderBy: {trainingDate: 'desc'},
        select: {
          id: true,
          trainingNumber: true,
          trainingDate: true,
          closed: true,
          deleted: true,
          createdAt: true,
          Employee: {select: {firstName: true, lastName: true}},
        },
      },
      TrainingDocument: {
        select: {
          id: true,
          documentId: true,
          deleted: true,
          deletedAt: true,
          Employee: {select: {firstName: true, lastName: true}},
        },
      },
      Target: {
        include: {
          VisibilityForRole: {include: {RoleLevel: {include: {Role: true, SubRole: true}}}},
        },
      },
    },
  })
}

// ─── Training ─────────────────────────────────────────────────────────────────

export async function getTrainings() {
  return prismaClient.training.findMany({
    include: {
      Employee: {select: {id: true, firstName: true, lastName: true}},
      Employee_Training_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
      TrainingStandard: {select: {id: true, descriptionShort: true}},
      WorkOrder: {select: {id: true, workOrderNumber: true}},
      Target: {
        select: {
          id: true,
          VisibilityForRole: {include: {RoleLevel: {include: {Role: true, SubRole: true}}}},
        },
      },
    },
    orderBy: {trainingDate: 'desc'},
  })
}

export async function getTrainingDetail(id: string) {
  return prismaClient.training.findUniqueOrThrow({
    where: {id},
    include: {
      Employee: {select: {id: true, firstName: true, lastName: true}},
      Employee_Training_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
      WorkOrder: {select: {id: true, workOrderNumber: true}},
      TrainingStandard: {
        select: {
          id: true,
          description: true,
          descriptionShort: true,
          location: true,
          certificate: true,
          repeat: true,
          Certificate: {select: {descriptionShort: true}},
        },
      },
      TrainingContact: {
        orderBy: {createdAt: 'desc'},
        include: {
          Contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              Function: {select: {name: true}},
              CompanyContact: {
                where: {deleted: false},
                select: {endDate: true, Company: {select: {name: true}}},
              },
            },
          },
          Employee: {select: {firstName: true, lastName: true}},
          Employee_TrainingContact_deletedByToEmployee: {select: {firstName: true, lastName: true}},
        },
      },
      Target: {
        include: {
          VisibilityForRole: {include: {RoleLevel: {include: {Role: true, SubRole: true}}}},
        },
      },
    },
  })
}
