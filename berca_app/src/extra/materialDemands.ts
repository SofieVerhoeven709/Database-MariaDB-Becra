import type {Prisma} from '@/generated/prisma/client'
import type {MappedMaterialDemand} from '@/types/materialDemand'

type MaterialDemandWithRelations = Prisma.MaterialDemandGetPayload<{
  include: {
    Material: {select: {id: true; beNumber: true; name: true; shortDescription: true}}
    MaterialDemandSource: {select: {id: true}}
    QuoteSupplierLine: {select: {id: true}}
  }
}>

export function mapMaterialDemand(row: MaterialDemandWithRelations): MappedMaterialDemand {
  return {
    id: row.id,
    materialId: row.materialId,
    materialBeNumber: row.Material.beNumber,
    materialName: row.Material.name,
    materialShortDescription: row.Material.shortDescription,
    totalRequiredQty: row.totalRequiredQty,
    reservedQty: row.reservedQty ?? 0,
    createdAt: row.createdAt.toISOString(),
    sourceCount: row.MaterialDemandSource.length,
    quoteLineCount: row.QuoteSupplierLine.length,
  }
}

