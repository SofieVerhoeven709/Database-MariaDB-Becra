import type {Company, CompanyAdress, Employee} from '@/generated/prisma/client'
import type {MappedCompany, MappedCompanyAddress} from '@/types/company'

type CompanyWithRelations = Company & {
  Company: Company | null
  Employee: Pick<Employee, 'id' | 'firstName' | 'lastName'>
  Employee_Company_deletedByToEmployee: Pick<Employee, 'id' | 'firstName' | 'lastName'> | null
  CompanyAdress: CompanyAdress[]
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
  }
}
