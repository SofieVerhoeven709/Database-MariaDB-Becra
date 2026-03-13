import 'server-only'
import {prismaClient} from '@/dal/prismaClient'
const employeeSelect = {select: {id: true, firstName: true, lastName: true}} as const
const include = {
  Employee: employeeSelect,
  Inventory: {select: {id: true, beNumber: true, shortDescription: true}},
} as const
export async function getInventoryOrders() {
  return prismaClient.inventoryOrder.findMany({
    where: {deleted: false},
    include,
    orderBy: {orderDate: 'desc'},
  })
}
export async function getInventoryForPicker() {
  return prismaClient.inventory.findMany({
    where: {deleted: false},
    select: {id: true, beNumber: true, shortDescription: true},
    orderBy: {beNumber: 'asc'},
  })
}
