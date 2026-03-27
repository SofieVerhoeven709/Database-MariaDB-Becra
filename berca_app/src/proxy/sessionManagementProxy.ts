import type {NextRequest, NextResponse} from 'next/server'
import {extendSessionAndSetCookie} from '@/lib/sessionUtils'
import {SessionDuration} from '@/constants'
import type {SessionWithProfile} from '@/models/employees'
import {getLogger} from '@/lib/logger'

export async function sessionManagementProxy(
  _: NextRequest,
  response: NextResponse,
  session: SessionWithProfile | null,
): Promise<NextResponse> {
  if (!session || session.activeUntil.getTime() < Date.now()) return response
  const logger = await getLogger()

  type RoleLevelEmployeeItem = NonNullable<typeof session.Employee>['RoleLevelEmployee'][0]

  const highestSubRole = session.Employee.RoleLevelEmployee.reduce<RoleLevelEmployeeItem | null>((highest, current) => {
    if (!highest) return current
    return current.RoleLevel.SubRole.level > highest.RoleLevel.SubRole.level ? current : highest
  }, null)?.RoleLevel.SubRole

  if (!highestSubRole) return response

  if (session.activeUntil.getTime() - Date.now() < SessionDuration[highestSubRole.name] / 2) {
    await extendSessionAndSetCookie(session.id, highestSubRole)
    logger.info(`Extended session ${session.id} by ${SessionDuration[highestSubRole.name]} ms`)
  }

  return response
}
