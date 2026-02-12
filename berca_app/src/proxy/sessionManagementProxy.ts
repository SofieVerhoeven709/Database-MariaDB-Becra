import type {NextRequest, NextResponse} from 'next/server'
import {extendSessionAndSetCookie} from '@/lib/sessionUtils'
import {SessionDuration} from '@/constants'
import type {SessionWithProfile} from '@/models/users'
import {getLogger} from '@/lib/logger'

export async function sessionManagementProxy(
  _: NextRequest,
  response: NextResponse,
  session: SessionWithProfile | null,
): Promise<NextResponse> {
  if (!session || session.activeUntil.getTime() < Date.now()) return response
  const logger = await getLogger()

  if (session.activeUntil.getTime() - Date.now() < SessionDuration[session.user.role] / 2) {
    await extendSessionAndSetCookie(session.id, session.user.role)
    logger.info(`Extended session ${session.id} by ${SessionDuration[session.user.role]} ms`)
  }

  return response
}
