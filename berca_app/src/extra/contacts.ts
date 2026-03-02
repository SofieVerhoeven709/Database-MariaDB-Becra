import type {Contact, Employee, Function, DepartmentExtern, Title, Prisma} from '@/generated/prisma/client'
import type {
  ContactDetailData,
  MappedContact,
  MappedContactCompany,
  MappedContactFollowUp,
  MappedContactProject,
  MappedContactTraining,
} from '@/types/contact'
import type {VisibilityWithRoleLevel} from '@/extra/visibilityForRole'
import {mapVisibility} from '@/extra/visibilityForRole'

type ContactWithRelations = Contact & {
  Employee: Pick<Employee, 'id' | 'firstName' | 'lastName'>
  Employee_Contact_deletedByToEmployee: Pick<Employee, 'id' | 'firstName' | 'lastName'> | null
  Function: Pick<Function, 'id' | 'name'> | null
  DepartmentExtern: Pick<DepartmentExtern, 'id' | 'name'> | null
  Title: Pick<Title, 'id' | 'name'> | null
  Target: {
    id: string
    VisibilityForRole: VisibilityWithRoleLevel[]
  }
}

export function mapContact(c: ContactWithRelations): MappedContact {
  return {
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    mail1: c.mail1,
    mail2: c.mail2,
    mail3: c.mail3,
    generalPhone: c.generalPhone,
    homePhone: c.homePhone,
    mobilePhone: c.mobilePhone,
    info: c.info,
    birthDate: c.birthDate?.toISOString() ?? null,
    trough: c.trough,
    description: c.description,
    infoCorrect: c.infoCorrect,
    checkInfo: c.checkInfo,
    newYearCard: c.newYearCard,
    active: c.active,
    newsLetter: c.newsLetter,
    mailing: c.mailing,
    trainingAdvice: c.trainingAdvice,
    contactForTrainingAndAdvice: c.contactForTrainingAndAdvice,
    customerTrainingAndAdvice: c.customerTrainingAndAdvice,
    potentialCustomerTrainingAndAdvice: c.potentialCustomerTrainingAndAdvice,
    potentialTeacherTrainingAndAdvice: c.potentialTeacherTrainingAndAdvice,
    teacherTrainingAndAdvice: c.teacherTrainingAndAdvice,
    participantTrainingAndAdvice: c.participantTrainingAndAdvice,
    createdAt: c.createdAt.toISOString(),
    createdBy: c.createdBy,
    createdByName: `${c.Employee.firstName} ${c.Employee.lastName}`,
    functionId: c.functionId,
    functionName: c.Function?.name ?? null,
    departmentExternId: c.departmentExternId,
    departmentExternName: c.DepartmentExtern?.name ?? null,
    titleId: c.titleId,
    titleName: c.Title?.name ?? null,
    businessCardId: c.businessCardId,
    targetId: c.Target.id,
    deleted: c.deleted,
    deletedAt: c.deletedAt?.toISOString() ?? null,
    deletedBy: c.deletedBy,
    deletedByName: c.Employee_Contact_deletedByToEmployee
      ? `${c.Employee_Contact_deletedByToEmployee.firstName} ${c.Employee_Contact_deletedByToEmployee.lastName}`
      : null,
    visibilityForRoles: c.Target.VisibilityForRole.map(mapVisibility),
  }
}

type ContactDetailPayload = Prisma.ContactGetPayload<{
  include: {
    Employee: {select: {id: true; firstName: true; lastName: true}}
    Function: {select: {id: true; name: true}}
    DepartmentExtern: {select: {id: true; name: true}}
    Title: {select: {id: true; name: true}}
    CompanyContact: {
      include: {
        Company: {select: {id: true; name: true; number: true; companyActive: true}}
        Employee: {select: {firstName: true; lastName: true}}
      }
    }
    ProjectContact: {
      include: {
        Project: {
          select: {
            id: true
            projectNumber: true
            projectName: true
            startDate: true
            endDate: true
            isOpen: true
            isClosed: true
            ProjectType: {select: {name: true}}
          }
        }
        Employee_ProjectContact_createdByToEmployee: {
          select: {firstName: true; lastName: true}
        }
      }
    }
    TrainingContact: {
      include: {
        Employee: {select: {firstName: true; lastName: true}}
        Training: {
          select: {
            id: true
            trainingNumber: true
            trainingDate: true
            TrainingStandard: {select: {descriptionShort: true}}
          }
        }
      }
    }
    FollowUpStructure: {
      include: {
        Employee_FollowUpStructure_createdByToEmployee: {
          select: {firstName: true; lastName: true}
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
  }
}>

function mapCompanyContact(cc: ContactDetailPayload['CompanyContact'][number]): MappedContactCompany {
  return {
    id: cc.id,
    startedDate: cc.startedDate.toISOString(),
    endDate: cc.endDate?.toISOString() ?? null,
    roleWithCompany: cc.roleWithCompany,
    createdAt: cc.createdAt.toISOString(),
    createdByName: `${cc.Employee.firstName} ${cc.Employee.lastName}`,
    deleted: cc.deleted,
    company: {
      id: cc.Company.id,
      name: cc.Company.name,
      number: cc.Company.number,
      companyActive: cc.Company.companyActive,
    },
  }
}

function mapProjectContact(pc: ContactDetailPayload['ProjectContact'][number]): MappedContactProject {
  const emp = pc.Employee_ProjectContact_createdByToEmployee
  return {
    id: pc.id,
    createdAt: pc.createdAt.toISOString(),
    createdByName: emp ? `${emp.firstName} ${emp.lastName}` : '-',
    project: {
      id: pc.Project.id,
      projectNumber: pc.Project.projectNumber,
      projectName: pc.Project.projectName,
      startDate: pc.Project.startDate?.toISOString() ?? null,
      endDate: pc.Project.endDate?.toISOString() ?? null,
      isOpen: pc.Project.isOpen,
      isClosed: pc.Project.isClosed,
      projectTypeName: pc.Project.ProjectType.name,
    },
  }
}

function mapTrainingContact(tc: ContactDetailPayload['TrainingContact'][number]): MappedContactTraining {
  return {
    id: tc.id,
    createdAt: tc.createdAt.toISOString(),
    createdByName: `${tc.Employee.firstName} ${tc.Employee.lastName}`,
    succeeded: tc.succeeded,
    attended: tc.attended,
    certificateSent: tc.certificateSent,
    certSentDate: tc.certSentDate?.toISOString() ?? null,
    training: {
      id: tc.Training.id,
      trainingNumber: tc.Training.trainingNumber,
      trainingDate: tc.Training.trainingDate.toISOString(),
      trainingStandardDescriptionShort: tc.Training.TrainingStandard.descriptionShort ?? '',
    },
  }
}

function mapFollowUp(fu: ContactDetailPayload['FollowUpStructure'][number]): MappedContactFollowUp {
  const emp = fu.Employee_FollowUpStructure_createdByToEmployee
  return {
    id: fu.id,
    contactDate: fu.contactDate.toISOString(),
    activityDescription: fu.activityDescription,
    additionalInfo: fu.additionalInfo,
    item: fu.item,
    taskDescription: fu.taskDescription,
    actionAgenda: fu.actionAgenda?.toISOString() ?? null,
    closedAgenda: fu.closedAgenda?.toISOString() ?? null,
    createdAt: fu.createdAt.toISOString(),
    createdByName: emp ? `${emp.firstName} ${emp.lastName}` : '-',
  }
}

export function mapContactDetail(c: ContactDetailPayload): ContactDetailData {
  return {
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    mail1: c.mail1,
    mail2: c.mail2,
    mail3: c.mail3,
    generalPhone: c.generalPhone,
    homePhone: c.homePhone,
    mobilePhone: c.mobilePhone,
    info: c.info,
    birthDate: c.birthDate?.toISOString() ?? null,
    trough: c.trough,
    description: c.description,
    infoCorrect: c.infoCorrect,
    checkInfo: c.checkInfo,
    newYearCard: c.newYearCard,
    active: c.active,
    newsLetter: c.newsLetter,
    mailing: c.mailing,
    trainingAdvice: c.trainingAdvice,
    contactForTrainingAndAdvice: c.contactForTrainingAndAdvice,
    customerTrainingAndAdvice: c.customerTrainingAndAdvice,
    potentialCustomerTrainingAndAdvice: c.potentialCustomerTrainingAndAdvice,
    potentialTeacherTrainingAndAdvice: c.potentialTeacherTrainingAndAdvice,
    teacherTrainingAndAdvice: c.teacherTrainingAndAdvice,
    participantTrainingAndAdvice: c.participantTrainingAndAdvice,
    createdAt: c.createdAt.toISOString(),
    createdByName: `${c.Employee.firstName} ${c.Employee.lastName}`,
    functionId: c.functionId,
    functionName: c.Function?.name ?? null,
    departmentExternId: c.departmentExternId,
    departmentExternName: c.DepartmentExtern?.name ?? null,
    titleId: c.titleId,
    titleName: c.Title?.name ?? null,
    businessCardId: c.businessCardId,
    targetId: c.Target.id,
    deleted: c.deleted,
    companies: c.CompanyContact.map(mapCompanyContact),
    projects: c.ProjectContact.map(mapProjectContact),
    trainings: c.TrainingContact.map(mapTrainingContact),
    followUps: c.FollowUpStructure.map(mapFollowUp),
    visibilityForRoles: c.Target.VisibilityForRole.map(v => ({
      id: v.id,
      visible: v.visible,
      roleLevelId: v.roleLevelId,
      targetId: v.targetId,
      roleName: v.RoleLevel.Role.name,
      subRoleName: v.RoleLevel.SubRole.name,
      subRoleLevel: v.RoleLevel.SubRole.level,
    })),
  }
}
