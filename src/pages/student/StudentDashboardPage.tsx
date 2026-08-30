import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/auth/auth-context'

export function StudentDashboardPage() {
  const { user } = useAuth()
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Dashboard Học viên</h1>
      <p className="text-gray-600">
        Chào mừng {user?.fullName}! Khám phá khóa học đã được duyệt và tiếp tục tiến độ học tập của bạn.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-200" to="/student/courses">
          <h2 className="font-semibold text-gray-900">Khám phá khóa học</h2>
          <p className="mt-2 text-sm text-gray-600">Xem các khóa học đã được duyệt và đăng ký học.</p>
        </Link>
        <Link className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-200" to="/student/enrollments">
          <h2 className="font-semibold text-gray-900">Khóa đã đăng ký</h2>
          <p className="mt-2 text-sm text-gray-600">Theo dõi tiến độ và tiếp tục bài học đang học.</p>
        </Link>
      </div>
    </div>
  )
}
