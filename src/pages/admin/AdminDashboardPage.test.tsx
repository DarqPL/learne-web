import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminDashboardPage } from './AdminDashboardPage'
import { adminGetDashboard } from '../../lib/api/adminApi'
import type { AdminDashboard } from '../../lib/api/types'

vi.mock('../../lib/api/adminApi', () => ({
  adminGetDashboard: vi.fn(),
}))

vi.mock('../../lib/auth/auth-context', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'admin@example.com', fullName: 'Admin Test', role: 'ADMIN', mustChangePassword: false },
    isInitializing: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

const mockedAdminGetDashboard = vi.mocked(adminGetDashboard)

function dashboardApiResponse(data: AdminDashboard): Awaited<ReturnType<typeof adminGetDashboard>> {
  return { data } as Awaited<ReturnType<typeof adminGetDashboard>>
}

function makeDashboard(): AdminDashboard {
  return {
    overview: {
      totalStudents: 120,
      lockedStudents: 3,
      totalTeachers: 15,
      lockedTeachers: 1,
      totalCourses: 42,
      totalEnrollments: 350,
    },
    courseStatusCounts: [
      { status: 'DRAFT', count: 5 },
      { status: 'APPROVED', count: 30 },
    ],
    leaderboard: [
      {
        userId: 10,
        fullName: 'Nguyen Van A',
        totalXp: 1200,
        currentStreakDays: 7,
        longestStreakDays: 30,
        lastActivityDate: null,
      },
    ],
  }
}

function renderDashboardPage() {
  return render(
    <MemoryRouter>
      <AdminDashboardPage />
    </MemoryRouter>,
  )
}

describe('AdminDashboardPage shadcn sync', () => {
  beforeEach(() => {
    mockedAdminGetDashboard.mockReset()
  })

  it('shows shadcn skeletons while loading', () => {
    mockedAdminGetDashboard.mockReturnValue(new Promise(() => {}))

    renderDashboardPage()

    expect(screen.getByText('Đang tải dashboard quản trị...')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="skeleton"]')).not.toBeNull()
  })

  it('shows a shadcn alert on error', async () => {
    mockedAdminGetDashboard.mockRejectedValue(new Error('boom'))

    renderDashboardPage()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveAttribute('data-slot', 'alert')
    expect(within(alert).getByText('Không thể tải dashboard quản trị.')).toBeInTheDocument()
  })

  it('renders stats with Vietnamese labels inside shadcn cards', async () => {
    mockedAdminGetDashboard.mockResolvedValue(dashboardApiResponse(makeDashboard()))

    renderDashboardPage()

    for (const label of ['Học viên', 'Giảng viên', 'Khóa học', 'Lượt đăng ký']) {
      expect(await screen.findAllByText(label)).not.toHaveLength(0)
    }

    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('350')).toBeInTheDocument()

    const cards = document.querySelectorAll('[data-slot="card"]')
    expect(cards.length).toBeGreaterThanOrEqual(4)
    expect(document.querySelector('[data-slot="card-header"]')).not.toBeNull()
    expect(document.querySelector('[data-slot="card-title"]')).not.toBeNull()
  })

  it('renders quick links as shadcn buttons with correct hrefs and no hash links', async () => {
    mockedAdminGetDashboard.mockResolvedValue(dashboardApiResponse(makeDashboard()))

    renderDashboardPage()

    await screen.findAllByText('Học viên')

    const studentsLink = screen.getByRole('link', { name: /Học viên/i })
    const teachersLink = screen.getByRole('link', { name: /Giảng viên/i })
    const reviewsLink = screen.getByRole('link', { name: /Kiểm duyệt/i })

    expect(studentsLink).toHaveAttribute('href', '/admin/students')
    expect(teachersLink).toHaveAttribute('href', '/admin/teachers')
    expect(reviewsLink).toHaveAttribute('href', '/admin/reviews')

    for (const link of [studentsLink, teachersLink, reviewsLink]) {
      expect(link.getAttribute('href')).not.toBe('#')
      expect(link).toHaveAttribute('data-slot', 'button')
    }
  })

  it('shows locked-account badges with Vietnamese copy', async () => {
    mockedAdminGetDashboard.mockResolvedValue(dashboardApiResponse(makeDashboard()))

    renderDashboardPage()

    expect(await screen.findByText('3 tài khoản bị khóa')).toBeInTheDocument()
    expect(screen.getByText('1 tài khoản bị khóa')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="badge"]')).not.toBeNull()
  })
})
