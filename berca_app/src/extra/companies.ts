import type {Company, CompanyAdress, Employee, Prisma} from '@/generated/prisma/client'
import type {
  CompanyDetailData,
  MappedCompany,
  MappedCompanyAddress,
  MappedCompanyContact,
  MappedCompanyProject,
} from '@/types/company'
import type {VisibilityWithRoleLevel} from '@/extra/visibilityForRole'
import {mapVisibility} from '@/extra/visibilityForRole'

type CompanyWithRelations = Company & {
  Company: Company | null
  Employee: Pick<Employee, 'id' | 'firstName' | 'lastName'>
  Employee_Company_deletedByToEmployee: Pick<Employee, 'id' | 'firstName' | 'lastName'> | null
  CompanyAdress: CompanyAdress[]
  Target: {
    id: string
    VisibilityForRole: VisibilityWithRoleLevel[]
  }
}

function mapAddress(a: CompanyAdress): MappedCompanyAddress {
  return {
    id: a.id,
    street: a.street,
    houseNumber: a.houseNumber,
    busNumber: a.busNumber,
    zipCode: a.zipCode,
    place: a.place,
    typeAdress: a.typeAdress,
    createdAt: a.createdAt.toISOString(),
    createdBy: a.createdBy,
    companyId: a.companyId,
    deleted: a.deleted,
    deletedAt: a.deletedAt?.toISOString() ?? null,
    deletedBy: a.deletedBy,
  }
}

export function mapCompany(c: CompanyWithRelations): MappedCompany {
  return {
    id: c.id,
    name: c.name,
    number: c.number,
    mail: c.mail,
    businessPhone: c.businessPhone,
    website: c.website,
    vatNumber: c.vatNumber,
    bankNumber: c.bankNumber,
    iban: c.iban,
    bic: c.bic,
    becraCustomerNumber: c.becraCustomerNumber,
    becraWebsiteLogin: c.becraWebsiteLogin,
    supplier: c.supplier,
    prefferedSupplier: c.prefferedSupplier,
    companyActive: c.companyActive,
    newsLetter: c.newsLetter,
    customer: c.customer,
    potentialCustomer: c.potentialCustomer,
    headQuarters: c.headQuarters,
    potentialSubContractor: c.potentialSubContractor,
    subContractor: c.subContractor,
    notes: c.notes,
    createdAt: c.createdAt.toISOString(),
    createdBy: c.createdBy,
    createdByName: `${c.Employee.firstName} ${c.Employee.lastName}`,
    companyId: c.companyId,
    parentCompanyName: c.Company?.name ?? null,
    deleted: c.deleted,
    deletedAt: c.deletedAt?.toISOString() ?? null,
    deletedBy: c.deletedBy,
    deletedByName: c.Employee_Company_deletedByToEmployee
      ? `${c.Employee_Company_deletedByToEmployee.firstName} ${c.Employee_Company_deletedByToEmployee.lastName}`
      : null,
    addresses: c.CompanyAdress.map(mapAddress),
    targetId: c.Target.id,
    visibilityForRoles: c.Target.VisibilityForRole.map(mapVisibility),
  }
}

type CompanyDetailPayload = Prisma.CompanyGetPayload<{
  include: {
    Employee: {select: {id: true; firstName: true; lastName: true}}
    Company: {select: {id: true; name: true}}
    other_Company: {select: {id: true; name: true; number: true; companyActive: true}}
    CompanyAdress: true
    CompanyContact: {
      include: {
        Contact: {
          select: {
            id: true
            firstName: true
            lastName: true
            mail1: true
            mail2: true
            mail3: true
            generalPhone: true
            mobilePhone: true
            homePhone: true
            active: true
          }
        }
        Employee: {select: {firstName: true; lastName: true}}
      }
    }
    Project: {
      include: {
        ProjectType: {select: {name: true}}
        Employee: {select: {firstName: true; lastName: true}}
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

function mapDetailAddress(a: CompanyDetailPayload['CompanyAdress'][number]): MappedCompanyAddress {
  return {
    id: a.id,
    street: a.street,
    houseNumber: a.houseNumber,
    busNumber: a.busNumber,
    zipCode: a.zipCode,
    place: a.place,
    typeAdress: a.typeAdress,
    createdAt: a.createdAt.toISOString(),
    createdBy: a.createdBy,
    companyId: a.companyId,
    deleted: a.deleted,
    deletedAt: a.deletedAt?.toISOString() ?? null,
    deletedBy: a.deletedBy,
  }
}

function mapContact(cc: CompanyDetailPayload['CompanyContact'][number]): MappedCompanyContact {
  return {
    id: cc.id,
    startedDate: cc.startedDate.toISOString(),
    endDate: cc.endDate?.toISOString() ?? null,
    roleWithCompany: cc.roleWithCompany,
    createdAt: cc.createdAt.toISOString(),
    createdByName: `${cc.Employee.firstName} ${cc.Employee.lastName}`,
    deleted: cc.deleted,
    contact: {
      id: cc.Contact.id,
      firstName: cc.Contact.firstName,
      lastName: cc.Contact.lastName,
      mail1: cc.Contact.mail1,
      mail2: cc.Contact.mail2,
      mail3: cc.Contact.mail3,
      generalPhone: cc.Contact.generalPhone,
      mobilePhone: cc.Contact.mobilePhone,
      homePhone: cc.Contact.homePhone,
      active: cc.Contact.active,
    },
  }
}

function mapProject(p: CompanyDetailPayload['Project'][number]): MappedCompanyProject {
  return {
    id: p.id,
    projectNumber: p.projectNumber,
    projectName: p.projectName,
    startDate: p.startDate?.toISOString() ?? null,
    endDate: p.endDate?.toISOString() ?? null,
    isOpen: p.isOpen,
    isClosed: p.isClosed,
    isMainProject: p.isMainProject,
    isIntern: p.isIntern,
    projectTypeName: p.ProjectType.name,
    createdByName: `${p.Employee.firstName} ${p.Employee.lastName}`,
    createdAt: p.createdAt.toISOString(),
  }
}

export function mapCompanyDetail(c: CompanyDetailPayload): CompanyDetailData {
  return {
    id: c.id,
    name: c.name,
    number: c.number,
    mail: c.mail,
    businessPhone: c.businessPhone,
    website: c.website,
    vatNumber: c.vatNumber,
    bankNumber: c.bankNumber,
    iban: c.iban,
    bic: c.bic,
    becraCustomerNumber: c.becraCustomerNumber,
    becraWebsiteLogin: c.becraWebsiteLogin,
    notes: c.notes,
    supplier: c.supplier,
    prefferedSupplier: c.prefferedSupplier,
    companyActive: c.companyActive,
    newsLetter: c.newsLetter,
    customer: c.customer,
    potentialCustomer: c.potentialCustomer,
    headQuarters: c.headQuarters,
    potentialSubContractor: c.potentialSubContractor,
    subContractor: c.subContractor,
    createdAt: c.createdAt.toISOString(),
    createdByName: `${c.Employee.firstName} ${c.Employee.lastName}`,
    deleted: c.deleted,
    companyId: c.companyId,
    parentCompanyName: c.Company?.name ?? null,
    targetId: c.Target.id,
    addresses: c.CompanyAdress.map(mapDetailAddress),
    contacts: c.CompanyContact.map(mapContact),
    projects: c.Project.map(mapProject),
    subsidiaries: c.other_Company.map(s => ({
      id: s.id,
      name: s.name,
      number: s.number,
      companyActive: s.companyActive,
    })),
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
