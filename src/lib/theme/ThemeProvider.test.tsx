import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme } from './ThemeProvider'

function Probe() {
  const { theme, setTheme } = useTheme()
  return <><output>{theme}</output><button onClick={() => setTheme('dark')}>Set dark</button></>
}

describe('ThemeProvider', () => {
  beforeEach(() => { localStorage.clear(); document.documentElement.classList.remove('light', 'dark') })
  afterEach(() => { vi.restoreAllMocks() })

  it('uses system mode and follows the system preference', () => {
    const listener = vi.fn()
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: (_: string, callback: (event: { matches: boolean }) => void) => listener.mockImplementation(callback), removeEventListener: vi.fn() })))
    render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(screen.getByText('system')).toBeInTheDocument()
    expect(document.documentElement).toHaveClass('dark')
  })

  it('falls back for malformed storage and remains usable when storage writes fail', () => {
    localStorage.setItem('learne-ui-theme', 'sepia')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(screen.getByText('system')).toBeInTheDocument()
    act(() => screen.getByRole('button', { name: 'Set dark' }).click())
    expect(screen.getByText('dark')).toBeInTheDocument()
    expect(document.documentElement).toHaveClass('dark')
  })

  it('loads a saved explicit theme', () => {
    localStorage.setItem('learne-ui-theme', 'light')
    render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(screen.getByText('light')).toBeInTheDocument()
    expect(document.documentElement).toHaveClass('light')
  })

  it('uses system mode when reading storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(screen.getByText('system')).toBeInTheDocument()
  })

  it('does not apply a new system appearance while an explicit mode is selected', () => {
    let listener: ((event: { matches: boolean }) => void) | undefined
    const removeEventListener = vi.fn()
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: (_: string, callback: (event: { matches: boolean }) => void) => { listener = callback }, removeEventListener })))
    render(<ThemeProvider><Probe /></ThemeProvider>)
    act(() => screen.getByRole('button', { name: 'Set dark' }).click())
    act(() => listener?.({ matches: false }))
    expect(document.documentElement).toHaveClass('dark')
    expect(removeEventListener).toHaveBeenCalledOnce()
  })

  it('updates and cleans up the system preference listener', () => {
    let listener: ((event: { matches: boolean }) => void) | undefined
    const removeEventListener = vi.fn()
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: (_: string, callback: (event: { matches: boolean }) => void) => { listener = callback }, removeEventListener })))
    const { unmount } = render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(document.documentElement).toHaveClass('light')
    act(() => listener?.({ matches: true }))
    expect(document.documentElement).toHaveClass('dark')
    unmount()
    expect(removeEventListener).toHaveBeenCalledOnce()
  })

  it('resolves each stored preference to the expected root class', () => {
    for (const [preference, expectedClass] of [['light', 'light'], ['dark', 'dark']] as const) {
      localStorage.setItem('learne-ui-theme', preference)
      const { unmount } = render(<ThemeProvider><Probe /></ThemeProvider>)
      expect(document.documentElement).toHaveClass(expectedClass)
      unmount()
      localStorage.clear()
    }
  })

})
