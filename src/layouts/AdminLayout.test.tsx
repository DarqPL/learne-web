import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AdminLayout } from './AdminLayout'

vi.mock('../lib/auth/auth-context', () => ({
  useAuth: () => ({ user: { fullName: 'Admin', role: 'ADMIN' }, logout: vi.fn() }),
}))

describe('AdminLayout', () => {
  it('renders teacher-style sidebar nav and full-width outlet without constrained container', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<div>Admin outlet</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    const nav = screen.getByRole('navigation', { name: 'Điều hướng quản trị' })
    expect(nav).toBeInTheDocument()
    expect(screen.getByText('Tổng quan')).toBeInTheDocument()
    expect(screen.getByText('Dashboard hệ thống')).toBeInTheDocument()
    expect(screen.getByText('Quản lý học sinh')).toBeInTheDocument()
    expect(screen.getByText('Khóa, mở khóa tài khoản')).toBeInTheDocument()
    expect(screen.getByText('Quản lý giảng viên')).toBeInTheDocument()
    expect(screen.getByText('Kiểm duyệt nội dung')).toBeInTheDocument()
    expect(screen.getByText('Duyệt khóa học')).toBeInTheDocument()
    expect(screen.getByText('Mã giảm giá')).toBeInTheDocument()
    expect(screen.getByText('Mã giảm, khuyến mãi')).toBeInTheDocument()

    const aside = nav.closest('aside')
    expect(aside?.className).toContain('rounded-3xl')
    expect(aside?.className).toContain('border-indigo-100')
    expect(aside?.className).toContain('bg-white/95')

    expect(screen.getByText('Admin outlet')).toBeInTheDocument()
    expect(screen.getByText('Admin outlet').closest('main')).not.toHaveClass('max-w-6xl')
  })
})
