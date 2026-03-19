import type {MaterialPriceWithRelations} from '@/dal/materialPrices'
import type {MappedMaterialPrice} from '@/types/materialPrice'

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
    packingUnits: p.packingUnits?.toString() ?? null,
    updatedAt: p.updatedAt?.toISOString() ?? null,
    companyId: p.companyId,
    companyName: p.Company?.name ?? null,
    createdBy: p.createdBy,
    createdByName: `${p.Employee.firstName} ${p.Employee.lastName}`,
    deleted: p.deleted,
    deletedAt: p.deletedAt?.toISOString() ?? null,
    deletedBy: p.deletedBy ?? null,
  }
}
