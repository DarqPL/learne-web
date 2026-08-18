import { useAuth } from '../../lib/auth/auth-context'

export function StudentDashboardPage() {
  const { user } = useAuth()
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Dashboard Học viên</h1>
      <p className="text-gray-600">
        Chào mừng {user?.fullName}! Các tính năng học tập sẽ được triển khai ở các phase sau.
      </p>
    </div>
  )
}
