import type {Prisma} from '@/generated/prisma/client'
import type {MappedMaterialPrice} from '@/types/materialPrice'

type MaterialPriceWithRelations = Prisma.MaterialPriceGetPayload<{
  include: {
    Employee: {select: {id: true; firstName: true; lastName: true}}
    Company: {select: {id: true; name: true}}
  }
}>

export function mapMaterialPrice(p: MaterialPriceWithRelations): MappedMaterialPrice {
  return {
    id: p.id,
    beNumber: p.beNumber ?? null,
    orderNr: p.orderNr ?? null,
    quoteBecra: p.quoteBecra ?? null,
    supplierOrderNr: p.supplierOrderNr ?? null,
    brandOrderNr: p.brandOrderNr ?? null,
    shortDescription: p.shortDescription ?? null,
    longDescription: p.longDescription ?? null,
    brandName: p.brandName ?? null,
    rejected: p.rejected ?? null,
    additionalInfo: p.additionalInfo ?? null,
    unitPrice: p.unitPrice?.toString() ?? null,
    quantityPrice: p.quantityPrice?.toString() ?? null,
    updatedAt: p.updatedAt?.toISOString() ?? null,
    companyId: p.companyId as string,
    companyName: (p.Company as {id: string; name: string} | null)?.name ?? null,
    createdBy: p.createdBy,
    createdByName: `${p.Employee.firstName} ${p.Employee.lastName}`,
    deleted: p.deleted,
    deletedAt: p.deletedAt?.toISOString() ?? null,
    deletedBy: p.deletedBy ?? null,
  }
}
