import type { ReactNode } from 'react'

export function Card({ children }: { children: ReactNode }) {
  return <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-sm">{children}</div>
}
