import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, GraduationCap, ListChecks, ShieldCheck, Trophy, Users } from 'lucide-react'
import { Alert } from '../../components/ui/Alert'
import { Spinner } from '../../components/ui/Spinner'
import { adminGetDashboard } from '../../lib/api/adminApi'
import { getApiErrorMessage } from '../../lib/api/client'
import type { AdminDashboard } from '../../lib/api/types'
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

function getStatusLabel(status: string) {
  return statusLabels[status] ?? status
}

export function AdminDashboardPage() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    adminGetDashboard()
      .then((response) => {
        if (cancelled) return
        setDashboard(response.data)
        setError(null)
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải dashboard quản trị.'))
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
    {
      label: 'Học viên',
      value: overview?.totalStudents,
      description: overview ? `${formatNumber(overview.lockedStudents)} tài khoản bị khóa` : 'Tài khoản học viên',
      icon: GraduationCap,
    },
    {
      label: 'Giảng viên',
      value: overview?.totalTeachers,
      description: overview ? `${formatNumber(overview.lockedTeachers)} tài khoản bị khóa` : 'Tài khoản giảng viên',
      icon: Users,
    },
    { label: 'Khóa học', value: overview?.totalCourses, description: 'Tổng khóa học trên hệ thống', icon: BookOpen },
    { label: 'Lượt đăng ký', value: overview?.totalEnrollments, description: 'Tổng ghi danh của học viên', icon: ListChecks },
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Dashboard Quản trị</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Chào mừng {user?.fullName ?? 'quản trị viên'}!</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              Theo dõi người dùng, khóa học và nhanh chóng mở các khu vực quản trị chính.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/admin/students"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <GraduationCap className="mr-2 h-4 w-4" aria-hidden="true" />
              Học viên
            </Link>
            <Link
              to="/admin/teachers"
              className="inline-flex items-center justify-center rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              <Users className="mr-2 h-4 w-4" aria-hidden="true" />
              Giảng viên
            </Link>
            <Link
              to="/admin/reviews"
              className="inline-flex items-center justify-center rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              <ShieldCheck className="mr-2 h-4 w-4" aria-hidden="true" />
              Kiểm duyệt
            </Link>
          </div>
        </div>
      </section>

      {error ? <Alert>{error}</Alert> : null}

      {loading ? (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
          <Spinner />
          Đang tải dashboard quản trị...
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Tổng quan hệ thống">
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
                  <p className="mt-2 text-sm text-gray-500">{item.description}</p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
            </div>
          )
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
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
            ) : dashboard ? (
              <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                Chưa có dữ liệu trạng thái khóa học.
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-900">Top học viên</h2>
          </div>
          <div className="mt-4 space-y-3">
            {dashboard?.leaderboard.length ? (
              dashboard.leaderboard.map((student, index) => (
                <div key={student.userId} className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-indigo-700 shadow-sm">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">{student.fullName}</p>
                      <p className="text-xs text-gray-500">Streak {formatNumber(student.currentStreakDays)} ngày</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-amber-600">{formatNumber(student.totalXp)} XP</p>
                    <p className="text-xs text-gray-500">Kỷ lục {formatNumber(student.longestStreakDays)} ngày</p>
                  </div>
                </div>
              ))
            ) : dashboard ? (
              <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
                Chưa có dữ liệu xếp hạng học viên.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}
