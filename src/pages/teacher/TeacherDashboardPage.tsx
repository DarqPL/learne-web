import { useAuth } from '../../lib/auth/auth-context'

export function TeacherDashboardPage() {
  const { user } = useAuth()
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Dashboard Giảng viên</h1>
      <p className="text-gray-600">
        Chào mừng {user?.fullName}! Vào mục "Nội dung học tập" để tạo khóa học, chủ đề, bài học và câu hỏi trước khi gửi duyệt.
      </p>
    </div>
  )
}
