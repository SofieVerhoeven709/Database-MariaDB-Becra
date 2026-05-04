import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

export async function getIncomingDeliveries() {
  return prismaClient.incomingDelivery.findMany({
    orderBy: [{deliveryDate: 'desc'}, {incomingDeliveryNumber: 'desc'}],
    include: {
      Purchase: {select: {id: true, purchaseNumber: true, description: true}},
      Employee_IncomingDelivery_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
      IncomingDeliveryLine: {
        // Exclude deleted lines when computing totals/flags.
        where: {deleted: false},
        select: {
          id: true,
          orderedQty: true,
          acceptedQty: true,
          backorderQty: true,
          notCorrect: true,
          notCorrectReason: true,
        },
      },
    },
  })
}

export async function getIncomingDeliveryById(id: string) {
  return prismaClient.incomingDelivery.findUnique({
    where: {id},
    include: {
      Purchase: {select: {id: true, purchaseNumber: true, status: true}},
      Employee_IncomingDelivery_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
      IncomingDeliveryLine: {
        // Fetch all lines (including deleted) so the client can filter and show restore/hard-delete controls.
        orderBy: {createdAt: 'desc'},
        include: {
          Material: {select: {id: true, beNumber: true, name: true, shortDescription: true}},
          PurchaseDetail: {select: {id: true, purchaseId: true, materialDemandId: true}},
          Employee_IncomingDeliveryLine_createdByToEmployee: {select: {id: true, firstName: true, lastName: true}},
          IncomingDeliveryLineAllocation: {
            // Include deleted allocations so UI can toggle visibility.
            orderBy: {createdAt: 'desc'},
            include: {
              MaterialDemandSource: {
                select: {
                  id: true,
                  sourceReferenceId: true,
                  fulfilled: true,
                  fulfilledAt: true,
                  fulfilledBy: true,
                  requiredQty: true,
                  reservedQty: true,
                  MaterialDemandSourceType: {select: {name: true}},
                  MaterialDemand: {
                    select: {
                      id: true,
                      materialId: true,
                      Material: {select: {id: true, beNumber: true, shortDescription: true, name: true}},
                    },
                  },
                },
              },
              Employee_IncomingDeliveryLineAllocation_createdByToEmployee: {
                select: {id: true, firstName: true, lastName: true},
              },
            },
          },
        },
      },
    },
  })
}

export async function getIncomingDeliveryPurchaseOptions() {
  return prismaClient.purchase.findMany({
    where: {deleted: false},
    select: {id: true, purchaseNumber: true, status: true, description: true},
    orderBy: {purchaseDate: 'desc'},
  })
}

export async function getIncomingDeliveryMaterialOptions() {
  return prismaClient.material.findMany({
    where: {deleted: false},
    select: {id: true, beNumber: true, name: true, shortDescription: true, warehousePlaceId: true},
    orderBy: {beNumber: 'asc'},
  })
}

export async function getIncomingDeliveryPurchaseDetailOptions(purchaseId: string | null | undefined) {
  if (!purchaseId) return []
  // Limit options to lines belonging to the selected purchase.
  return prismaClient.purchaseDetail.findMany({
    where: {purchaseId, deleted: false},
    orderBy: {createdAt: 'desc'},
    select: {
      id: true,
      materialId: true,
      materialDemandId: true,
      quantity: true,
      Material: {select: {beNumber: true, name: true, shortDescription: true}},
    },
  })
}

export async function getMaterialDemandSourceOptions() {
  return prismaClient.materialDemandSource.findMany({
    // Only list open demand sources for allocation.
    where: {fulfilled: false},
    orderBy: {createdAt: 'desc'},
    select: {
      id: true,
      requiredQty: true,
      reservedQty: true,
      fulfilled: true,
      fulfilledAt: true,
      fulfilledBy: true,
      MaterialDemandSourceType: {select: {name: true}},
      MaterialDemand: {
        select: {
          materialId: true,
          Material: {select: {beNumber: true, shortDescription: true, name: true}},
        },
      },
    },
  })
}
