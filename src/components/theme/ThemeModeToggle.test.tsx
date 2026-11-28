import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ThemeProvider } from '../../lib/theme/ThemeProvider'
import { ThemeModeToggle } from './ThemeModeToggle'
import { StudentLayout } from '../../layouts/StudentLayout'
import { AppShell } from '../../layouts/AppShell'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

vi.mock('../../lib/auth/auth-context', () => ({ useAuth: () => ({ user: { id: 1, fullName: 'Learner', email: 'learner@example.com', role: 'STUDENT' }, logout: vi.fn() }) }))

describe('ThemeModeToggle', () => {
  it('shows the three choices and applies the selected mode', async () => {
    render(<ThemeProvider><ThemeModeToggle /></ThemeProvider>)
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Theme' }), { button: 0, ctrlKey: false })
    const system = await screen.findByRole('menuitemradio', { name: 'System Default' })
    expect(system).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitemradio', { name: 'Light' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Dark' }))
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem('learne-ui-theme')).toBe('dark')
  })

  it('exposes the selector in student custom and shared role headers', () => {
    const { rerender } = render(<ThemeProvider><MemoryRouter><StudentLayout /></MemoryRouter></ThemeProvider>)
    expect(screen.getByRole('button', { name: 'Theme' })).toBeInTheDocument()
    rerender(<ThemeProvider><MemoryRouter><AppShell>Role content</AppShell></MemoryRouter></ThemeProvider>)
    expect(screen.getByRole('button', { name: 'Theme' })).toBeInTheDocument()
  })
})
