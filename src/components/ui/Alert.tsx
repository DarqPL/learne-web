import type { ReactNode } from 'react'

type Variant = 'error' | 'success' | 'info'

interface AlertProps {
  variant?: Variant
  children: ReactNode
}

const styles: Record<Variant, string> = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-green-200 bg-green-50 text-green-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
}

export function Alert({ variant = 'error', children }: AlertProps) {
  return <div className={`rounded-lg border px-4 py-3 text-sm ${styles[variant]}`}>{children}</div>
}
