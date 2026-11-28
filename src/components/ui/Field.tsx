import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'
import { Label } from '../shadcn/ui/label'

interface FieldProps {
  label: string
  error?: string
  children: ReactNode
}

export function Field({ label, error, children }: FieldProps) {
  const generatedId = useId()
  const errorId = `${generatedId}-error`
  const child = children as ReactElement<{ id?: string; htmlFor?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }>
  const labelFor = isValidElement(child) ? child.props.id ?? generatedId : undefined
  const control = isValidElement(child)
    ? cloneElement(child, {
        id: child.props.id ?? generatedId,
        'aria-invalid': error ? true : child.props['aria-invalid'],
        'aria-describedby': [child.props['aria-describedby'], error ? errorId : undefined].filter(Boolean).join(' ') || undefined,
      })
    : children
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={labelFor}>{label}</Label>
      {control}
      {error ? <span id={errorId} className="text-sm text-destructive">{error}</span> : null}
    </div>
  )
}
