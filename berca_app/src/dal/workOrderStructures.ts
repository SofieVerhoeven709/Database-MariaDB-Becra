import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

const workOrderStructureListInclude = {
  Employee: {select: {firstName: true, lastName: true}},
  Employee_WorkOrderStructure_deletedByToEmployee: {select: {firstName: true, lastName: true}},
  Material: {select: {id: true, name: true, beNumber: true}},
  WorkOrder: {select: {workOrderNumber: true}},
} as const

export async function getWorkOrderStructures() {
  return prismaClient.workOrderStructure.findMany({
    include: workOrderStructureListInclude,
  })
}

export async function getWorkOrderStructureById(id: string) {
  return prismaClient.workOrderStructure.findUniqueOrThrow({
    where: {id},
    include: workOrderStructureListInclude,
  })
}

export async function getWorkOrderStructuresByWorkOrderId(workOrderId: string) {
  return prismaClient.workOrderStructure.findMany({
    where: {workOrderId, deleted: false},
    include: workOrderStructureListInclude,
  })
}
