import { Badge } from '@/components/shadcn/ui/badge'
import type { ContentStatus } from '../../../lib/api/types'
import { contentStatusLabels } from './contentLabels'

const statusVariants: Record<ContentStatus, 'secondary' | 'warning' | 'success' | 'destructive'> = {
  DRAFT: 'secondary',
  PENDING_REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
  HIDDEN: 'secondary',
}

export function TeacherContentStatusBadge({ status }: { status: ContentStatus }) {
  return (
    <Badge variant={statusVariants[status]}>
      {contentStatusLabels[status] ?? status}
    </Badge>
  )
}
