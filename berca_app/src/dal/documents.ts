import {prismaClient} from '@/dal/prismaClient'

// ─── Shared selects ───────────────────────────────────────────────────────────

const employeeSelect = {select: {id: true, firstName: true, lastName: true}} as const

const visibilityInclude = {
  include: {
    RoleLevel: {include: {Role: true, SubRole: true}},
  },
} as const

// ─── Document includes ────────────────────────────────────────────────────────

const documentListInclude = {
  Employee_DocumentStructure_createdByToEmployee: employeeSelect,
  Employee_DocumentStructure_revisedByIdToEmployee: employeeSelect,
  Employee_DocumentStructure_managedByIdToEmployee: employeeSelect,
  Employee_DocumentStructure_deletedByToEmployee: employeeSelect,
  DocumentGroupA: {select: {id: true, name: true}},
  DocumentGroupB: {select: {id: true, name: true}},
  DocumentGroupC: {select: {id: true, name: true}},
  DocumentGroupD: {select: {id: true, name: true}},
  DocumentPlace: {select: {id: true, headFolder: true, subFolder: true}},
  Role: {select: {id: true, name: true}},
  DocumentStructure: {select: {id: true, documentNumber: true}},
  Target: {
    select: {
      id: true,
      VisibilityForRole: visibilityInclude,
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
    include: documentListInclude,
  })
}

// ─── Group A queries ──────────────────────────────────────────────────────────

const groupAInclude = {
  Employee_DocumentGroupA_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  Employee_DocumentGroupA_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
} as const

export async function getDocumentGroupAs() {
  return prismaClient.documentGroupA.findMany({
    include: groupAInclude,
    orderBy: {name: 'asc'},
  })
}

// ─── Group B queries ──────────────────────────────────────────────────────────

const groupBInclude = {
  Employee_DocumentGroupB_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  Employee_DocumentGroupB_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  DocumentGroupA: {select: {id: true, name: true}},
} as const

export async function getDocumentGroupBs() {
  return prismaClient.documentGroupB.findMany({
    include: groupBInclude,
    orderBy: {name: 'asc'},
  })
}

// ─── Group C queries ──────────────────────────────────────────────────────────

const groupCInclude = {
  Employee_DocumentGroupC_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  Employee_DocumentGroupC_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  DocumentGroupB: {select: {id: true, name: true}},
} as const

export async function getDocumentGroupCs() {
  return prismaClient.documentGroupC.findMany({
    include: groupCInclude,
    orderBy: {name: 'asc'},
  })
}

// ─── Group D queries ──────────────────────────────────────────────────────────

const groupDInclude = {
  Employee_DocumentGroupD_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  Employee_DocumentGroupD_deletedByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  DocumentGroupC: {select: {id: true, name: true}},
} as const

export async function getDocumentGroupDs() {
  return prismaClient.documentGroupD.findMany({
    include: groupDInclude,
    orderBy: {name: 'asc'},
  })
}

// ─── Place queries ────────────────────────────────────────────────────────────

const placeInclude = {
  Employee_DocumentPlace_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
  Employee: {select: {id: true, firstName: true, lastName: true}},
} as const

export async function getDocumentPlaces() {
  return prismaClient.documentPlace.findMany({
    include: placeInclude,
    orderBy: [{headFolder: 'asc'}, {subFolder: 'asc'}],
  })
}

const groupInclude = {
  DocumentGroupA: {select: {id: true, name: true}},
  DocumentGroupB: {select: {id: true, name: true}},
  DocumentGroupC: {select: {id: true, name: true}},
  DocumentGroupD: {select: {id: true, name: true}},
} as const

export async function getDocumentGroups() {
  return prismaClient.documentGroup.findMany({
    include: groupInclude,
    orderBy: [
      {DocumentGroupA: {name: 'asc'}},
      {DocumentGroupB: {name: 'asc'}},
      {DocumentGroupC: {name: 'asc'}},
      {DocumentGroupD: {name: 'asc'}},
    ],
  })
}
