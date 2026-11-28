import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ThemeProvider } from '../lib/theme/ThemeProvider'
import { AuthLayout } from './AuthLayout'

describe('AuthLayout theme selector', () => {
  it('exposes all theme choices and persists the selected dark theme', async () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <AuthLayout />
        </MemoryRouter>
      </ThemeProvider>,
    )

    const trigger = screen.getByRole('button', { name: 'Theme' })
    expect(trigger).toBeVisible()

    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false })

    expect(await screen.findByRole('menuitemradio', { name: 'System Default' })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: 'Light' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Dark' }))

    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem('learne-ui-theme')).toBe('dark')
  })
})
