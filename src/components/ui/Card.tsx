import type { ReactNode } from 'react'
import { Card as ShadcnCard, CardContent } from '../shadcn/ui/card'

export function Card({ children }: { children: ReactNode }) {
  return <ShadcnCard className="w-full max-w-md gap-0 p-0"><CardContent className="p-8">{children}</CardContent></ShadcnCard>
}
