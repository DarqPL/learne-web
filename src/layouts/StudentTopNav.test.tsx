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

    // Radix opens DropdownMenu on pointerdown; fireEvent.pointerDown works in jsdom.
    fireEvent.pointerDown(screen.getByRole('button', { name: /khóa học/i }))
    expect(screen.getByRole('menuitem', { name: 'Khám phá khóa học' })).toHaveAttribute('href', '/student/courses')
    expect(screen.getByRole('menuitem', { name: 'Khóa học đã đăng ký' })).toHaveAttribute('href', '/student/enrollments')
    expect(screen.getByRole('menuitem', { name: 'Lộ trình học' })).toHaveAttribute('href', '/student/learning-path')
    expect(screen.getByRole('menuitem', { name: 'Tiến độ học tập' })).toHaveAttribute('href', '/student/enrollments')
    expect(screen.getByRole('menuitem', { name: 'Lộ trình học' })).toBeInTheDocument()

    fireEvent.pointerDown(screen.getByRole('button', { name: /ai tools/i }))
    expect(screen.getByRole('menuitem', { name: 'AI đề xuất' })).toHaveAttribute('href', '/student/course-recommendations')
    expect(screen.getByRole('menuitem', { name: 'AI Tutor' })).toHaveAttribute('href', '/student/ai-tutor')
    expect(screen.getByRole('menuitem', { name: 'Kiểm tra ngữ pháp' })).toHaveAttribute('href', '/student/grammar-check')
    expect(screen.getByRole('menuitem', { name: 'Lịch sử kiểm tra' })).toHaveAttribute('href', '/student/grammar-check/history')
    expect(screen.getByRole('menuitem', { name: 'AI Tutor' })).toBeInTheDocument()
  })

  it('opens the mobile navigation sheet', () => {
    render(
      <MemoryRouter>
        <StudentTopNav />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /mở điều hướng/i }))
    expect(screen.getByText('Điều hướng học viên')).toBeInTheDocument()
  })
})
