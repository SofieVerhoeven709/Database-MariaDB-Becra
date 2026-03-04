import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

const timeRegistryInclude = {
  Employee: true,
  HourType: true,
  WorkOrder: {select: {workOrderNumber: true}},
  TimeRegistryEmployee: {
    include: {Employee: true},
  },
} as const

export async function getTimeRegistries() {
  return prismaClient.timeRegistry.findMany({
    include: timeRegistryInclude,
    orderBy: {workDate: 'desc'},
  })
}

export async function getTimeRegistriesByWorkOrder(workOrderId: string) {
  return prismaClient.timeRegistry.findMany({
    where: {workOrderId},
    include: timeRegistryInclude,
    orderBy: {workDate: 'desc'},
  })
}

export async function getTimeRegistryById(id: string) {
  return prismaClient.timeRegistry.findUniqueOrThrow({
    where: {id},
    include: timeRegistryInclude,
  })
}
