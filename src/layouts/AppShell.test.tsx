import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'

vi.mock('../lib/auth/auth-context', () => ({
  useAuth: () => ({ user: { fullName: 'An', role: 'STUDENT' }, logout: vi.fn() }),
}))

describe('AppShell', () => {
  it('renders an optional header actions slot', () => {
    render(<MemoryRouter><AppShell headerActions={<button>Notifications slot</button>}>Content</AppShell></MemoryRouter>)
    expect(screen.getByRole('button', { name: 'Notifications slot' })).toBeInTheDocument()
  })
  it('supports a custom full-width student header without default logout', () => {
    render(
      <MemoryRouter>
        <AppShell hideDefaultHeader fullWidth header={<nav aria-label="Student navigation">Student nav</nav>}>
          <div>Student content</div>
        </AppShell>
      </MemoryRouter>,
    )

    expect(screen.getByRole('navigation', { name: 'Student navigation' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Đăng xuất' })).not.toBeInTheDocument()
    expect(screen.getByText('Student content').closest('main')).not.toHaveClass('max-w-6xl')
  })
})
