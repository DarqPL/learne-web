import { useState, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
import { Input } from './Input'

export function PasswordInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input {...props} type={show ? 'text' : 'password'} className={cn(className, 'pr-14')} />
      <button
        type="button"
        onClick={() => setShow((value) => !value)}
        className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {show ? 'Ẩn' : 'Hiện'}
      </button>
    </div>
  )
}
