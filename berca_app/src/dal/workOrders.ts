import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

export async function getWorkOrderById(id: string) {
  return prismaClient.workOrder.findUniqueOrThrow({
    where: {id},
    include: {
      Employee: {select: {id: true, firstName: true, lastName: true}},
      Project: {select: {projectNumber: true, projectName: true}},
      TimeRegistry: {
        include: {
          Employee: {select: {id: true, firstName: true, lastName: true}},
          HourType: {select: {id: true, name: true}},
          TimeRegistryEmployee: {
            include: {
              Employee: {select: {id: true, firstName: true, lastName: true}},
            },
          },
        },
      },
      WorkOrderStructure: {
        include: {
          Employee: {select: {id: true, firstName: true, lastName: true}},
          Material: {select: {id: true, name: true, beNumber: true}},
        },
      },
      Training: {},
    },
  })
}

export async function getWorkOrdersByProjectId(projectId: string) {
  return prismaClient.workOrder.findMany({
    where: {projectId, deleted: false},
    include: {
      Employee: true,
      Project: true,
    },
  })
}
