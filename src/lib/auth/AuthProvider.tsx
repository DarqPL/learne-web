import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { refreshAccessToken, setUnauthorizedHandler } from '../api/client'
import { tokenStore } from './tokenStore'
import { AuthContext } from './auth-context'
import type { AuthUser } from '../api/types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  const handleLogout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(handleLogout)
    let cancelled = false
    refreshAccessToken()
      .then((data) => {
        if (!cancelled) {
          setUser(data.user)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setIsInitializing(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [handleLogout])

  const value = useMemo(
    () => ({
      user,
      isInitializing,
      login: (accessToken: string, expiresInSeconds: number, nextUser: AuthUser) => {
        void expiresInSeconds
        tokenStore.set(accessToken)
        setUser(nextUser)
      },
      logout: handleLogout,
    }),
    [user, isInitializing, handleLogout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
