import { useAuth } from '../../lib/auth/auth-context'

export function TeacherDashboardPage() {
  const { user } = useAuth()
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Dashboard Giảng viên</h1>
      <p className="text-gray-600">
        Chào mừng {user?.fullName}! Quản lý nội dung khóa học sẽ được triển khai ở Phase 4.
      </p>
    </div>
  )
}
