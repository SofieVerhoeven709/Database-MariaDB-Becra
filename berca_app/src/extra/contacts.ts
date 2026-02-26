import type {Contact, Company, CompanyContact} from '@/generated/prisma/client'
import type {MappedContact} from '@/types/contact'

type ContactWithRelations = Contact & {
  Company: Company
  CompanyContact: CompanyContact
}

export function mapContact(p: ContactWithRelations): MappedContact {
  return {
    id: p.id,
    description: p.description,
    createdAt: p.createdAt.toISOString(),
    createdBy: p.createdBy,
    companyId: p.CompanyContact.companyId,
    companyName: p.Company.name,
    deleted: p.deleted,
    deletedAt: p.deletedAt?.toISOString() ?? null,
    deletedBy: p.deletedBy,
  }
}
