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
        materialGroupIdA: true // Include materialGroupIdA in the selection
      }
    }
  }
}>

export function mapMaterialSerialTracked(item: SerialTrackedFromDAL): MappedMaterialSerialTracked {
  return {
    id: item.id,
    beNumber: item.material?.beNumber ?? null,
    brandName: item.brandName,
    management: item.management,
    brandOrderNumber: item.brandOrderNumber,
    companyId: item.companyId,
    orderNumber: item.orderNumber,
    shortDescription: item.shortDescription,
    longDescription: item.longDescription,
    transactionType: item.transactionType,
    materialGroupId: item.material?.materialGroupIdA ?? null, // Use group from related Material
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
  }
}
