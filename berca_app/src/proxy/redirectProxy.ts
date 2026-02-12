import type {NextRequest} from 'next/server'
import {NextResponse} from 'next/server'
import {getLogger} from '@/lib/logger'
import type {SessionWithProfile} from '@/models/users'

const uuidV4Regex = new RegExp(/[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}/gi)

const publicRoutes = new Set<string>(['/', '/login', '/register'])

const protectedRoutes = new Set<string>([
  '/contacts',
  '/contacts/new',
  '/contacts/:param',
  '/contacts/:param/edit',
  '/meetings',
  '/meetings/:param',
  '/tags',
  '/tags/:param',
  '/account',
])

const publicRedirects: Record<string, string> = {
  '/login': '/contacts',
  '/register': '/contacts',
}

export async function redirectProxy(
  request: NextRequest,
  response: NextResponse,
  session: SessionWithProfile | null,
): Promise<NextResponse> {
  const parameterizedRoute = request.nextUrl.pathname.replaceAll(uuidV4Regex, ':param')
  const logger = await getLogger()

  if (publicRedirects[parameterizedRoute] && session) {
    return NextResponse.redirect(new URL(publicRedirects[parameterizedRoute], request.url))
  }

  if (publicRoutes.has(parameterizedRoute)) {
    return response
  }

  if (protectedRoutes.has(parameterizedRoute) && session) {
    return response
  }

  if (protectedRoutes.has(parameterizedRoute) && !session) {
    logger.warn(`Someone tried to access ${request.nextUrl.pathname} while unauthenticated.`)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // API Routes must perform their own authentication since these can be called from external applications.
  if (parameterizedRoute.startsWith('/api')) {
    return response
  }

  logger.warn(`Granting access to ${request.nextUrl.pathname} because its access level hasn't been configured.`)

  return response
}
