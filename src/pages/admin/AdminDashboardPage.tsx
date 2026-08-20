import { useAuth } from '../../lib/auth/auth-context'

export function AdminDashboardPage() {
  const { user } = useAuth()
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Dashboard Quản trị</h1>
      <p className="text-gray-600">
        Chào mừng {user?.fullName}! Tạo tài khoản giảng viên ở tab "Quản lý giảng viên" bên trái. Kiểm duyệt nội dung sẽ có ở Phase 5.
      </p>
    </div>
  )
}
