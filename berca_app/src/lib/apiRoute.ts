import 'server-only'
import type {NextRequest, NextResponse} from 'next/server'
import type {ZodType} from 'zod/v4'
import {z} from 'zod/v4'
import type {Profile} from '@/models/users'
import {getSessionProfileFromCookie} from '@/lib/sessionUtils'
import type {ApiRoute} from '@/models/apiRoute'
import {badRequest, internalServerError, ok, unauthorized} from '@/lib/routeResponses'
import {validateSchema} from '@/lib/validateSchema'
import {convertFormData} from '@/lib/convertFormData'
import type {Logger} from 'pino'
import {getLogger} from '@/lib/logger'
import {validateJwtToken} from '@/lib/jwtUtils'
import type {Role} from '@/generated/prisma/client'
import {prismaClient} from '@/dal/prismaClient'
import {binaryToUuid} from '@/lib/utils'

const emptySchema = z.object({})
type EmptySchema = ZodType<typeof emptySchema>

type PublicContext<Schema extends ZodType> = {data: z.infer<Schema>; logger: Logger; request: NextRequest}
type ProtectedContext<Schema extends ZodType> = PublicContext<Schema> & {profile: Profile}
type Context<Schema extends ZodType, Auth extends boolean> = Auth extends true
  ? ProtectedContext<Schema>
  : PublicContext<Schema>

type WrappedPublicAPIRouteFn<Params, Schema extends ZodType, Auth extends boolean> = (
  context: Context<Schema, Auth>,
  params: Params,
) => Promise<NextResponse | void> | NextResponse | void

interface ApiRouteOptions<Params, Schema extends ZodType, Auth extends boolean> {
  // The API function which contains the logic for the given function.
  routeFn: WrappedPublicAPIRouteFn<Params, Schema, Auth>

  // Whether the user should be logged in to use this route.
  authenticated?: Auth

  // The schema used to validate the submitted data.
  schema?: Schema

  // The source of the data, either the query body, the URL search params or submitted form data.
  type?: 'body' | 'searchParams' | 'form'

  // The type of authentication used, either a JWT token in the header (for external clients), or a session cookie (for
  // calls from the Next app). Defaults to JWT authentication.
  authenticationType?: 'jwt' | 'cookie'

  // The roles by which the server function can be executed, if no argument was passed, anyone can execute the function.
  requiredRoles?: Role[]
}

/**
 * A utility function used to abstract the common logic of API routes which are only accessible by all users (including
 * unauthenticated ones).
 *
 * @param options An object containing the configuration for the API route.
 */
export function publicApiRoute<Params, Schema extends ZodType>(
  options: Omit<ApiRouteOptions<Params, Schema, false>, 'authenticated' | 'requiredRoles' | 'authenticationType'>,
) {
  return apiRoute<Params, Schema, false>({...options, authenticated: false})
}

/**
 * A utility function used to abstract the common logic of API routes which are only accessible by authenticated
 * users.
 *
 * @param options An object containing the configuration for the API route.
 */
export function protectedApiRoute<Params, Schema extends ZodType = EmptySchema>(
  options: Omit<ApiRouteOptions<Params, Schema, true>, 'authenticated'>,
) {
  return apiRoute<Params, Schema, true>(options)
}

function apiRoute<Params = unknown, Schema extends ZodType = EmptySchema, Auth extends boolean = true>(
  options: ApiRouteOptions<Params, Schema, Auth>,
): ApiRoute<Params> {
  const start = Date.now()
  const authenticated = options?.authenticated === undefined ? true : options?.authenticated
  const type = options?.type ?? 'body'
  const schema = options?.schema ?? emptySchema
  const authenticationType = options?.authenticationType ?? 'jwt'

  return async (request: NextRequest, {params}: {params: Promise<Params>}) => {
    const [logger, awaitedParams] = await Promise.all([getLogger(), params])

    let profile: Profile | null | undefined = null

    if (authenticationType === 'jwt' && authenticated) {
      logger.trace(`Checking authentication through HTTP headers.`)
      const [_, token] = (request.headers.get('Authorization') || ' ').split(' ')
      const tokenBody = validateJwtToken(token)

      if (tokenBody) {
        profile = await prismaClient.employee.findUnique({
          where: {id: tokenBody.id},
          include: {Role_Employee_roleIdToRole: true},
        })
      }
    } else if (authenticated) {
      logger.trace(`Checking authentication through a session cookie.`)
      profile = await getSessionProfileFromCookie()
    }

    if (
      (!profile && authenticated) ||
      (profile && options.requiredRoles && !options.requiredRoles.includes(profile.Role_Employee_roleIdToRole!))
    ) {
      logger.warn(`Unauthorized user ${binaryToUuid(profile!.id)} tried executing API Route.`)
      return unauthorized()
    }

    let unvalidatedData: unknown

    if (type === 'body') {
      unvalidatedData = await getBody(request)
    } else if (type === 'searchParams') {
      unvalidatedData = Object.fromEntries(request.nextUrl.searchParams.entries())
    } else {
      unvalidatedData = await getFormData(request)
    }
    const {data, errors} = validateSchema(schema, unvalidatedData)

    if (errors || !data) {
      return badRequest(errors)
    }

    try {
      const context = {request, data, profile, logger} as Context<Schema, Auth>
      const result = await options.routeFn(context, awaitedParams)
      logger.info(`API Route completed successfully in ${Date.now() - start} ms`)
      return result ?? ok()
    } catch (error) {
      logger.error(error)
      return internalServerError()
    }
  }
}

/**
 * Utility function which retrieves the body of the request and gracefully fails with an empty object when there is no
 * parsable body.
 *
 * @param request The request from which to retrieve the body.
 */
async function getBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json()
  } catch (error) {
    if (error instanceof Error && error.message === 'Unexpected end of JSON input') {
      return {}
    }

    throw error
  }
}

/**
 * Utility function which retrieves the submitted form data of the request and gracefully fails with an empty object
 * when there is no parsable form submission.
 *
 * @param request The request from which to retrieve the form data.
 */
async function getFormData(request: NextRequest): Promise<unknown> {
  try {
    return convertFormData(await request.formData())
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Content-Type was not one of "multipart/form-data" or "application/x-www-form-urlencoded".'
    ) {
      return {}
    }

    throw error
  }
}
