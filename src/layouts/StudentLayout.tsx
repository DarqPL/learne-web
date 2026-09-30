import { Outlet, useNavigate } from 'react-router-dom'
import { AppShell } from './AppShell'
import { StudentAccountMenu } from './StudentAccountMenu'
import { StudentTopNav } from './StudentTopNav'
import { logout } from '../lib/api/authApi'
import { useAuth } from '../lib/auth/auth-context'

export function StudentLayout() {
  const { user, logout: clearAuth } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // cookie đã hết hạn cũng chấp nhận được
    }
    clearAuth()
    navigate('/login', { replace: true })
  }

  const header = (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0 flex-1">
          <StudentTopNav />
        </div>
        <div className="flex shrink-0 items-center">
          <StudentAccountMenu userName={user?.fullName ?? ''} userEmail={user?.email} onLogout={handleLogout} />
        </div>
      </div>
    </header>
  )

  return (
    <AppShell hideDefaultHeader fullWidth header={header}>
      <Outlet />
    </AppShell>
  )
}
