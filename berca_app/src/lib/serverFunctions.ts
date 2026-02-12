import 'server-only'
import {z, type ZodType} from 'zod/v4'
import type {Profile} from '@/models/users'
import type {
  FormAction,
  FormActionResponse,
  ServerFunction,
  ServerFunctionWithoutParams,
} from '@/models/serverFunctions'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {validateSchema} from '@/lib/validateSchema'
import type {Role} from '@/generated/prisma/enums'
import type {Logger} from 'pino'
import {getLogger} from '@/lib/logger'
import {convertFormData} from '@/lib/convertFormData'

const emptySchema = z.object({})
type EmptySchema = ZodType<typeof emptySchema>

type PublicContext<Schema extends ZodType> = {data: z.infer<Schema>; logger: Logger}
type ProtectedContext<Schema extends ZodType> = PublicContext<Schema> & {profile: Profile}
type Context<Schema extends ZodType, Auth extends boolean> = Auth extends true
  ? ProtectedContext<Schema>
  : PublicContext<Schema>

type WrappedServerFn<Schema extends ZodType, ReturnType, Auth extends boolean> = (
  context: Context<Schema, Auth>,
) => Promise<FormActionResponse<ReturnType> | void>

interface ServerFunctionOptions<Schema extends ZodType, ReturnType, Auth extends boolean> {
  // The function which contains the logic for the given server function or actions
  serverFn: WrappedServerFn<Schema, ReturnType, Auth>
  // The schema to validate the submitted data against, defaults to an empty schema.
  schema?: Schema
  // Whether the function should be protected and require an authenticated user, defaults to true.
  authenticated?: Auth
  // A message to display in case of a server error.
  globalErrorMessage?: string
  // If set, the function will return the specified keys of the submitted data in case of success (useful if you want
  // to stay on the same page and update the form with the new data).
  // If set to true, all keys of the submitted data will be returned, if set to an array, only the specified keys
  // will be returned.
  sendBackOnSuccess?: (keyof z.infer<Schema>)[] | true
  // The roles by which the server function can be executed, if no argument was passed, anyone can execute the function.
  requiredRoles?: Role[]
  // The name of the server function, used in logs.
  functionName: string
}

/**
 * A utility function used to abstract the common logic of form actions which are only accessible by authenticated
 * users.
 *
 * @param options An object containing the configuration for the form action.
 */
export function protectedFormAction<Schema extends ZodType = EmptySchema, ReturnType = void>(
  options: Omit<ServerFunctionOptions<Schema, ReturnType, true>, 'authenticated'>,
): FormAction<ReturnType> {
  return formAction<Schema, ReturnType, true>({...options, authenticated: true})
}

/**
 * A utility function used to abstract the common logic of form actions which are accessible by all users (including
 * unauthenticated ones).
 *
 * @param options An object containing the configuration for the form action.
 */
export function publicFormAction<Schema extends ZodType = EmptySchema, ReturnType = void>(
  options: Omit<ServerFunctionOptions<Schema, ReturnType, false>, 'authenticated' | 'requiredRoles'>,
): FormAction<ReturnType> {
  return formAction<Schema, ReturnType, false>({...options, authenticated: false})
}

/**
 * A utility function used to abstract the common logic of form actions.
 *
 * @param options An object containing the configuration for the form action.
 */
function formAction<Schema extends ZodType = EmptySchema, ReturnType = void, Auth extends boolean = true>(
  options: ServerFunctionOptions<Schema, ReturnType, Auth>,
): FormAction<ReturnType> {
  return async (
    _prevState: FormActionResponse<ReturnType>,
    unvalidatedData: FormData,
  ): Promise<FormActionResponse<ReturnType>> => {
    return handleServerFunction<Schema, ReturnType, Auth>({
      ...options,
      unvalidatedData,
    })
  }
}

/**
 * A utility function used to abstract the common logic of server functions which are only accessible by authenticated
 * users.
 *
 * @param options An object containing the configuration for the server function.
 */
export function protectedServerFunction(
  options: Omit<ServerFunctionOptions<EmptySchema, void, true>, 'authenticated' | 'schema'> & {schema?: undefined},
): ServerFunctionWithoutParams
export function protectedServerFunction<Schema extends ZodType = EmptySchema>(
  options: Omit<ServerFunctionOptions<Schema, void, true>, 'authenticated'>,
): ServerFunction<Schema>
export function protectedServerFunction<Schema extends ZodType = EmptySchema>(
  options: Omit<ServerFunctionOptions<Schema, void, true>, 'authenticated'>,
): ServerFunction<Schema> | ServerFunctionWithoutParams {
  return serverFunction<Schema, true>({...options, authenticated: true})
}

/**
 * A utility function used to abstract the common logic of server functions which are accessible by all users (including
 * unauthenticated ones).
 *
 * @param options An object containing the configuration for the server function.
 */
export function publicServerFunction(
  options: Omit<ServerFunctionOptions<EmptySchema, void, false>, 'authenticated' | 'requiredRoles' | 'schema'> & {
    schema?: undefined
  },
): ServerFunctionWithoutParams
export function publicServerFunction<Schema extends ZodType>(
  options: Omit<ServerFunctionOptions<Schema, void, false>, 'authenticated' | 'requiredRoles'>,
): ServerFunction<Schema>
export function publicServerFunction<Schema extends ZodType = EmptySchema>(
  options: Omit<ServerFunctionOptions<Schema, void, false>, 'authenticated' | 'requiredRoles'>,
): ServerFunction<Schema> | ServerFunctionWithoutParams {
  return serverFunction<Schema, false>({...options, authenticated: false})
}

/**
 * A utility function used to abstract the common logic of server functions.
 *
 * @param options An object containing the configuration for the server function.
 */
function serverFunction<Schema extends ZodType = EmptySchema, Auth extends boolean = true>(
  options: ServerFunctionOptions<Schema, void, Auth>,
): ServerFunction<Schema> | ServerFunctionWithoutParams {
  return async (unvalidatedData?: z.infer<Schema>): Promise<void> => {
    await handleServerFunction<Schema, void, Auth>({
      ...options,
      unvalidatedData: unvalidatedData ?? {},
    })
  }
}

async function handleServerFunction<Schema extends ZodType, ReturnType, Auth extends boolean>(
  options: ServerFunctionOptions<Schema, ReturnType, Auth> & {unvalidatedData: unknown},
): Promise<FormActionResponse<ReturnType>> {
  const start = Date.now()
  const authenticated = options?.authenticated === undefined ? true : options?.authenticated
  const schema = options?.schema ?? emptySchema
  const unvalidatedData = options.unvalidatedData
  const logger = await getLogger()
  const functionName = options.functionName ?? 'Server function'

  logger.info(`${functionName} called`)

  try {
    logger.trace(`Checking authentication for ${functionName}.`)
    const profile = authenticated ? await getSessionProfileFromCookieOrThrow() : undefined

    logger.trace(`Checking authorization for ${functionName}.`)
    if (authenticated && options.requiredRoles && !options.requiredRoles.includes(profile!.role)) {
      logger.warn(`Unauthorized user ${profile?.id} tried executing ${functionName ?? 'a server function'}.`)
      return {
        success: false,
      }
    }

    logger.trace(`Validating submitted data for ${functionName}.`)
    const {data, errors} = validateSchema(schema, unvalidatedData)

    // Generate the data to send back to the client in case of errors, or in case of success if sendBackOnSuccess is set.
    const submittedData = generateSubmittedData(unvalidatedData)

    if (errors) {
      logger.trace(`Validation of submitted data failed for ${functionName}.`)
      return {
        errors,
        success: false,
        submittedData,
      }
    }

    // Generate the return value for submittedData if required and filter out any unwanted keys.
    if (options.sendBackOnSuccess && Array.isArray(options.sendBackOnSuccess)) {
      const keysToSendBack = new Set(options.sendBackOnSuccess)
      Object.keys(submittedData).forEach(key => {
        if (!keysToSendBack.has(key as keyof z.infer<Schema>)) {
          delete submittedData[key]
        }
      })
    }

    // Await is required here, if we return fn directly, any thrown errors are not caught and returned through the
    // promise's catch method.
    const result = await options.serverFn({data, profile, logger} as Context<ZodType, Auth>)
    logger.info(`${functionName} completed successfully in ${Date.now() - start} ms`)
    return result ?? {success: true, submittedData: options.sendBackOnSuccess && submittedData}
  } catch (e) {
    const error = e as Error

    // The Next redirect function works by throwing an error, so we should not catch this error, but throw it again so
    // that Next can properly redirect the user.
    if (error.message === 'NEXT_REDIRECT') {
      logger.info(`${functionName} completed successfully in ${Date.now() - start} ms`)
      throw e
    }

    logger.error({
      msg: `An error occurred in ${functionName}.`,
      error: error.message,
    })
  }

  return {
    errors: {
      errors: [options.globalErrorMessage ?? 'Something went wrong, please ensure you are logged in and try again'],
    },
    success: false,
    submittedData: generateSubmittedData(unvalidatedData),
  }
}

function generateSubmittedData(data: unknown): Record<string, string> {
  if (!(data instanceof FormData)) {
    return data as Record<string, string>
  }

  // This includes duplicate keys, such as a checkbox group merged into an array and multipart keys such as
  // property.0.property2 merged into {property: [{property2: value}]}.
  const formDataObj: Record<string, string> = convertFormData(data)

  // Multipart keys must be sent back as property.0.property2 to be properly re-processed by react-hook-form.
  Object.keys(Object.fromEntries(data.entries()))
    .filter(k => k.includes('.'))
    .forEach(k => {
      // Add the key to the returned object.
      formDataObj[k] = data.get(k) as string

      // Remove the processed multipart key from the object to avoid duplication.
      const firstSegment = k.split('.')[0]
      delete formDataObj[firstSegment]
    })

  return formDataObj
}