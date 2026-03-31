import {prismaClient} from '@/dal/prismaClient'

// ─── Shared includes ──────────────────────────────────────────────────────────

const employeeSelect = {select: {id: true, firstName: true, lastName: true}} as const

const visibilityInclude = {
  include: {RoleLevel: {include: {Role: true, SubRole: true}}},
} as const

const documentGroupInclude = {
  DocumentGroupA: {select: {id: true, name: true}},
  DocumentGroupB: {select: {id: true, name: true}},
  DocumentGroupC: {select: {id: true, name: true}},
  DocumentGroupD: {select: {id: true, name: true}},
} as const

const documentTargetInclude = {
  take: 1,
  include: {
    Target: {
      select: {
        id: true,
        TargetType: {select: {name: true}},
      },
    },
  },
} as const

const documentListInclude = {
  Employee_DocumentStructure_createdByToEmployee: employeeSelect,
  Employee_DocumentStructure_revisedByIdToEmployee: employeeSelect,
  Employee_DocumentStructure_managedByIdToEmployee: employeeSelect,
  Employee_DocumentStructure_deletedByToEmployee: employeeSelect,
  DocumentGroup: {
    include: documentGroupInclude,
  },
  DocumentPlace: {select: {id: true, headFolder: true, subFolder: true}},
  DocumentStatus: {select: {id: true, name: true}},
  DocumentStructure: {select: {id: true, documentNumber: true}},
  DocumentStructureTarget: documentTargetInclude,
  Target: {
    select: {
      id: true,
      VisibilityForRole: visibilityInclude,
    },
  },
} as const

const documentDetailInclude = {
  Employee_DocumentStructure_createdByToEmployee: employeeSelect,
  Employee_DocumentStructure_revisedByIdToEmployee: employeeSelect,
  Employee_DocumentStructure_managedByIdToEmployee: employeeSelect,
  Employee_DocumentStructure_deletedByToEmployee: employeeSelect,
  DocumentGroup: {
    include: documentGroupInclude,
  },
  DocumentPlace: {select: {id: true, headFolder: true, subFolder: true}},
  DocumentStatus: {select: {id: true, name: true}},
  DocumentStructure: {select: {id: true, documentNumber: true}},
  DocumentStructureTarget: documentTargetInclude,
  Target: {
    include: {VisibilityForRole: visibilityInclude},
  },
  DocumentRevision: {
    where: {deleted: false},
    orderBy: {createdAt: 'desc' as const},
    include: {
      Employee_DocumentRevision_createdByToEmployee: employeeSelect,
      Employee_DocumentRevision_deletedByToEmployee: employeeSelect,
    },
  },
} as const

// ─── Document queries ─────────────────────────────────────────────────────────

export async function getDocuments() {
  return prismaClient.documentStructure.findMany({
    include: documentListInclude,
    orderBy: {createdAt: 'desc'},
  })
}

export async function getDocumentDetail(id: string) {
  return prismaClient.documentStructure.findUniqueOrThrow({
    where: {id},
    include: documentDetailInclude,
  })
}

// ─── Group A–D queries ────────────────────────────────────────────────────────

const groupAInclude = {
  Employee_DocumentGroupA_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  Employee_DocumentGroupA_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
} as const

const groupBInclude = {
  Employee_DocumentGroupB_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  Employee_DocumentGroupB_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
} as const

const groupCInclude = {
  Employee_DocumentGroupC_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  Employee_DocumentGroupC_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
} as const

const groupDInclude = {
  Employee_DocumentGroupD_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  Employee_DocumentGroupD_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
} as const

export async function getDocumentGroupAs() {
  return prismaClient.documentGroupA.findMany({include: groupAInclude, orderBy: {name: 'asc'}})
}

export async function getDocumentGroupBs() {
  return prismaClient.documentGroupB.findMany({include: groupBInclude, orderBy: {name: 'asc'}})
}

export async function getDocumentGroupCs() {
  return prismaClient.documentGroupC.findMany({include: groupCInclude, orderBy: {name: 'asc'}})
}

export async function getDocumentGroupDs() {
  return prismaClient.documentGroupD.findMany({include: groupDInclude, orderBy: {name: 'asc'}})
}

// ─── DocumentGroup (junction) queries ─────────────────────────────────────────

export async function getDocumentGroups() {
  return prismaClient.documentGroup.findMany({
    include: documentGroupInclude,
    orderBy: {id: 'asc'},
  })
}

// ─── Place queries ────────────────────────────────────────────────────────────

export async function getDocumentPlaces() {
  return prismaClient.documentPlace.findMany({
    include: {
      Employee_DocumentPlace_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
      Employee: {select: {id: true, firstName: true, lastName: true}},
    },
    orderBy: [{headFolder: 'asc'}, {subFolder: 'asc'}],
  })
}

// ─── Status queries ───────────────────────────────────────────────────────────

export async function getDocumentStatuses() {
  return prismaClient.documentStatus.findMany({
    include: {
      Employee_DocumentStatus_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
      Employee_DocumentStatus_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
    },
    orderBy: {name: 'asc'},
  })
}

// ─── Target options (for the 3 allowed types) ─────────────────────────────────

export async function getDocumentTargetOptions() {
  const [materials, projects, companies] = await Promise.all([
    prismaClient.material.findMany({
      where: {deleted: false},
      orderBy: {name: 'asc'},
      select: {id: true, name: true, targetId: true},
    }),
    prismaClient.project.findMany({
      where: {deleted: false},
      orderBy: {projectName: 'asc'},
      select: {id: true, projectName: true, targetId: true},
    }),
    prismaClient.company.findMany({
      where: {deleted: false},
      orderBy: {name: 'asc'},
      select: {id: true, name: true, targetId: true},
    }),
  ])
  return {
    Material: materials.map(m => ({id: m.targetId, name: m.name ?? '—'})),
    Project: projects.map(p => ({id: p.targetId, name: p.projectName})),
    Company: companies.map(c => ({id: c.targetId, name: c.name})),
  }
}

export async function getDocumentGroupId(aId: string, bId: string, cId: string, dId: string) {
  return prismaClient.documentGroup.findFirstOrThrow({
    where: {
      groupAId: aId,
      groupBId: bId,
      groupCId: cId,
      groupDId: dId,
    },
  })
}
