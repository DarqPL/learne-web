import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CourseBadge } from './CourseBadge'

describe('CourseBadge', () => {
  it('renders the mapped label and shared classes', () => {
    render(<CourseBadge kind="status" value="PENDING_REVIEW" />)

    const badge = screen.getByText('Chờ duyệt')
    expect(badge).toHaveClass('bg-warning-background', 'text-warning-foreground', 'rounded', 'text-[12px]', 'border-0', 'shadow-none')
  })

  it('renders type, level, and payment values', () => {
    const { rerender } = render(<CourseBadge kind="type" value="GRAMMAR" />)
    expect(screen.getByText('Ngữ pháp')).toHaveClass('bg-taxonomy-1', 'text-taxonomy-1-foreground')

    rerender(<CourseBadge kind="level" value="B1" />)
    expect(screen.getByText('B1')).toHaveClass('bg-taxonomy-3', 'text-taxonomy-3-foreground')

    rerender(<CourseBadge kind="payment" value="PAID" />)
    expect(screen.getByText('Trả phí')).toHaveClass('bg-info-background', 'text-info-foreground')
  })

  it('supports a label override and extra className', () => {
    render(<CourseBadge kind="status" value="APPROVED" label="Duyệt xong" className="custom-badge" />)

    const badge = screen.getByText('Duyệt xong')
    expect(badge).toHaveClass('bg-success-background', 'text-success-foreground', 'custom-badge')
  })

  it('renders unknown values with the neutral fallback', () => {
    render(<CourseBadge kind="status" value="UNKNOWN" />)

    expect(screen.getByText('UNKNOWN')).toHaveClass('bg-muted', 'text-muted-foreground')
  })
})
