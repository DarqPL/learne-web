import type { ContentStatus, CoursePricingType, CourseType } from '@/lib/api/types'
import { contentStatusLabels, coursePricingTypeLabels, courseTypeLabels } from '@/pages/teacher/content/contentLabels'

export type CourseBadgeKind = 'status' | 'type' | 'level' | 'payment'

export const courseBadgeBaseClass =
  'inline-flex items-center rounded px-2 py-0.5 text-[12px] font-medium leading-none whitespace-nowrap border-0 shadow-none cursor-default select-none'

const fallbackClass = 'bg-slate-100 text-slate-600'
const levelClass = 'bg-cyan-50 text-cyan-700'

const statusClasses: Record<ContentStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PENDING_REVIEW: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-rose-50 text-rose-700',
  HIDDEN: 'bg-slate-50 text-slate-500',
}

const typeClasses: Record<CourseType, string> = {
  COMPREHENSIVE: 'bg-indigo-50 text-indigo-700',
  GRAMMAR: 'bg-violet-50 text-violet-700',
  LISTENING: 'bg-blue-50 text-blue-700',
  SPEAKING: 'bg-purple-50 text-purple-700',
  READING: 'bg-orange-50 text-orange-700',
  WRITING: 'bg-pink-50 text-pink-700',
  VOCABULARY: 'bg-lime-50 text-lime-700',
  PRONUNCIATION: 'bg-fuchsia-50 text-fuchsia-700',
}

const paymentClasses: Record<CoursePricingType, string> = {
  FREE: 'bg-slate-100 text-slate-600',
  PAID: 'bg-teal-50 text-teal-700',
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
