import type {FunctionComponent} from 'react'
import {useFormContext} from 'react-hook-form'

interface FormErrorProps {
  path: string
}

const FormError: FunctionComponent<FormErrorProps> = ({path}) => {
  const {
    formState: {errors: formErrors},
  } = useFormContext()
  const formError = path.split('.').reduce((acc, key) => (acc ? (acc[key] as object) : {}), formErrors) as {
    message?: string
  }
  return <div className="text-muted-foreground text-xs">{formError?.message ?? <span>&nbsp;</span>}</div>
}

export default FormError
