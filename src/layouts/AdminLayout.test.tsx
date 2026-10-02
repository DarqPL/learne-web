import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AdminLayout } from './AdminLayout'

vi.mock('../lib/auth/auth-context', () => ({
  useAuth: () => ({ user: { fullName: 'Admin', role: 'ADMIN' }, logout: vi.fn() }),
}))

describe('AdminLayout', () => {
  it('renders sidebar nav and full-width outlet without constrained container', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<div>Admin outlet</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Quản lý học sinh')).toBeInTheDocument()
    expect(screen.getByText('Admin outlet')).toBeInTheDocument()
    expect(screen.getByText('Admin outlet').closest('main')).not.toHaveClass('max-w-6xl')
  })
})
