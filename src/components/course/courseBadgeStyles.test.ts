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

  it('maps every course status to its pastel class and label', () => {
    expect(getCourseBadgeClass('status', 'DRAFT')).toBe('bg-slate-100 text-slate-600')
    expect(getCourseBadgeClass('status', 'PENDING_REVIEW')).toBe('bg-amber-50 text-amber-700')
    expect(getCourseBadgeClass('status', 'APPROVED')).toBe('bg-emerald-50 text-emerald-700')
    expect(getCourseBadgeClass('status', 'REJECTED')).toBe('bg-rose-50 text-rose-700')
    expect(getCourseBadgeClass('status', 'HIDDEN')).toBe('bg-slate-50 text-slate-500')
    expect(getCourseBadgeLabel('status', 'PENDING_REVIEW')).toBe('Chờ duyệt')
  })

  it('maps every course type to a distinct class', () => {
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
    expect(getCourseBadgeClass('type', 'GRAMMAR')).toBe('bg-violet-50 text-violet-700')
    expect(getCourseBadgeLabel('type', 'GRAMMAR')).toBe('Ngữ pháp')
  })

  it('maps level and payment styles', () => {
    expect(getCourseBadgeClass('level', 'B1')).toBe('bg-cyan-50 text-cyan-700')
    expect(getCourseBadgeClass('payment', 'PAID')).toBe('bg-teal-50 text-teal-700')
    expect(getCourseBadgeClass('payment', 'FREE')).toBe('bg-slate-100 text-slate-600')
    expect(getCourseBadgeLabel('payment', 'PAID')).toBe('Trả phí')
  })

  it('falls back safely for unknown values', () => {
    expect(getCourseBadgeClass('status', 'UNKNOWN')).toBe('bg-slate-100 text-slate-600')
    expect(getCourseBadgeLabel('status', 'UNKNOWN')).toBe('UNKNOWN')
    expect(getCourseBadgeLabel('level', 'C2')).toBe('C2')
  })
})
