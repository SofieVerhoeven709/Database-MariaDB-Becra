import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

export async function getWorkOrderById(id: string) {
  return prismaClient.workOrder.findUniqueOrThrow({
    where: {id},
    include: {
      Employee: true,
      Project: true,
      Target: true,
      TimeRegistry: {
        where: {deleted: false},
        include: {
          Employee: true,
          HourType: true,
          TimeRegistryEmployee: {
            include: {
              Employee: true,
            },
          },
        },
      },
      WorkOrderStructure: {
        where: {deleted: false},
        include: {
          Employee: true,
          Material: true,
          Target: true,
        },
      },
      Training: {
        where: {deleted: false},
      },
    },
  })
}

export async function getWorkOrdersByProjectId(projectId: string) {
  return prismaClient.workOrder.findMany({
    where: {projectId, deleted: false},
    include: {
      Employee: true,
      Project: true,
      Target: true,
    },
  })
}
