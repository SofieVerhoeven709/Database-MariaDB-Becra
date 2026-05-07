import type {Prisma} from '@/generated/prisma/client'
import type {MappedMaterialSerialTracked} from '@/components/custom/serialTrackedTable'

type SerialTrackedFromDAL = Prisma.MaterialSerialTrackGetPayload<{
  include: {
    Employee: {
      select: {
        id: true
        firstName: true
        lastName: true
      }
    }
    material: {
      select: {
        beNumber: true
        materialGroupIdA: true
      }
    }
    MaterialGroup: {
      select: {
        id: true
      }
    }
    WarehousePlace: {
      select: {
        id: true
        abbreviation: true
        place: true
        shelf: true
        column: true
        layer: true
        layerPlace: true
      }
    }
  }
}> & {
  lastInspectionDate?: Date | null
  nextInspectionDate?: Date | null
  inspectionIntervalValue?: number | null
  inspectionIntervalUnit?: string | null
}

export function mapMaterialSerialTracked(item: SerialTrackedFromDAL): MappedMaterialSerialTracked {
  const warehousePlace = item.WarehousePlace?.[0] ?? null

  return {
    id: item.id,
    beNumber: item.beNumber ?? item.material?.beNumber ?? null,
    brandName: item.brandName,
    management: item.management,
    brandOrderNumber: item.brandOrderNumber,
    companyId: item.companyId,
    orderNumber: item.orderNumber,
    shortDescription: item.shortDescription,
    longDescription: item.longDescription,
    transactionType: item.transactionType,
    materialGroupId: item.materialGroupId ?? item.material?.materialGroupIdA ?? null,
    fromLocation: item.fromLocation,
    toLocation: item.toLocation,
    preferredSupplier: item.preferredSupplier,
    rejected: item.rejected,
    additionalInfo: item.additionalInfo,
    projectId: item.projectId,
    becraCode: item.becraCode,
    createdBy: item.createdBy,
    createdByName: item.Employee ? `${item.Employee.firstName} ${item.Employee.lastName}` : null,
    deleted: item.deleted,
    deletedAt: item.deletedAt ? item.deletedAt.toISOString() : null,
    deletedByName: null,
    warehousePlaceId: warehousePlace?.id ?? null,
    warehousePlaceLabel: warehousePlace
      ? [
          warehousePlace.abbreviation,
          warehousePlace.place,
          warehousePlace.shelf,
          warehousePlace.column,
          warehousePlace.layer,
          warehousePlace.layerPlace,
        ]
          .filter(Boolean)
          .join(' / ')
      : null,
    lastInspectionDate: item.lastInspectionDate ? item.lastInspectionDate.toISOString().split('T')[0] : null,
    nextInspectionDate: item.nextInspectionDate ? item.nextInspectionDate.toISOString().split('T')[0] : null,
    inspectionIntervalValue: item.inspectionIntervalValue ?? null,
    inspectionIntervalUnit: item.inspectionIntervalUnit ?? null,
  }
}
