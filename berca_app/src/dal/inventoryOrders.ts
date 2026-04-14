import 'server-only'
import {prismaClient} from '@/dal/prismaClient'

const employeeSelect = {select: {id: true, firstName: true, lastName: true}} as const
const include = {
  Employee: employeeSelect,
  Employee_InventoryOrder_approvedByToEmployee: employeeSelect,
  Employee_InventoryOrder_rejectedByToEmployee: employeeSelect,
  Employee_InventoryOrder_deletedByToEmployee: employeeSelect,
  Material: {select: {id: true, beNumber: true, shortDescription: true}},
} as const

export async function getInventoryOrders() {
  return prismaClient.inventoryOrder.findMany({
    include,
    orderBy: {orderDate: 'desc'},
  })
}

export async function getInventoryForPicker() {
  return prismaClient.material.findMany({
    where: {deleted: false},
    select: {id: true, beNumber: true, shortDescription: true},
    orderBy: {beNumber: 'asc'},
  })
}
