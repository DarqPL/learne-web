import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './auth-context'
import { homePathFor } from './routes'
import { Spinner } from '../../components/ui/Spinner'
import type { UserRole } from '../api/types'

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner />
    </div>
  )
}

export function RequireAuth() {
  const { user, isInitializing } = useAuth()
  if (isInitializing) {
    return <FullPageSpinner />
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

export function RequireRole({ role }: { role: UserRole }) {
  const { user } = useAuth()
  if (user && user.role !== role) {
    return <Navigate to={homePathFor(user.role)} replace />
  }
  return <Outlet />
}

export function PublicOnly() {
  const { user, isInitializing } = useAuth()
  if (isInitializing) {
    return <FullPageSpinner />
  }
  if (user) {
    if (user.mustChangePassword) {
      return <Navigate to="/change-password?forced=1" replace />
    }
    return <Navigate to={homePathFor(user.role)} replace />
  }
  return <Outlet />
}

export function RequirePasswordChange() {
  const { user } = useAuth()
  if (user?.mustChangePassword) {
    return <Navigate to="/change-password?forced=1" replace />
  }
  return <Outlet />
}

export function RootRedirect() {
  const { user, isInitializing } = useAuth()
  if (isInitializing) {
    return <FullPageSpinner />
  }
  if (user && user.mustChangePassword) {
    return <Navigate to="/change-password?forced=1" replace />
  }
  return <Navigate to={user ? homePathFor(user.role) : '/login'} replace />
}
