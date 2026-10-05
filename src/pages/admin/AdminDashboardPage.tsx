import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, GraduationCap, ListChecks, ShieldCheck, Trophy, Users, XCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../../components/shadcn/ui/alert'
import { Badge } from '../../components/shadcn/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '../../components/shadcn/ui/breadcrumb'
import { Button } from '../../components/shadcn/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '../../components/shadcn/ui/card'
import { Skeleton } from '../../components/shadcn/ui/skeleton'
import { adminGetDashboard } from '../../lib/api/adminApi'
import { getApiErrorMessage } from '../../lib/api/client'
import type { AdminDashboard } from '../../lib/api/types'
import { useAuth } from '../../lib/auth/auth-context'
import { AdminRevenueSection } from './AdminRevenueSection'

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
      locked: overview ? formatNumber(overview.lockedStudents) + ' tài khoản bị khóa' : null,
      fallbackDescription: 'Tài khoản học viên',
      icon: GraduationCap,
      tileClassName: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Giảng viên',
      value: overview?.totalTeachers,
      locked: overview ? formatNumber(overview.lockedTeachers) + ' tài khoản bị khóa' : null,
      fallbackDescription: 'Tài khoản giảng viên',
      icon: Users,
      tileClassName: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Khóa học',
      value: overview?.totalCourses,
      locked: null,
      fallbackDescription: 'Tổng khóa học trên hệ thống',
      icon: BookOpen,
      tileClassName: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Lượt đăng ký',
      value: overview?.totalEnrollments,
      locked: null,
      fallbackDescription: 'Tổng ghi danh của học viên',
      icon: ListChecks,
      tileClassName: 'bg-sky-50 text-sky-700',
    },
  ]

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="flex flex-col gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Tổng quan</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Dashboard Quản trị</p>
            <h1 className="text-2xl font-bold tracking-tight text-gray-950">
              Chào mừng {user?.fullName ?? 'quản trị viên'}!
            </h1>
            <p className="max-w-2xl text-sm text-gray-600">
              Theo dõi người dùng, khóa học và nhanh chóng mở các khu vực quản trị chính.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button asChild>
              <Link to="/admin/students">
                <GraduationCap data-icon="inline-start" aria-hidden="true" />
                Học viên
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/teachers">
                <Users data-icon="inline-start" aria-hidden="true" />
                Giảng viên
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/reviews">
                <ShieldCheck data-icon="inline-start" aria-hidden="true" />
                Kiểm duyệt
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <XCircle aria-hidden="true" data-icon="inline-start" />
          <AlertTitle>Không thể tải dashboard quản trị</AlertTitle>
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">Đang tải dashboard quản trị...</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-32 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Tổng quan hệ thống">
          {statCards.map((item) => {
            const Icon = item.icon

            return (
              <Card key={item.label}>
                <CardHeader>
                  <CardTitle>{item.label}</CardTitle>
                  <CardAction>
                    <span
                      className={`flex size-11 items-center justify-center rounded-2xl ${item.tileClassName}`}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                  </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <p className="text-3xl font-bold text-gray-950">
                    {item.value === undefined ? '--' : formatNumber(item.value)}
                  </p>
                  {item.locked ? (
                    <Badge
                      variant="outline"
                      className="border-amber-200 bg-amber-50 text-amber-800"
                    >
                      {item.locked}
                    </Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground">{item.fallbackDescription}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>Trạng thái khóa học</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {dashboard?.courseStatusCounts.length ? (
              dashboard.courseStatusCounts.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                >
                  <span className="text-sm font-medium text-gray-700">{getStatusLabel(item.status)}</span>
                  <Badge variant="outline" className="border-gray-200 bg-white text-gray-900">
                    {formatNumber(item.count)}
                  </Badge>
                </div>
              ))
            ) : dashboard ? (
              <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                Chưa có dữ liệu trạng thái khóa học.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="size-5 text-amber-500" aria-hidden="true" />
              <CardTitle>Top học viên</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {dashboard?.leaderboard.length ? (
              dashboard.leaderboard.map((student, index) => (
                <div
                  key={student.userId}
                  className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-indigo-700 shadow-sm">
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
          </CardContent>
        </Card>
      </section>

      <AdminRevenueSection />
    </div>
  )
}
