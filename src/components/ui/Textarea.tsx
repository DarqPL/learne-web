import type { Ref, TextareaHTMLAttributes } from 'react'
import { Textarea as ShadcnTextarea } from '../shadcn/ui/textarea'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  ref?: Ref<HTMLTextAreaElement>
}

export function Textarea({ className, ref, ...props }: TextareaProps) {
  return (
    <ShadcnTextarea ref={ref} className={className} {...props} />
  )
}
