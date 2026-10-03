// frontend/src/layouts/StudentAccountMenu.test.tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { StudentAccountMenu } from './StudentAccountMenu'

describe('StudentAccountMenu', () => {
  it('excludes profile and confirms logout via dialog', () => {
    const onLogout = vi.fn()
    render(
      <MemoryRouter>
        <StudentAccountMenu userName="An" userEmail="an@example.com" onLogout={onLogout} />
      </MemoryRouter>,
    )

    // Trigger shows avatar + name only — email belongs in the menu, not the trigger.
    const trigger = screen.getByRole('button', { name: /tài khoản/i })
    expect(trigger).toHaveTextContent('An')
    expect(trigger).not.toHaveTextContent('an@example.com')

    // Radix opens DropdownMenu on pointerdown; fireEvent.pointerDown works in jsdom.
    fireEvent.pointerDown(trigger)
    expect(screen.getByText('an@example.com')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Gói học' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Hồ sơ' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Đăng xuất' }))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })
})
