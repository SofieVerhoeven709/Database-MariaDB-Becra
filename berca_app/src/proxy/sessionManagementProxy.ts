import type {NextRequest, NextResponse} from 'next/server'
import {extendSessionAndSetCookie} from '@/lib/sessionUtils'
import {SessionDuration} from '@/constants'
import type {SessionWithProfile} from '@/models/users'
import {getLogger} from '@/lib/logger'
import {binaryToUuid} from '@/lib/utils'

export async function sessionManagementProxy(
  _: NextRequest,
  response: NextResponse,
  session: SessionWithProfile | null,
): Promise<NextResponse> {
  if (!session || session.activeUntil.getTime() < Date.now()) return response
  const logger = await getLogger()

  if (
    session.activeUntil.getTime() - Date.now() <
    SessionDuration[session.Employee.Role_Employee_roleIdToRole!.name] / 2
  ) {
    await extendSessionAndSetCookie(session.id, session.Employee.Role_Employee_roleIdToRole!)
    logger.info(
      `Extended session ${binaryToUuid(session.id)} by ${SessionDuration[session.Employee.Role_Employee_roleIdToRole!.name]} ms`,
    )
  }

  return response
}
