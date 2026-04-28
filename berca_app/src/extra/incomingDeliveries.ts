import type {Prisma} from '@/generated/prisma/client'
import type {
  IncomingDeliveryOption,
  MappedIncomingDelivery,
  MappedIncomingDeliveryLine,
  MappedIncomingDeliveryLineAllocation,
  MaterialDemandSourceOption,
} from '@/types/incomingDelivery'

type IncomingDeliveryWithRelations = Prisma.IncomingDeliveryGetPayload<{
  include: {
    Purchase: {select: {id: true; purchaseNumber: true}}
    Employee_IncomingDelivery_createdByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    IncomingDeliveryLine: {
      select: {
        id: true
        orderedQty: true
        acceptedQty: true
        backorderQty: true
        notCorrect: true
        notCorrectReason: true
      }
    }
  }
}>

export function mapIncomingDelivery(row: IncomingDeliveryWithRelations): MappedIncomingDelivery {
  const orderedQtyTotal = row.IncomingDeliveryLine.reduce((sum, line) => sum + line.orderedQty, 0)
  const acceptedQtyTotal = row.IncomingDeliveryLine.reduce((sum, line) => sum + line.acceptedQty, 0)
  const hasBackorder = row.IncomingDeliveryLine.some(line => line.backorderQty > 0)
  // Fully delivered when all ordered qty is accepted and no backorder remains.
  const isFullyDelivered = row.IncomingDeliveryLine.length > 0 && acceptedQtyTotal >= orderedQtyTotal && !hasBackorder

  return {
    id: row.id,
    incomingDeliveryNumber: row.incomingDeliveryNumber,
    purchaseId: row.purchaseId,
    purchaseNumber: row.Purchase?.purchaseNumber ?? null,
    status: row.status,
    deliveryDate: row.deliveryDate.toISOString(),
    receivedAt: row.receivedAt?.toISOString() ?? null,
    description: row.description ?? null,
    additionalInfo: row.additionalInfo ?? null,
    createdAt: row.createdAt.toISOString(),
    createdBy: row.createdBy,
    createdByName: `${row.Employee_IncomingDelivery_createdByToEmployee.firstName} ${row.Employee_IncomingDelivery_createdByToEmployee.lastName}`,
    deleted: row.deleted,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    deletedBy: row.deletedBy,
    lineCount: row.IncomingDeliveryLine.length,
    orderedQtyTotal,
    acceptedQtyTotal,
    isFullyDelivered,
  }
}

type IncomingDeliveryLineWithRelations = Prisma.IncomingDeliveryLineGetPayload<{
  include: {
    Material: {select: {id: true; beNumber: true; name: true; shortDescription: true}}
    Employee_IncomingDeliveryLine_createdByToEmployee: {select: {id: true; firstName: true; lastName: true}}
    IncomingDeliveryLineAllocation: {
      include: {
        MaterialDemandSource: {
          select: {
            id: true
            sourceReferenceId: true
            fulfilled: true
            fulfilledAt: true
            fulfilledBy: true
            requiredQty: true
            reservedQty: true
            MaterialDemandSourceType: {select: {name: true}}
            MaterialDemand: {
              select: {
                id: true
                materialId: true
                Material: {select: {id: true; beNumber: true; shortDescription: true; name: true}}
              }
            }
          }
        }
        Employee_IncomingDeliveryLineAllocation_createdByToEmployee: {
          select: {id: true; firstName: true; lastName: true}
        }
      }
    }
  }
}>

export function mapIncomingDeliveryLine(line: IncomingDeliveryLineWithRelations): MappedIncomingDeliveryLine {
  return {
    id: line.id,
    incomingDeliveryId: line.incomingDeliveryId,
    purchaseDetailId: line.purchaseDetailId,
    materialId: line.materialId,
    // Prefer BE number with a readable name/description.
    materialLabel: [line.Material.beNumber, line.Material.shortDescription ?? line.Material.name]
      .filter(Boolean)
      .join(' - '),
    orderedQty: line.orderedQty,
    deliveredQty: line.deliveredQty,
    acceptedQty: line.acceptedQty,
    rejectedQty: line.rejectedQty,
    backorderQty: line.backorderQty,
    unitPrice: line.unitPrice?.toString() ?? null,
    lineStatus: line.lineStatus,
    createdAt: line.createdAt.toISOString(),
    createdBy: line.createdBy,
    createdByName: `${line.Employee_IncomingDeliveryLine_createdByToEmployee.firstName} ${line.Employee_IncomingDeliveryLine_createdByToEmployee.lastName}`,
    deleted: line.deleted,
    deletedAt: line.deletedAt?.toISOString() ?? null,
    deletedBy: line.deletedBy,
    notCorrect: line.notCorrect,
    notCorrectReason: line.notCorrectReason ?? null,
    allocationCount: line.IncomingDeliveryLineAllocation.length,
  }
}

export function mapIncomingDeliveryLineAllocation(
  allocation: IncomingDeliveryLineWithRelations['IncomingDeliveryLineAllocation'][number],
): MappedIncomingDeliveryLineAllocation {
  const material = allocation.MaterialDemandSource.MaterialDemand.Material
  return {
    id: allocation.id,
    incomingDeliveryLineId: allocation.incomingDeliveryLineId,
    materialDemandSourceId: allocation.materialDemandSourceId,
    // Include source type and material for quick identification in the UI.
    materialDemandSourceLabel: `${allocation.MaterialDemandSource.MaterialDemandSourceType.name} - ${material.beNumber ?? '—'} - ${material.shortDescription ?? material.name ?? allocation.materialDemandSourceId}`,
    sourceTypeName: allocation.MaterialDemandSource.MaterialDemandSourceType.name,
    sourceReferenceId: allocation.MaterialDemandSource.sourceReferenceId ?? null,
    allocatedQty: allocation.allocatedQty,
    createdAt: allocation.createdAt.toISOString(),
    createdBy: allocation.createdBy,
    createdByName: `${allocation.Employee_IncomingDeliveryLineAllocation_createdByToEmployee.firstName} ${allocation.Employee_IncomingDeliveryLineAllocation_createdByToEmployee.lastName}`,
    deleted: allocation.deleted,
    deletedAt: allocation.deletedAt?.toISOString() ?? null,
    deletedBy: allocation.deletedBy,
    fulfilled: allocation.MaterialDemandSource.fulfilled,
    fulfilledAt: allocation.MaterialDemandSource.fulfilledAt?.toISOString() ?? null,
    fulfilledBy: allocation.MaterialDemandSource.fulfilledBy,
  }
}

export function mapIncomingDeliveryOption(row: {
  id: any
  purchaseNumber: any
  purchaseDescription: any
}): IncomingDeliveryOption {
  return {id: row.id, name: row.purchaseNumber}
}

export function mapMaterialDemandSourceOption(row: {
  id: string
  requiredQty: number
  reservedQty: number | null
  fulfilled: boolean
  fulfilledAt: Date | string | null
  fulfilledBy: string | null
  MaterialDemandSourceType: {name: string}
  MaterialDemand: {
    materialId: string
    Material: {beNumber: string | null; shortDescription: string | null; name: string | null}
  }
}): MaterialDemandSourceOption {
  const material = row.MaterialDemand.Material
  return {
    id: row.id,
    materialId: row.MaterialDemand.materialId,
    requiredQty: row.requiredQty,
    reservedQty: row.reservedQty ?? 0,
    fulfilled: row.fulfilled,
    fulfilledAt: row.fulfilledAt ? new Date(row.fulfilledAt).toISOString() : null,
    fulfilledBy: row.fulfilledBy,
    label: `${row.MaterialDemandSourceType.name} - ${material.beNumber ?? '—'} - ${material.shortDescription ?? material.name ?? row.id}`,
  }
}
