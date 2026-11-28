import type { InputHTMLAttributes } from 'react'
import { Input as ShadcnInput } from '../shadcn/ui/input'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <ShadcnInput className={className} {...props} />
  )
}
