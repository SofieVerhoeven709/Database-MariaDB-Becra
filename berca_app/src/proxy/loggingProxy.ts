import type {NextRequest, NextResponse} from 'next/server'
import {cookies} from 'next/headers'
import type {SessionWithProfile} from '@/models/users'

export async function loggingProxy(
  request: NextRequest,
  response: NextResponse,
  session: SessionWithProfile | null,
): Promise<NextResponse> {
  const awaitedCookies = await cookies()

  // Proxy wordt uitgevoerd in een afgezonderd proces, hierdoor kunnen we geen variabelen delen tussen proxy en de rest
  // van de Node applicatie.
  // In plaats daarvan kan informatie doorgegeven worden via HTTP Headers.
  // Let op, je mag dit niet gebruiken voor grote of gevoelige informatie.
  const requestId = crypto.randomUUID()
  response.headers.set('x-request-id', requestId)
  response.headers.set('x-request-path', request.nextUrl.pathname)
  response.headers.set('x-request-method', request.method)

  if (session) {
    response.headers.set('x-session-id', session.id)
    response.headers.set('x-user-id', session.userId)
  }

  // Om het id op de client weer te geven, moet dit in een cookie bewaard worden.
  // Aangezien het cookie getoond moet kunnen worden op de webpagina, moet de httpOnly vlag op false staan.
  awaitedCookies.set({
    name: 'requestId',
    value: requestId,
    httpOnly: false,
  })

  return response
}
