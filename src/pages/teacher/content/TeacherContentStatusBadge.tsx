import type { ContentStatus } from '../../../lib/api/types'
import { contentStatusLabels, contentStatusStyles } from './contentLabels'

export function TeacherContentStatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${contentStatusStyles[status]}`}>
      {contentStatusLabels[status]}
    </span>
  )
}
