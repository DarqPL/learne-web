import { cn } from '@/lib/utils'
import {
  courseBadgeBaseClass,
  getCourseBadgeClass,
  getCourseBadgeLabel,
  type CourseBadgeKind,
} from './courseBadgeStyles'

export type CourseBadgeProps = {
  kind: CourseBadgeKind
  value: string
  label?: string
  className?: string
}

export function CourseBadge({ kind, value, label, className }: CourseBadgeProps) {
  return (
    <span
      data-slot="course-badge"
      className={cn(courseBadgeBaseClass, getCourseBadgeClass(kind, value), className)}
    >
      {label ?? getCourseBadgeLabel(kind, value)}
    </span>
  )
}
