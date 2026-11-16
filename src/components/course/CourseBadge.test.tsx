import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CourseBadge } from './CourseBadge'

describe('CourseBadge', () => {
  it('renders the mapped label and shared classes', () => {
    render(<CourseBadge kind="status" value="PENDING_REVIEW" />)

    const badge = screen.getByText('Chờ duyệt')
    expect(badge).toHaveClass('bg-amber-50', 'text-amber-700', 'rounded', 'text-[12px]', 'border-0', 'shadow-none')
  })

  it('renders type, level, and payment values', () => {
    const { rerender } = render(<CourseBadge kind="type" value="GRAMMAR" />)
    expect(screen.getByText('Ngữ pháp')).toHaveClass('bg-violet-50', 'text-violet-700')

    rerender(<CourseBadge kind="level" value="B1" />)
    expect(screen.getByText('B1')).toHaveClass('bg-cyan-50', 'text-cyan-700')

    rerender(<CourseBadge kind="payment" value="PAID" />)
    expect(screen.getByText('Trả phí')).toHaveClass('bg-teal-50', 'text-teal-700')
  })

  it('supports a label override and extra className', () => {
    render(<CourseBadge kind="status" value="APPROVED" label="Duyệt xong" className="custom-badge" />)

    const badge = screen.getByText('Duyệt xong')
    expect(badge).toHaveClass('bg-emerald-50', 'text-emerald-700', 'custom-badge')
  })

  it('renders unknown values with the neutral fallback', () => {
    render(<CourseBadge kind="status" value="UNKNOWN" />)

    expect(screen.getByText('UNKNOWN')).toHaveClass('bg-slate-100', 'text-slate-600')
  })
})
