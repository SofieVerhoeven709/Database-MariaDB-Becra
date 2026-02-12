import type {FunctionComponent, HTMLAttributes, HTMLProps} from 'react'
import {useId} from 'react'
import {Label} from '@/components/ui/label'
import {Input} from '@/components/ui/input'
import {useFormContext} from 'react-hook-form'
import {cn} from '@/lib/utils'
import FormError from '@/components/custom/formError'

interface FormInputProps extends HTMLProps<HTMLInputElement> {
  name: string
  label?: string
  DecorationLeft?: FunctionComponent<HTMLAttributes<HTMLElement>>
  DecorationRight?: FunctionComponent<HTMLAttributes<HTMLElement>>
}

/**
 * A reusable form input component that integrates with react-hook-form.
 *
 * @param label The label for the input field.
 * @param name The name of the input field, used for form registration.
 * @param className Optional additional CSS classes for styling the input container.
 * @param decorationLeft
 * @param inputProps Additional properties for the input element, such as type, placeholder, etc.
 * @constructor
 */
const FormInput: FunctionComponent<FormInputProps> = ({
  label,
  name,
  className,
  DecorationLeft,
  DecorationRight,
  ...inputProps
}) => {
  const form = useFormContext()
  const id = useId()

  return (
    <div className={cn('flex flex-col gap-2 mb-2 grow', className)}>
      <Label htmlFor={id} hidden={label === undefined}>
        {label}
      </Label>
      <div className="flex gap-0">
        {DecorationRight && (
          <div className="h-9 flex items-center border rounded bg-input rounded-e-none ">
            <DecorationRight className="border rounded rounded-e-none" />
          </div>
        )}
        <Input
          id={id}
          {...form.register(name)}
          className={cn({
            'rounded-e-none': !!DecorationLeft,
            'rounded-s-none': !!DecorationRight,
          })}
          {...inputProps}
        />
        {DecorationLeft && (
          <div className="h-9 flex items-center border rounded bg-input rounded-s-none">
            <DecorationLeft />
          </div>
        )}
      </div>
      <FormError path={name} />
    </div>
  )
}

export default FormInput
