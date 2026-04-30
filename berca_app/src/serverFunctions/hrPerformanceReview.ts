'use server'

import {revalidatePath} from 'next/cache'
import {getDepartmentByIdOrThrow} from '@/dal/department'
import {
  createHrEmployeeOvertime,
  softDeleteHrEmployeeOvertime,
  updateHrEmployeeOvertime,
  updateHrPerformanceSettings,
} from '@/dal/hrPerformanceReview'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {
  createHrEmployeeOvertimeSchema,
  deleteHrEmployeeOvertimeSchema,
  updateHrEmployeeOvertimeSchema,
  updateHrPerformanceSettingsSchema,
} from '@/schemas/hrPerformanceReviewSchemas'
import {getDepartmentRoleInfo} from '@/lib/utils'
import type {Profile} from '@/models/employees'

function revalidatePerformanceViews(departmentId: string) {
  revalidatePath('/dashboard')
  revalidatePath(`/departments/${departmentId}/performance`)
}

async function assertHrPerformancePermission(profile: Profile, departmentId: string) {
  const department = await getDepartmentByIdOrThrow(departmentId)
  const {currentUserLevel} = getDepartmentRoleInfo(profile, department.name)

  if (currentUserLevel < 80) {
    throw new Error('Only HR users with manager permission can manage performance overtime.')
  }
}

export const updateHrPerformanceSettingsAction = protectedServerFunction({
  schema: updateHrPerformanceSettingsSchema,
  functionName: 'Update HR performance settings',
  serverFn: async ({data, profile, logger}) => {
    const {departmentId, ...settings} = data

    await assertHrPerformancePermission(profile, departmentId)
    await updateHrPerformanceSettings(settings)

    logger.info(`HR performance settings updated for employee ${data.employeeId}`)
    revalidatePerformanceViews(departmentId)
  },
})

export const createHrEmployeeOvertimeAction = protectedServerFunction({
  schema: createHrEmployeeOvertimeSchema,
  functionName: 'Create HR employee overtime',
  globalErrorMessage: 'Overtime could not be saved. Check the employee overtime limit and on-site time registry.',
  serverFn: async ({data, profile, logger}) => {
    const {departmentId, ...overtime} = data

    await assertHrPerformancePermission(profile, departmentId)
    await createHrEmployeeOvertime({
      ...overtime,
      profileId: profile.id,
    })

    logger.info(`HR overtime created for employee ${data.employeeId}`)
    revalidatePerformanceViews(departmentId)
  },
})

export const updateHrEmployeeOvertimeAction = protectedServerFunction({
  schema: updateHrEmployeeOvertimeSchema,
  functionName: 'Update HR employee overtime',
  globalErrorMessage: 'Overtime could not be saved. Check the employee overtime limit and on-site time registry.',
  serverFn: async ({data, profile, logger}) => {
    const {id, departmentId, ...overtime} = data

    await assertHrPerformancePermission(profile, departmentId)
    await updateHrEmployeeOvertime(id, {
      ...overtime,
      profileId: profile.id,
    })

    logger.info(`HR overtime updated: ${id}`)
    revalidatePerformanceViews(departmentId)
  },
})

export const deleteHrEmployeeOvertimeAction = protectedServerFunction({
  schema: deleteHrEmployeeOvertimeSchema,
  functionName: 'Delete HR employee overtime',
  serverFn: async ({data, profile, logger}) => {
    await assertHrPerformancePermission(profile, data.departmentId)
    await softDeleteHrEmployeeOvertime(data.id, profile.id)

    logger.info(`HR overtime deleted: ${data.id}`)
    revalidatePerformanceViews(data.departmentId)
  },
})
