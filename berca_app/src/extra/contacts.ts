import type {Contact, Company, CompanyContact, Employee} from '@/generated/prisma/client'
import type {MappedContact, MappedCompanyContact} from '@/types/contact'

type ContactWithRelations = Contact & {
  Employee: Pick<Employee, 'id' | 'firstName' | 'lastName'>
  Employee_Contact_deletedByToEmployee: Pick<Employee, 'id' | 'firstName' | 'lastName'> | null
  CompanyContact: (CompanyContact & {
    Company: Pick<Company, 'id' | 'name'>
  })[]
}

function mapCompanyContact(cc: ContactWithRelations['CompanyContact'][number]): MappedCompanyContact {
  return {
    id: cc.id,
    startedDate: cc.startedDate.toISOString(),
    endDate: cc.endDate?.toISOString() ?? null,
    roleWithCompany: cc.roleWithCompany,

    createdAt: cc.createdAt.toISOString(),
    createdBy: cc.createdBy,

    contactId: cc.contactId,
    companyId: cc.companyId,

    deleted: cc.deleted,
    deletedAt: cc.deletedAt?.toISOString() ?? null,
    deletedBy: cc.deletedBy,
  }
}

export function mapContact(p: ContactWithRelations): MappedContact {
  return {
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    mail1: p.mail1,
    mail2: p.mail2,
    mail3: p.mail3,
    generalPhone: p.generalPhone,
    homePhone: p.homePhone,
    mobilePhone: p.mobilePhone,
    info: p.info,
    birthDate: p.birthDate?.toISOString() ?? null,
    trough: p.trough,
    description: p.description,

    createdAt: p.createdAt.toISOString(),
    createdBy: p.createdBy,
    createdByName: `${p.Employee.firstName} ${p.Employee.lastName}`,

    infoCorrect: p.infoCorrect,
    checkInfo: p.checkInfo,
    newYearCard: p.newYearCard,
    active: p.active,
    newsLetter: p.newsLetter,
    mailing: p.mailing,
    trainingAdvice: p.trainingAdvice,
    contactForTrainingAndAdvice: p.contactForTrainingAndAdvice,
    customerTrainingAndAdvice: p.customerTrainingAndAdvice,
    potentialCustomerTrainingAndAdvice: p.potentialCustomerTrainingAndAdvice,
    potentialTeacherTrainingAndAdvice: p.potentialTeacherTrainingAndAdvice,
    teacherTrainingAndAdvice: p.teacherTrainingAndAdvice,
    participantTrainingAndAdvice: p.participantTrainingAndAdvice,

    functionId: p.functionId,
    departmentExternId: p.departmentExternId,
    titleId: p.titleId,
    businessCardId: p.businessCardId,
    targetId: p.targetId,

    deleted: p.deleted,
    deletedAt: p.deletedAt?.toISOString() ?? null,
    deletedBy: p.deletedBy,
    deletedByName: p.Employee_Contact_deletedByToEmployee
      ? `${p.Employee_Contact_deletedByToEmployee.firstName} ${p.Employee_Contact_deletedByToEmployee.lastName}`
      : null,

    companyContacts: p.CompanyContact.map(mapCompanyContact),
  }
}
