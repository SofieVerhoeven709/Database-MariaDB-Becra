import type {ZodType, z} from 'zod/v4'

export type ValidationErrors = Record<string, string[] | undefined>
export type FormActionResponse<ReturnType = void> = {
  errors?: ValidationErrors
  success: boolean
  submittedData?: Record<string, string>
  data?: ReturnType
}

export type FormAction<ReturnType> = (
  prevState: FormActionResponse<ReturnType>,
  formData: FormData,
) => Promise<FormActionResponse<ReturnType>>
export type FormActionDispatch = (payload: FormData) => void
export type ServerFunction<Schema extends ZodType> = (data: z.infer<Schema>) => Promise<void>
export type ServerFunctionWithoutParams = () => Promise<void>
