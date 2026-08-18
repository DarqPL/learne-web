import { createContext, useContext } from 'react'
import type { AuthUser } from '../api/types'

export interface AuthState {
  user: AuthUser | null
  isInitializing: boolean
  login: (accessToken: string, expiresInSeconds: number, user: AuthUser) => void
  logout: () => void
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
