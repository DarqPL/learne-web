import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ClipboardList, FileQuestion, GraduationCap, UserRoundCog } from 'lucide-react'
import { Alert } from '../../components/ui/Alert'
import { Spinner } from '../../components/ui/Spinner'
import { getApiErrorMessage } from '../../lib/api/client'
import { getTeacherDashboard } from '../../lib/api/teacherApi'
import type { TeacherDashboard } from '../../lib/api/types'
import { useAuth } from '../../lib/auth/auth-context'

const statusLabels: Record<string, string> = {
  DRAFT: 'Bản nháp',
  PENDING_REVIEW: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value))
}

function getStatusLabel(status: string) {
  return statusLabels[status] ?? status
}

export function TeacherDashboardPage() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState<TeacherDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getTeacherDashboard()
      .then((response) => {
        if (cancelled) return
        setDashboard(response.data)
        setError(null)
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải dashboard giảng viên.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const overview = dashboard?.overview
  const statCards = [
    { label: 'Tổng khóa học', value: overview?.totalCourses, icon: BookOpen },
    { label: 'Học viên đăng ký', value: overview?.enrolledStudents, icon: GraduationCap },
    { label: 'Tổng bài học', value: overview?.totalLessons, icon: ClipboardList },
    { label: 'Tổng câu hỏi', value: overview?.totalQuestions, icon: FileQuestion },
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Dashboard Giảng viên</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Chào mừng {user?.fullName ?? 'giảng viên'}!</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              Theo dõi nội dung học tập, tình trạng kiểm duyệt và tiếp tục hoàn thiện hồ sơ giảng viên.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/teacher/content"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
              Quản lý nội dung
            </Link>
            <Link
              to="/teacher/profile"
              className="inline-flex items-center justify-center rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              <UserRoundCog className="mr-2 h-4 w-4" aria-hidden="true" />
              Hồ sơ giảng viên
            </Link>
          </div>
        </div>
      </section>

      {error ? <Alert>{error}</Alert> : null}

      {loading ? (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
          <Spinner />
          Đang tải dashboard giảng viên...
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Chỉ số giảng viên">
        {statCards.map((item) => {
          const Icon = item.icon

          return (
            <div key={item.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {item.value === undefined ? '--' : formatNumber(item.value)}
                  </p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
            </div>
          )
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Trạng thái khóa học</h2>
          <div className="mt-4 space-y-3">
            {dashboard?.courseStatusCounts.length ? (
              dashboard.courseStatusCounts.map((item) => (
                <div key={item.status} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                  <span className="text-sm font-medium text-gray-700">{getStatusLabel(item.status)}</span>
                  <span className="text-sm font-bold text-gray-900">{formatNumber(item.count)}</span>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                Chưa có khóa học nào để thống kê.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Khóa học cập nhật gần đây</h2>
          <div className="mt-4 space-y-3">
            {dashboard?.recentCourses.length ? (
              dashboard.recentCourses.map((course) => (
                <div key={course.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{course.name}</p>
                      <p className="mt-1 text-sm text-gray-500">Cập nhật {formatDate(course.updatedAt)}</p>
                    </div>
                    <span className="inline-flex w-fit rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                      {getStatusLabel(course.status)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
                Chưa có khóa học gần đây. Hãy tạo khóa học đầu tiên trong mục Nội dung học tập.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
