import type { ContentStatus, CoursePricingType, CourseType } from '@/lib/api/types'
import { contentStatusLabels, coursePricingTypeLabels, courseTypeLabels } from '@/pages/teacher/content/contentLabels'

export type CourseBadgeKind = 'status' | 'type' | 'level' | 'payment'

export const courseBadgeBaseClass =
  'inline-flex items-center rounded px-2 py-0.5 text-[12px] font-medium leading-none whitespace-nowrap border-0 shadow-none cursor-default select-none'

const fallbackClass = 'bg-muted text-muted-foreground'
const levelClass = 'bg-taxonomy-3 text-taxonomy-3-foreground'

const statusClasses: Record<ContentStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  PENDING_REVIEW: 'bg-warning-background text-warning-foreground',
  APPROVED: 'bg-success-background text-success-foreground',
  REJECTED: 'bg-destructive/10 text-destructive',
  HIDDEN: 'bg-muted text-muted-foreground',
}

const typeClasses: Record<CourseType, string> = {
  COMPREHENSIVE: 'bg-taxonomy-7 text-taxonomy-7-foreground',
  GRAMMAR: 'bg-taxonomy-1 text-taxonomy-1-foreground',
  LISTENING: 'bg-taxonomy-2 text-taxonomy-2-foreground',
  SPEAKING: 'bg-taxonomy-4 text-taxonomy-4-foreground',
  READING: 'bg-taxonomy-6 text-taxonomy-6-foreground',
  WRITING: 'bg-taxonomy-8 text-taxonomy-8-foreground',
  VOCABULARY: 'bg-taxonomy-5 text-taxonomy-5-foreground',
  PRONUNCIATION: 'bg-taxonomy-3 text-taxonomy-3-foreground',
}

const paymentClasses: Record<CoursePricingType, string> = {
  FREE: 'bg-muted text-muted-foreground',
  PAID: 'bg-info-background text-info-foreground',
}

export function getCourseBadgeClass(kind: CourseBadgeKind, value: string): string {
  if (kind === 'level') return levelClass
  if (kind === 'status') return statusClasses[value as ContentStatus] ?? fallbackClass
  if (kind === 'type') return typeClasses[value as CourseType] ?? fallbackClass
  return paymentClasses[value as CoursePricingType] ?? fallbackClass
}

export function getCourseBadgeLabel(kind: CourseBadgeKind, value: string): string {
  if (kind === 'level') return value
  if (kind === 'status') return contentStatusLabels[value as ContentStatus] ?? value
  if (kind === 'type') return courseTypeLabels[value as CourseType] ?? value
  return coursePricingTypeLabels[value as CoursePricingType] ?? value
}
