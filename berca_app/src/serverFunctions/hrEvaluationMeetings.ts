'use server'

import {revalidatePath} from 'next/cache'
import {
  createHrEvaluationMeeting,
  softDeleteHrEvaluationMeeting,
  updateHrEvaluationMeeting,
} from '@/dal/hrEvaluationMeetings'
import {protectedServerFunction} from '@/lib/serverFunctions'
import {
  createHrEvaluationMeetingSchema,
  hrEvaluationMeetingIdSchema,
  updateHrEvaluationMeetingSchema,
} from '@/schemas/hrEvaluationMeetingSchemas'

function revalidateHrEvaluationViews(departmentId: string) {
  revalidatePath('/dashboard')
  revalidatePath(`/departments/${departmentId}/schedule`)
  revalidatePath(`/departments/${departmentId}/performance`)
}

export const createHrEvaluationMeetingAction = protectedServerFunction({
  schema: createHrEvaluationMeetingSchema,
  functionName: 'Create HR evaluation meeting',
  serverFn: async ({data, profile, logger}) => {
    const {departmentId, ...meetingData} = data

    await createHrEvaluationMeeting({
      ...meetingData,
      profileId: profile.id,
    })

    logger.info(`HR evaluation meeting created for employee ${data.employeeId}`)
    revalidateHrEvaluationViews(departmentId)
  },
})

export const updateHrEvaluationMeetingAction = protectedServerFunction({
  schema: updateHrEvaluationMeetingSchema,
  functionName: 'Update HR evaluation meeting',
  serverFn: async ({data, logger}) => {
    const {id, departmentId, ...meetingData} = data

    await updateHrEvaluationMeeting(id, meetingData)

    logger.info(`HR evaluation meeting updated: ${id}`)
    revalidateHrEvaluationViews(departmentId)
  },
})

export const deleteHrEvaluationMeetingAction = protectedServerFunction({
  schema: hrEvaluationMeetingIdSchema,
  functionName: 'Delete HR evaluation meeting',
  serverFn: async ({data, profile, logger}) => {
    await softDeleteHrEvaluationMeeting(data.id, profile.id)

    logger.info(`HR evaluation meeting deleted: ${data.id}`)
    revalidateHrEvaluationViews(data.departmentId)
  },
})
