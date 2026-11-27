import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Theme = 'system' | 'light' | 'dark'
type ThemeContextValue = { theme: Theme; setTheme: (theme: Theme) => void }
const ThemeContext = createContext<ThemeContextValue | null>(null)
const defaultStorageKey = 'learne-ui-theme'
const isTheme = (value: string | null): value is Theme => value === 'system' || value === 'light' || value === 'dark'

function readTheme(storageKey: string): Theme {
  try {
    const stored = window.localStorage.getItem(storageKey)
    return isTheme(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

export function ThemeProvider({ children, storageKey = defaultStorageKey }: { children: ReactNode; storageKey?: string }) {
  const [theme, setThemeState] = useState<Theme>(() => readTheme(storageKey))
  const [systemDark, setSystemDark] = useState(() => {
    try { return window.matchMedia('(prefers-color-scheme: dark)').matches } catch { return false }
  })
  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme)
    try { window.localStorage.setItem(storageKey, nextTheme) } catch { /* Session theme still applies. */ }
  }, [storageKey])

  useEffect(() => {
    if (theme !== 'system') return
    try {
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      const update = (event: MediaQueryListEvent) => setSystemDark(event.matches)
      media.addEventListener('change', update)
      return () => media.removeEventListener('change', update)
    } catch {
      return undefined
    }
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme === 'system' ? (systemDark ? 'dark' : 'light') : theme)
  }, [theme, systemDark])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
