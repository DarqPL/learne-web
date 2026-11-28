import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TeacherContentStatusBadge } from './TeacherContentStatusBadge'

describe('TeacherContentStatusBadge', () => {
  it('uses distinct semantic warning, success, and destructive status tokens', () => {
    const { rerender } = render(<TeacherContentStatusBadge status="PENDING_REVIEW" />)
    expect(screen.getByText('Chờ duyệt')).toHaveClass('bg-warning-background', 'text-warning-foreground')
    rerender(<TeacherContentStatusBadge status="APPROVED" />)
    expect(screen.getByText('Đã duyệt')).toHaveClass('bg-success-background', 'text-success-foreground')
    rerender(<TeacherContentStatusBadge status="REJECTED" />)
    expect(screen.getByText('Bị từ chối')).toHaveClass('bg-destructive/10', 'text-destructive')
  })
  it('uses semantic neutral tokens for draft and hidden statuses', () => {
    const { rerender } = render(<TeacherContentStatusBadge status="DRAFT" />)
    expect(screen.getByText('Bản nháp')).toHaveClass('bg-secondary', 'text-secondary-foreground')
    rerender(<TeacherContentStatusBadge status="HIDDEN" />)
    expect(screen.getByText('Đã ẩn')).toHaveClass('bg-secondary', 'text-secondary-foreground')
  })
})
