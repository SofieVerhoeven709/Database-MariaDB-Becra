import type {FormEventHandler, FormHTMLAttributes, PropsWithChildren} from 'react'
import {useRef} from 'react'
import type {FieldPath, FieldValues, UseFormReturn} from 'react-hook-form'
import {FormProvider} from 'react-hook-form'
import {CircleX} from 'lucide-react'

interface FormProps<TFieldValues extends FieldValues, TContext = unknown, TTransformedValues = TFieldValues>
  extends PropsWithChildren,
    FormHTMLAttributes<HTMLFormElement> {
  hookForm: UseFormReturn<TFieldValues, TContext, TTransformedValues>
  action: (data: FormData) => void
  id?: string
}

function Form<TFieldValues extends FieldValues, TContext = unknown, TTransformedValues = TFieldValues>({
  id,
  children,
  action,
  hookForm,
  ...formAttributes
}: FormProps<TFieldValues, TContext, TTransformedValues>) {
  const {handleSubmit, formState} = hookForm
  const formRef = useRef<HTMLFormElement>(null)
  const hasBeenValidated = useRef<boolean>(false)

  const onSubmitHandler: FormEventHandler = evt => {
    if (!hasBeenValidated.current) {
      // If the form has not yet been validated on the client side, we need to prevent the default action (submitting).
      evt.preventDefault()

      // Validate the form using react-hook-form.
      void handleSubmit(() => {
        hasBeenValidated.current = true
        // Because state and ref update are async and grouped, we cannot immediately re-submit the form because
        // this wouldn't give React time to register the updated value of `hasBeenValidated` before the next submit is
        // handled.
        setTimeout(() => formRef.current?.requestSubmit(), 0)
      })(evt)
    } else {
      // Reset to ensure that the form is validated again on the next submit.
      hasBeenValidated.current = false
    }
  }

  return (
    <FormProvider {...hookForm}>
      <form ref={formRef} action={action} {...formAttributes} onSubmit={onSubmitHandler}>
        {id && <input type="hidden" {...hookForm.register('id' as FieldPath<TFieldValues>)} defaultValue={id} />}
        {formState.errors.root && (
          <div className="border border-destructive p-2 rounded my-4 flex items-center gap-4">
            <CircleX className="text-destructive w-20 self-start " />
            {formState.errors.root.message}
          </div>
        )}
        {children}
      </form>
    </FormProvider>
  )
}

export default Form
