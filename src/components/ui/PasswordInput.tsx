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
        className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        {show ? 'Ẩn' : 'Hiện'}
      </button>
    </div>
  )
}
