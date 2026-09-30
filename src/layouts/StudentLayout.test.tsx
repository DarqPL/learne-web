// frontend/src/layouts/StudentLayout.test.tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { StudentLayout } from './StudentLayout'

vi.mock('../lib/auth/auth-context', () => ({
  useAuth: () => ({ user: { fullName: 'An', email: 'an@example.com', role: 'STUDENT' }, logout: vi.fn() }),
}))

describe('StudentLayout', () => {
  it('renders top nav and full-width outlet without sidebar', () => {
  render(
    <MemoryRouter initialEntries={['/student']}>
      <Routes>
        <Route element={<StudentLayout />}>
          <Route path="/student" element={<div>Student outlet</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

  expect(screen.queryByLabelText('Điều hướng học viên')).not.toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: /student/i })).toBeInTheDocument()
  expect(screen.getByText('Student outlet')).toBeInTheDocument()
  })
})
