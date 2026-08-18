import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth/auth-context'
import { homePathFor } from '../lib/auth/routes'

export function NotFoundPage() {
  const { user } = useAuth()
  const home = user ? homePathFor(user.role) : '/login'
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="mb-2 text-4xl font-bold text-gray-900">404</h1>
      <p className="mb-6 text-gray-600">Trang bạn tìm không tồn tại.</p>
      <Link to={home} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
        Về trang chủ
      </Link>
    </div>
  )
}
