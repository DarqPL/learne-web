import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { StudentDashboardPage } from './StudentDashboardPage'

vi.mock('../../lib/auth/auth-context', () => ({
  useAuth: () => ({ user: { fullName: 'Test Student' } }),
}))

vi.mock('../../lib/api/studentLearningApi', () => ({
  getStudentDashboard: vi.fn().mockRejectedValue(new Error('offline')),
  getCurrentCourseRecommendations: vi.fn().mockRejectedValue(new Error('offline')),
  getPlacementStatus: vi.fn().mockRejectedValue(new Error('offline')),
  skipPlacement: vi.fn(),
}))

describe('StudentDashboardPage semantic styling', () => {
  it('uses semantic tokens for the dashboard content shell and controls', async () => {
    render(<MemoryRouter><StudentDashboardPage /></MemoryRouter>)

    const explore = await screen.findByRole('link', { name: /Khám phá khóa học/ })
    expect(explore).toHaveClass('focus-visible:ring-ring')
    expect(explore.querySelector('[data-slot="card"]')).toHaveClass('border-border', 'bg-card')
    expect(screen.getByText('Đang học').parentElement).toHaveClass('bg-info-background')
  })

  it('uses semantic tokens for AI recommendation surfaces and actions', async () => {
    render(<MemoryRouter><StudentDashboardPage /></MemoryRouter>)
    const action = await screen.findByRole('link', { name: 'Xem AI đề xuất' })
    expect(action).toHaveAttribute('href', '/student/course-recommendations')
    expect(screen.getByText('AI đề xuất').closest('section')).toHaveClass('border-border', 'bg-card')
  })
})
