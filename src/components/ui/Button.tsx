import type { ButtonHTMLAttributes } from 'react'
import { Spinner } from './Spinner'
import { Button as ShadcnButton } from '../shadcn/ui/button'

type Variant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'link'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: Variant
}

const variants: Record<Variant, 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'> = {
  primary: 'default',
  secondary: 'secondary',
  danger: 'destructive',
  outline: 'outline',
  ghost: 'ghost',
  link: 'link',
}

export function Button({ loading = false, variant = 'primary', type = 'button', className, children, disabled, ...props }: ButtonProps) {
  return (
    <ShadcnButton
      type={type}
      variant={variants[variant]}
      className={className}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner aria-hidden="true" /> : null}
      {children}
    </ShadcnButton>
  )
}
