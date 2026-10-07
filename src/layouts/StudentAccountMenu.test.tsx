// frontend/src/layouts/StudentAccountMenu.test.tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { StudentAccountMenu } from './StudentAccountMenu'

describe('StudentAccountMenu', () => {
  it('shows profile, password, subscription, and logout actions in the account dropdown', () => {
    const onLogout = vi.fn()
    render(
      <MemoryRouter>
        <StudentAccountMenu userName="Nguyen Van A" userEmail="student@example.com" onLogout={onLogout} />
      </MemoryRouter>,
    )

    // Trigger shows avatar + name only — email belongs in the menu, not the trigger.
    const trigger = screen.getByRole('button', { name: /tài khoản/i })
    expect(trigger).toHaveTextContent('Nguyen Van A')
    expect(trigger).not.toHaveTextContent('student@example.com')

    // Radix opens DropdownMenu on pointerdown; fireEvent.pointerDown works in jsdom.
    fireEvent.pointerDown(trigger)
    expect(screen.getByText('student@example.com')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /hồ sơ của tôi/i })).toHaveAttribute('href', '/profile')
    expect(screen.getByRole('menuitem', { name: /đổi mật khẩu/i })).toHaveAttribute('href', '/change-password')
    expect(screen.getByRole('menuitem', { name: /gói học/i })).toHaveAttribute('href', '/student/subscription')
    expect(screen.getByRole('menuitem', { name: /đăng xuất/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Đăng xuất' }))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })
})
