import 'server-only'
import {prismaClient} from '@/dal/prismaClient'
import {Prisma} from '@/generated/prisma/client'
import type {
  HrFacilityEmployeeOption,
  HrFacilityFineRow,
  HrFacilityFuelCardRow,
  HrFacilitySerialTrackedOption,
  HrFacilityVehicleRow,
} from '@/types/hrFacility'

function toIsoDate(value: Date | null | undefined) {
  return value?.toISOString() ?? null
}

function decimalToString(value: Prisma.Decimal | null | undefined) {
  return value?.toFixed(2) ?? null
}

function employeeName(employee: {firstName: string; lastName: string} | null | undefined) {
  if (!employee) return null
  return `${employee.firstName} ${employee.lastName}`.trim()
}

export async function getHrFacilityEmployeeOptions(): Promise<HrFacilityEmployeeOption[]> {
  const employees = await prismaClient.employee.findMany({
    where: {deleted: false},
    orderBy: [{lastName: 'asc'}, {firstName: 'asc'}],
    select: {id: true, firstName: true, lastName: true},
  })

  return employees.map(employee => ({
    id: employee.id,
    name: employeeName(employee) ?? employee.id,
  }))
}

export async function getHrFacilitySerialTrackedOptions(): Promise<HrFacilitySerialTrackedOption[]> {
  const serialTrackedItems = await prismaClient.materialSerialTrack.findMany({
    where: {deleted: false},
    orderBy: [{beNumber: 'asc'}, {brandName: 'asc'}, {shortDescription: 'asc'}],
    select: {
      id: true,
      beNumber: true,
      brandName: true,
      shortDescription: true,
    },
  })

  return serialTrackedItems.map(item => ({
    id: item.id,
    label: [item.beNumber, item.brandName, item.shortDescription].filter(Boolean).join(' - ') || item.id,
  }))
}

export async function getHrFacilityRows(): Promise<HrFacilityVehicleRow[]> {
  const [vehicles, fuelCards, fines, employees, serialTrackedItems] = await Promise.all([
    prismaClient.hrFacilityVehicle.findMany({
      where: {deleted: false},
      orderBy: [{licensePlate: 'asc'}, {brand: 'asc'}, {model: 'asc'}],
    }),
    prismaClient.hrFacilityFuelCard.findMany({
      where: {deleted: false},
      orderBy: [{active: 'desc'}, {cardNumber: 'asc'}],
    }),
    prismaClient.hrFacilityFine.findMany({
      where: {deleted: false},
      orderBy: [{fineDate: 'desc'}, {createdAt: 'desc'}],
    }),
    prismaClient.employee.findMany({
      where: {deleted: false},
      select: {id: true, firstName: true, lastName: true},
    }),
    prismaClient.materialSerialTrack.findMany({
      where: {deleted: false},
      select: {id: true, beNumber: true, brandName: true, shortDescription: true},
    }),
  ])

  const employeeById = new Map(employees.map(employee => [employee.id, employeeName(employee)]))
  const serialTrackedById = new Map(
    serialTrackedItems.map(item => [
      item.id,
      [item.beNumber, item.brandName, item.shortDescription].filter(Boolean).join(' - ') || item.id,
    ]),
  )

  const fuelCardsByVehicle = new Map<string, HrFacilityFuelCardRow[]>()
  const finesByVehicle = new Map<string, HrFacilityFineRow[]>()

  for (const fuelCard of fuelCards) {
    const row: HrFacilityFuelCardRow = {
      id: fuelCard.id,
      vehicleId: fuelCard.vehicleId,
      employeeId: fuelCard.employeeId,
      employeeName: fuelCard.employeeId ? (employeeById.get(fuelCard.employeeId) ?? null) : null,
      cardNumber: fuelCard.cardNumber,
      provider: fuelCard.provider,
      monthlyBudget: decimalToString(fuelCard.monthlyBudget),
      currentMonthSpend: decimalToString(fuelCard.currentMonthSpend) ?? '0.00',
      active: fuelCard.active,
      notes: fuelCard.notes,
    }

    if (fuelCard.vehicleId) {
      fuelCardsByVehicle.set(fuelCard.vehicleId, [...(fuelCardsByVehicle.get(fuelCard.vehicleId) ?? []), row])
    }
  }

  for (const fine of fines) {
    const row: HrFacilityFineRow = {
      id: fine.id,
      vehicleId: fine.vehicleId,
      employeeId: fine.employeeId,
      employeeName: fine.employeeId ? (employeeById.get(fine.employeeId) ?? null) : null,
      fineDate: fine.fineDate.toISOString(),
      amount: decimalToString(fine.amount) ?? '0.00',
      referenceNumber: fine.referenceNumber,
      description: fine.description,
      paidByEmployee: fine.paidByEmployee,
      paidAt: toIsoDate(fine.paidAt),
    }

    if (fine.vehicleId) {
      finesByVehicle.set(fine.vehicleId, [...(finesByVehicle.get(fine.vehicleId) ?? []), row])
    }
  }

  return vehicles.map(vehicle => ({
    id: vehicle.id,
    serialTrackedId: vehicle.serialTrackedId,
    serialTrackedLabel: vehicle.serialTrackedId ? (serialTrackedById.get(vehicle.serialTrackedId) ?? null) : null,
    assignedEmployeeId: vehicle.assignedEmployeeId,
    assignedEmployeeName: vehicle.assignedEmployeeId ? (employeeById.get(vehicle.assignedEmployeeId) ?? null) : null,
    licensePlate: vehicle.licensePlate,
    brand: vehicle.brand,
    model: vehicle.model,
    vin: vehicle.vin,
    status: vehicle.status,
    conditionStatus: vehicle.conditionStatus,
    signedVehicleDocument: vehicle.signedVehicleDocument,
    signedDocumentFileId: vehicle.signedDocumentFileId,
    monthlyFuelBudget: decimalToString(vehicle.monthlyFuelBudget),
    notes: vehicle.notes,
    fuelCards: fuelCardsByVehicle.get(vehicle.id) ?? [],
    fines: finesByVehicle.get(vehicle.id) ?? [],
  }))
}

export async function createHrFacilityVehicle(data: {
  serialTrackedId: string | null
  assignedEmployeeId: string | null
  licensePlate: string | null
  brand: string | null
  model: string | null
  vin: string | null
  status: string
  conditionStatus: string | null
  signedVehicleDocument: boolean
  signedDocumentFileId: string | null
  monthlyFuelBudget: number | null
  notes: string | null
  profileId: string
}) {
  return prismaClient.hrFacilityVehicle.create({
    data: {
      id: crypto.randomUUID(),
      serialTrackedId: data.serialTrackedId,
      assignedEmployeeId: data.assignedEmployeeId,
      licensePlate: data.licensePlate,
      brand: data.brand,
      model: data.model,
      vin: data.vin,
      status: data.status,
      conditionStatus: data.conditionStatus,
      signedVehicleDocument: data.signedVehicleDocument,
      signedDocumentFileId: data.signedDocumentFileId,
      monthlyFuelBudget: data.monthlyFuelBudget,
      notes: data.notes,
      createdAt: new Date(),
      createdBy: data.profileId,
    },
  })
}

export async function updateHrFacilityVehicle(
  id: string,
  data: Omit<Parameters<typeof createHrFacilityVehicle>[0], 'profileId'> & {profileId: string},
) {
  return prismaClient.hrFacilityVehicle.update({
    where: {id},
    data: {
      serialTrackedId: data.serialTrackedId,
      assignedEmployeeId: data.assignedEmployeeId,
      licensePlate: data.licensePlate,
      brand: data.brand,
      model: data.model,
      vin: data.vin,
      status: data.status,
      conditionStatus: data.conditionStatus,
      signedVehicleDocument: data.signedVehicleDocument,
      signedDocumentFileId: data.signedDocumentFileId,
      monthlyFuelBudget: data.monthlyFuelBudget,
      notes: data.notes,
      updatedAt: new Date(),
      updatedBy: data.profileId,
    },
  })
}

export async function softDeleteHrFacilityVehicle(id: string, profileId: string) {
  return prismaClient.hrFacilityVehicle.update({
    where: {id},
    data: {deleted: true, deletedAt: new Date(), deletedBy: profileId},
  })
}

function assertFuelBudget(data: {monthlyBudget: number | null; currentMonthSpend: number}) {
  if (data.monthlyBudget !== null && data.currentMonthSpend > data.monthlyBudget) {
    throw new Error('Fuel card spend cannot exceed the monthly budget.')
  }
}

export async function createHrFacilityFuelCard(data: {
  vehicleId: string | null
  employeeId: string | null
  cardNumber: string
  provider: string | null
  monthlyBudget: number | null
  currentMonthSpend: number
  active: boolean
  notes: string | null
  profileId: string
}) {
  assertFuelBudget(data)

  return prismaClient.hrFacilityFuelCard.create({
    data: {
      id: crypto.randomUUID(),
      vehicleId: data.vehicleId,
      employeeId: data.employeeId,
      cardNumber: data.cardNumber,
      provider: data.provider,
      monthlyBudget: data.monthlyBudget,
      currentMonthSpend: data.currentMonthSpend,
      active: data.active,
      notes: data.notes,
      createdAt: new Date(),
      createdBy: data.profileId,
    },
  })
}

export async function updateHrFacilityFuelCard(
  id: string,
  data: Omit<Parameters<typeof createHrFacilityFuelCard>[0], 'profileId'> & {profileId: string},
) {
  assertFuelBudget(data)

  return prismaClient.hrFacilityFuelCard.update({
    where: {id},
    data: {
      vehicleId: data.vehicleId,
      employeeId: data.employeeId,
      cardNumber: data.cardNumber,
      provider: data.provider,
      monthlyBudget: data.monthlyBudget,
      currentMonthSpend: data.currentMonthSpend,
      active: data.active,
      notes: data.notes,
      updatedAt: new Date(),
      updatedBy: data.profileId,
    },
  })
}

export async function softDeleteHrFacilityFuelCard(id: string, profileId: string) {
  return prismaClient.hrFacilityFuelCard.update({
    where: {id},
    data: {deleted: true, deletedAt: new Date(), deletedBy: profileId},
  })
}

export async function createHrFacilityFine(data: {
  vehicleId: string | null
  employeeId: string | null
  fineDate: Date
  amount: number
  referenceNumber: string | null
  description: string | null
  paidByEmployee: boolean
  paidAt: Date | null
  profileId: string
}) {
  return prismaClient.hrFacilityFine.create({
    data: {
      id: crypto.randomUUID(),
      vehicleId: data.vehicleId,
      employeeId: data.employeeId,
      fineDate: data.fineDate,
      amount: data.amount,
      referenceNumber: data.referenceNumber,
      description: data.description,
      paidByEmployee: data.paidByEmployee,
      paidAt: data.paidAt,
      createdAt: new Date(),
      createdBy: data.profileId,
    },
  })
}

export async function updateHrFacilityFine(
  id: string,
  data: Omit<Parameters<typeof createHrFacilityFine>[0], 'profileId'> & {profileId: string},
) {
  return prismaClient.hrFacilityFine.update({
    where: {id},
    data: {
      vehicleId: data.vehicleId,
      employeeId: data.employeeId,
      fineDate: data.fineDate,
      amount: data.amount,
      referenceNumber: data.referenceNumber,
      description: data.description,
      paidByEmployee: data.paidByEmployee,
      paidAt: data.paidAt,
      updatedAt: new Date(),
      updatedBy: data.profileId,
    },
  })
}

export async function softDeleteHrFacilityFine(id: string, profileId: string) {
  return prismaClient.hrFacilityFine.update({
    where: {id},
    data: {deleted: true, deletedAt: new Date(), deletedBy: profileId},
  })
}
