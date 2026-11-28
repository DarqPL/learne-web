import type { ReactNode } from 'react'
import type { HTMLAttributes } from 'react'
import { Alert as ShadcnAlert, type AlertProps as ShadcnAlertProps } from '../shadcn/ui/alert'

type Variant = 'error' | 'success' | 'info' | 'warning'

interface AlertProps {
  variant?: Variant
  children: ReactNode
  className?: string
  role?: HTMLAttributes<HTMLDivElement>['role']
}

const styles: Record<Variant, NonNullable<ShadcnAlertProps['variant']>> = {
  error: 'destructive',
  success: 'success',
  info: 'info',
  warning: 'warning',
}

export function Alert({ variant = 'error', children, className, role }: AlertProps) {
  return <ShadcnAlert role={role ?? (variant === 'error' ? 'alert' : 'status')} className={className} variant={variant === 'error' ? 'destructive' : styles[variant]}>{children}</ShadcnAlert>
}
