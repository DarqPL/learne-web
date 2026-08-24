import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth/auth-context'
import { navItemsFor } from '../lib/auth/routes'
import { logout } from '../lib/api/authApi'
import type { UserRole } from '../lib/api/types'

const roleLabels: Record<UserRole, string> = {
  STUDENT: 'Học viên',
  TEACHER: 'Giảng viên',
  ADMIN: 'Quản trị viên',
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout: clearAuth } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return null
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // cookie đã hết hạn cũng chấp nhận được
    }
    clearAuth()
    navigate('/login', { replace: true })
  }

  const items = navItemsFor(user.role)

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <span className="text-xl font-bold text-indigo-600">LearnE</span>
            <nav className="flex gap-1">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
              <div className="text-xs text-gray-500">{roleLabels[user.role]}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  )
}
