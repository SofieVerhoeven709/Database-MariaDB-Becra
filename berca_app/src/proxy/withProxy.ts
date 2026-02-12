import type {NextProxy, NextRequest} from 'next/server'
import {NextResponse} from 'next/server'
import type {SessionWithProfile} from '@/models/users'
import {getSessionFromCookie} from '@/lib/sessionUtils'

export type ChainedProxy = (
  request: NextRequest,
  response: NextResponse,
  session: SessionWithProfile | null,
) => Promise<NextResponse> | NextResponse

export async function chainProxy(request: NextRequest, ...functions: ChainedProxy[]): Promise<NextResponse> {
  let response = NextResponse.next()
  // Skip internal Next files and any requests for static assets (paths that end with an extension).
  if (request.nextUrl.pathname.startsWith('/_next') || request.nextUrl.pathname.match(/.*\.[^.]+$/)) return response

  const session = await getSessionFromCookie(false)

  for (const fn of functions) {
    response = await fn(request, response, session)
  }

  return response
}

export function withProxy(...functions: ChainedProxy[]): NextProxy {
  return async (request: NextRequest) => await chainProxy(request, ...functions)
}
