import { useAuth } from '../../lib/auth/auth-context'

export function AdminDashboardPage() {
  const { user } = useAuth()
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Dashboard Quản trị</h1>
      <p className="text-gray-600">
        Chào mừng {user?.fullName}! Quản lý giảng viên và kiểm duyệt nội dung học tập ở các tab bên trái.
      </p>
    </div>
  )
}
