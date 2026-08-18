import type { ReactNode } from 'react'

export function Card({ children }: { children: ReactNode }) {
  return <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">{children}</div>
}
