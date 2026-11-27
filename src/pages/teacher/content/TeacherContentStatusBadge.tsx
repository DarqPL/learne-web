import { Badge } from '@/components/shadcn/ui/badge'
import type { ContentStatus } from '../../../lib/api/types'
import { contentStatusLabels } from './contentLabels'

const statusStyles: Record<ContentStatus, string> = {
  DRAFT: 'border-border bg-muted text-muted-foreground',
  PENDING_REVIEW: 'border-amber-200 bg-amber-100 text-amber-800',
  APPROVED: 'border-emerald-200 bg-emerald-100 text-emerald-800',
  REJECTED: 'border-red-200 bg-red-100 text-red-800',
  HIDDEN: 'border-border bg-muted text-muted-foreground',
}

export function TeacherContentStatusBadge({ status }: { status: ContentStatus }) {
  return (
    <Badge variant="outline" className={statusStyles[status]}>
      {contentStatusLabels[status] ?? status}
    </Badge>
  )
}
