'use server'

import {revalidatePath} from 'next/cache'
import {updateHrHseIncludeField} from '@/dal/hrHseFile'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {updateHrHseIncludeFieldSchema} from '@/schemas/hrHseFileSchemas'

export const updateHrHseIncludeFieldAction = protectedServerFunction({
  schema: updateHrHseIncludeFieldSchema,
  functionName: 'Update HR HSE include field',
  serverFn: async ({data, profile, logger}) => {
    await updateHrHseIncludeField({
      employeeId: data.employeeId,
      field: data.field,
      value: data.value,
      profileId: profile.id,
    })

    logger.info(`HSE include field ${data.field} updated for employee ${data.employeeId}`)
    revalidatePath(`/departments/${data.departmentId}/hseFile`)
  },
})
