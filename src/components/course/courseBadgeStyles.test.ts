import { describe, expect, it } from 'vitest'
import {
  courseBadgeBaseClass,
  getCourseBadgeClass,
  getCourseBadgeLabel,
} from './courseBadgeStyles'

describe('courseBadgeStyles', () => {
  it('uses the shared minimal badge base class', () => {
    expect(courseBadgeBaseClass).toBe(
      'inline-flex items-center rounded px-2 py-0.5 text-[12px] font-medium leading-none whitespace-nowrap border-0 shadow-none cursor-default select-none',
    )
  })

  it('maps course status to semantic status token classes and labels', () => {
    expect(getCourseBadgeClass('status', 'DRAFT')).toBe('bg-muted text-muted-foreground')
    expect(getCourseBadgeClass('status', 'PENDING_REVIEW')).toBe('bg-warning-background text-warning-foreground')
    expect(getCourseBadgeClass('status', 'APPROVED')).toBe('bg-success-background text-success-foreground')
    expect(getCourseBadgeClass('status', 'REJECTED')).toBe('bg-destructive/10 text-destructive')
    expect(getCourseBadgeClass('status', 'HIDDEN')).toBe('bg-muted text-muted-foreground')
    expect(getCourseBadgeLabel('status', 'PENDING_REVIEW')).toBe('Chờ duyệt')
  })

  it('maps every course type to a distinct semantic taxonomy class', () => {
    const classes = [
      getCourseBadgeClass('type', 'COMPREHENSIVE'),
      getCourseBadgeClass('type', 'GRAMMAR'),
      getCourseBadgeClass('type', 'LISTENING'),
      getCourseBadgeClass('type', 'SPEAKING'),
      getCourseBadgeClass('type', 'READING'),
      getCourseBadgeClass('type', 'WRITING'),
      getCourseBadgeClass('type', 'VOCABULARY'),
      getCourseBadgeClass('type', 'PRONUNCIATION'),
    ]

    expect(new Set(classes).size).toBe(8)
    expect(getCourseBadgeClass('type', 'GRAMMAR')).toBe('bg-taxonomy-1 text-taxonomy-1-foreground')
    expect(getCourseBadgeLabel('type', 'GRAMMAR')).toBe('Ngữ pháp')
  })

  it('maps level and payment styles', () => {
    expect(getCourseBadgeClass('level', 'B1')).toBe('bg-taxonomy-3 text-taxonomy-3-foreground')
    expect(getCourseBadgeClass('payment', 'PAID')).toBe('bg-info-background text-info-foreground')
    expect(getCourseBadgeClass('payment', 'FREE')).toBe('bg-muted text-muted-foreground')
    expect(getCourseBadgeLabel('payment', 'PAID')).toBe('Trả phí')
  })

  it('falls back safely for unknown values', () => {
    expect(getCourseBadgeClass('status', 'UNKNOWN')).toBe('bg-muted text-muted-foreground')
    expect(getCourseBadgeLabel('status', 'UNKNOWN')).toBe('UNKNOWN')
    expect(getCourseBadgeLabel('level', 'C2')).toBe('C2')
  })
})
