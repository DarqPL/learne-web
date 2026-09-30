import type { ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth/auth-context'
import { homePathFor, navItemsFor } from '../lib/auth/routes'
import { logout } from '../lib/api/authApi'
import type { UserRole } from '../lib/api/types'

const roleLabels: Record<UserRole, string> = {
  STUDENT: 'Học viên',
  TEACHER: 'Giảng viên',
  ADMIN: 'Quản trị viên',
}

type AppShellProps = {
  children: ReactNode
  header?: ReactNode
  fullWidth?: boolean
  hideDefaultHeader?: boolean
}

export function AppShell({ children, header, fullWidth, hideDefaultHeader }: AppShellProps) {
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
  const isTeacher = user.role === 'TEACHER'
  const mainClassName = fullWidth
    ? 'w-full flex-1 px-4 py-8 sm:px-6 lg:px-8'
    : `w-full flex-1 px-4 py-8 sm:px-6 lg:px-8 ${isTeacher ? '' : 'mx-auto max-w-6xl'}`

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {hideDefaultHeader ? (
        header
      ) : (
      <header className="border-b border-gray-200 bg-white">
        <div className={`mx-auto flex h-16 items-center justify-between gap-3 px-4 sm:px-6 ${isTeacher ? 'w-full' : 'max-w-6xl'}`}>
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <Link to={homePathFor(user.role)} className="shrink-0 text-xl font-bold text-indigo-600">
              LearnE
            </Link>
            <nav className={`${isTeacher ? 'hidden md:flex' : 'flex'} min-w-0 items-center gap-1`}>
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
          <div className="flex shrink-0 items-center gap-3">
            <div className="min-w-0 text-right">
              <div className="max-w-28 truncate text-sm font-medium text-gray-900 sm:max-w-none">{user.fullName}</div>
              <div className="text-xs text-gray-500">{roleLabels[user.role]}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>
      )}
      <main className={mainClassName}>{children}</main>
    </div>
  )
}
