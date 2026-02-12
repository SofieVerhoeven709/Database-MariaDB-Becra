import type {Path, UseFormProps, UseFormReturn} from 'react-hook-form'
import {useForm} from 'react-hook-form'
import type {ZodObject} from 'zod/v4'
import {useActionState, useEffect} from 'react'
import type {FormAction, FormActionDispatch, FormActionResponse} from '@/models/serverFunctions'
import {standardSchemaResolver} from '@hookform/resolvers/standard-schema'
import type {input, output} from 'zod'

const initialFormState = {
  success: false,
}

type UseZodValidatedFormReturn<Schema extends ZodObject, ReturnType> = [
  UseFormReturn<input<Schema>, unknown, output<Schema>>,
  FormActionDispatch,
  FormActionResponse<ReturnType>,
]

export function useZodValidatedForm<Schema extends ZodObject, ReturnType>(
  schema: Schema,
  action: FormAction<ReturnType>,
  props?: UseFormProps<input<Schema>, unknown, output<Schema>>,
): UseZodValidatedFormReturn<Schema, ReturnType> {
  const [state, dispatch] = useActionState(action, initialFormState as FormActionResponse<ReturnType>)
  const form = useForm<input<Schema>, unknown, output<Schema>>({
    resolver: standardSchemaResolver(schema),
    ...props,
  })

  useEffect(() => {
    if (state?.submittedData) {
      // Reset the form with the data which was returned from the server.
      form.reset(state.submittedData as input<Schema>)
    }
    if (state?.errors) {
      Object.keys(state.errors).forEach(field =>
        form.setError(field === 'errors' ? 'root' : (field as Path<input<Schema>>), {
          type: 'manual',
          message: state.errors![field]?.join(', '),
        }),
      )
    }
  }, [state, form])

  return [form, dispatch, state]
}
