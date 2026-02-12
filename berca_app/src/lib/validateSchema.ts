import type {ZodType} from 'zod/v4'
import {z} from 'zod/v4'
import {convertFormData} from '@/lib/convertFormData'

type ValidationResult<Schema extends ZodType> =
  | {data: null; errors: Record<string, string[] | undefined>}
  | {
      data: z.infer<Schema>
      errors: null
    }

/**
 * Validate the given data against the given ZodType.
 *
 * @param schema The schema to validate the data against.
 * @param data The data to validate, either FormData or a plain object.
 * @return An object which either contains the validated data or the validation errors.
 */
export function validateSchema<Schema extends ZodType>(schema: Schema, data: unknown): ValidationResult<Schema> {
  // In case z.void() was used as schema, the type of the data argument is function.
  // To successfully validate the data, we need to convert it to undefined.
  const result = schema.safeParse(
    data instanceof FormData ? convertFormData(data) : typeof data === 'function' ? {} : data,
  )

  return result.success
    ? {data: result.data as z.infer<Schema>, errors: null}
    : {data: null, errors: z.flattenError(result.error).fieldErrors}
}
