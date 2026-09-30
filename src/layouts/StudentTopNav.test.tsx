// frontend/src/layouts/StudentTopNav.test.tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { StudentTopNav } from './StudentTopNav'

describe('StudentTopNav', () => {
  it('renders primary items and grouped dropdown entries', () => {
    render(
      <MemoryRouter>
        <StudentTopNav />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Trang chủ' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Giảng viên' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /khóa học/i }))
    expect(screen.getByRole('menuitem', { name: 'Lộ trình học' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /ai tools/i }))
    expect(screen.getByRole('menuitem', { name: 'AI Tutor' })).toBeInTheDocument()
  })
})
