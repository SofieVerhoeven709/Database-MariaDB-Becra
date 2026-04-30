'use server'

import {revalidatePath} from 'next/cache'
import {getDepartmentByIdOrThrow} from '@/dal/department'
import {
  createHrFacilityFine,
  createHrFacilityFuelCard,
  createHrFacilityVehicle,
  softDeleteHrFacilityFine,
  softDeleteHrFacilityFuelCard,
  softDeleteHrFacilityVehicle,
  updateHrFacilityFine,
  updateHrFacilityFuelCard,
  updateHrFacilityVehicle,
} from '@/dal/hrFacility'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {getDepartmentRoleInfo} from '@/lib/utils'
import type {Profile} from '@/models/employees'
import {
  createHrFacilityFineSchema,
  createHrFacilityFuelCardSchema,
  createHrFacilityVehicleSchema,
  deleteHrFacilityFineSchema,
  deleteHrFacilityFuelCardSchema,
  deleteHrFacilityVehicleSchema,
  updateHrFacilityFineSchema,
  updateHrFacilityFuelCardSchema,
  updateHrFacilityVehicleSchema,
} from '@/schemas/hrFacilitySchemas'

function revalidateFacilityViews(departmentId: string) {
  revalidatePath('/dashboard')
  revalidatePath(`/departments/${departmentId}/facility`)
}

async function assertHrFacilityPermission(profile: Profile, departmentId: string) {
  const department = await getDepartmentByIdOrThrow(departmentId)
  const {currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

  if (currentUserLevel < 80) {
    throw new Error('Only HR users with manager permission can manage facility records.')
  }
}

export const createHrFacilityVehicleAction = protectedServerFunction({
  schema: createHrFacilityVehicleSchema,
  functionName: 'Create HR facility vehicle',
  globalErrorMessage: 'Vehicle could not be saved. Check the license plate and linked records.',
  serverFn: async ({data, profile, logger}) => {
    const {departmentId, ...vehicle} = data

    await assertHrFacilityPermission(profile, departmentId)
    await createHrFacilityVehicle({...vehicle, profileId: profile.id})

    logger.info('HR facility vehicle created')
    revalidateFacilityViews(departmentId)
  },
})

export const updateHrFacilityVehicleAction = protectedServerFunction({
  schema: updateHrFacilityVehicleSchema,
  functionName: 'Update HR facility vehicle',
  globalErrorMessage: 'Vehicle could not be saved. Check the license plate and linked records.',
  serverFn: async ({data, profile, logger}) => {
    const {id, departmentId, ...vehicle} = data

    await assertHrFacilityPermission(profile, departmentId)
    await updateHrFacilityVehicle(id, {...vehicle, profileId: profile.id})

    logger.info(`HR facility vehicle updated: ${id}`)
    revalidateFacilityViews(departmentId)
  },
})

export const deleteHrFacilityVehicleAction = protectedServerFunction({
  schema: deleteHrFacilityVehicleSchema,
  functionName: 'Delete HR facility vehicle',
  serverFn: async ({data, profile, logger}) => {
    await assertHrFacilityPermission(profile, data.departmentId)
    await softDeleteHrFacilityVehicle(data.id, profile.id)

    logger.info(`HR facility vehicle deleted: ${data.id}`)
    revalidateFacilityViews(data.departmentId)
  },
})

export const createHrFacilityFuelCardAction = protectedServerFunction({
  schema: createHrFacilityFuelCardSchema,
  functionName: 'Create HR facility fuel card',
  globalErrorMessage: 'Fuel card could not be saved. The monthly fuel budget may not be exceeded.',
  serverFn: async ({data, profile, logger}) => {
    const {departmentId, ...fuelCard} = data

    await assertHrFacilityPermission(profile, departmentId)
    await createHrFacilityFuelCard({...fuelCard, profileId: profile.id})

    logger.info('HR facility fuel card created')
    revalidateFacilityViews(departmentId)
  },
})

export const updateHrFacilityFuelCardAction = protectedServerFunction({
  schema: updateHrFacilityFuelCardSchema,
  functionName: 'Update HR facility fuel card',
  globalErrorMessage: 'Fuel card could not be saved. The monthly fuel budget may not be exceeded.',
  serverFn: async ({data, profile, logger}) => {
    const {id, departmentId, ...fuelCard} = data

    await assertHrFacilityPermission(profile, departmentId)
    await updateHrFacilityFuelCard(id, {...fuelCard, profileId: profile.id})

    logger.info(`HR facility fuel card updated: ${id}`)
    revalidateFacilityViews(departmentId)
  },
})

export const deleteHrFacilityFuelCardAction = protectedServerFunction({
  schema: deleteHrFacilityFuelCardSchema,
  functionName: 'Delete HR facility fuel card',
  serverFn: async ({data, profile, logger}) => {
    await assertHrFacilityPermission(profile, data.departmentId)
    await softDeleteHrFacilityFuelCard(data.id, profile.id)

    logger.info(`HR facility fuel card deleted: ${data.id}`)
    revalidateFacilityViews(data.departmentId)
  },
})

export const createHrFacilityFineAction = protectedServerFunction({
  schema: createHrFacilityFineSchema,
  functionName: 'Create HR facility fine',
  globalErrorMessage: 'Fine could not be saved. Check the linked vehicle, employee and amount.',
  serverFn: async ({data, profile, logger}) => {
    const {departmentId, ...fine} = data

    await assertHrFacilityPermission(profile, departmentId)
    await createHrFacilityFine({...fine, profileId: profile.id})

    logger.info('HR facility fine created')
    revalidateFacilityViews(departmentId)
  },
})

export const updateHrFacilityFineAction = protectedServerFunction({
  schema: updateHrFacilityFineSchema,
  functionName: 'Update HR facility fine',
  globalErrorMessage: 'Fine could not be saved. Check the linked vehicle, employee and amount.',
  serverFn: async ({data, profile, logger}) => {
    const {id, departmentId, ...fine} = data

    await assertHrFacilityPermission(profile, departmentId)
    await updateHrFacilityFine(id, {...fine, profileId: profile.id})

    logger.info(`HR facility fine updated: ${id}`)
    revalidateFacilityViews(departmentId)
  },
})

export const deleteHrFacilityFineAction = protectedServerFunction({
  schema: deleteHrFacilityFineSchema,
  functionName: 'Delete HR facility fine',
  serverFn: async ({data, profile, logger}) => {
    await assertHrFacilityPermission(profile, data.departmentId)
    await softDeleteHrFacilityFine(data.id, profile.id)

    logger.info(`HR facility fine deleted: ${data.id}`)
    revalidateFacilityViews(data.departmentId)
  },
})
