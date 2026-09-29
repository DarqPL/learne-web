import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ClipboardList, FileQuestion, GraduationCap, TriangleAlert, UserRoundCog } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/ui/alert'
import { Badge } from '@/components/shadcn/ui/badge'
import { Button } from '@/components/shadcn/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/shadcn/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/shadcn/ui/empty'
import { Separator } from '@/components/shadcn/ui/separator'
import { Skeleton } from '@/components/shadcn/ui/skeleton'
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

const loadingPlaceholders = [0, 1, 2, 3]

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

  const rejectedCount = dashboard?.courseStatusCounts.find((item) => item.status === 'REJECTED')?.count ?? 0
  const draftCount = dashboard?.courseStatusCounts.find((item) => item.status === 'DRAFT')?.count ?? 0
  const rejectedRecentCourses = dashboard?.recentCourses.filter((course) => course.status === 'REJECTED') ?? []
  const hasAttention = rejectedCount > 0 || draftCount > 0

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <Badge variant="secondary">Dashboard Giảng viên</Badge>
          <CardTitle className="text-2xl">Chào mừng {user?.fullName ?? 'giảng viên'}!</CardTitle>
          <CardDescription>
            Theo dõi nội dung học tập, tình trạng kiểm duyệt và tiếp tục hoàn thiện hồ sơ giảng viên.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/teacher/content">
              <BookOpen data-icon="inline-start" aria-hidden="true" />
              Quản lý nội dung
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/teacher/profile">
              <UserRoundCog data-icon="inline-start" aria-hidden="true" />
              Hồ sơ giảng viên
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Không thể tải dashboard giảng viên</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <section aria-label="Đang tải chỉ số giảng viên" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loadingPlaceholders.map((item) => (
            <Card key={item}>
              <CardHeader>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-20" />
              </CardHeader>
            </Card>
          ))}
        </section>
      ) : (
        <section aria-label="Chỉ số giảng viên" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((item) => {
            const Icon = item.icon

            return (
              <Card key={item.label}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon aria-hidden="true" />
                  </span>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{item.value === undefined ? '--' : formatNumber(item.value)}</p>
                </CardContent>
              </Card>
            )
          })}
        </section>
      )}

      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      ) : null}

      {dashboard ? (
        <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái khóa học</CardTitle>
              <CardDescription>Phân bố khóa học theo trạng thái kiểm duyệt.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {dashboard.courseStatusCounts.length ? (
                dashboard.courseStatusCounts.map((item) => (
                  <div key={item.status} className="flex items-center justify-between gap-3 rounded-lg bg-muted px-4 py-3">
                    <span className="text-sm font-medium">{getStatusLabel(item.status)}</span>
                    <span className="text-sm font-bold">{formatNumber(item.count)}</span>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Chưa có khóa học nào để thống kê.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Khóa học cập nhật gần đây</CardTitle>
              <CardDescription>Tiếp tục hoàn thiện nội dung đang dang dở.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {dashboard.recentCourses.length ? (
                dashboard.recentCourses.map((course) => (
                  <Link
                    key={course.id}
                    to={`/teacher/content/courses/${course.id}`}
                    className="rounded-lg border p-4 transition-colors hover:bg-muted"
                  >
                    <span className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <span>
                        <span className="block font-semibold">{course.name}</span>
                        <span className="mt-1 block text-sm text-muted-foreground">
                          Cập nhật {formatDate(course.updatedAt)}
                        </span>
                      </span>
                      <span className="w-fit text-xs font-semibold text-muted-foreground">
                        {getStatusLabel(course.status)}
                      </span>
                    </span>
                  </Link>
                ))
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <BookOpen aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle>Chưa có khóa học nào</EmptyTitle>
                    <EmptyDescription>Hãy tạo khóa học đầu tiên trong mục Nội dung học tập.</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button asChild>
                      <Link to="/teacher/content">
                        <BookOpen data-icon="inline-start" aria-hidden="true" />
                        Tạo khóa học đầu tiên
                      </Link>
                    </Button>
                  </EmptyContent>
                </Empty>
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}

      {dashboard && hasAttention ? (
        <Card>
          <CardHeader>
            <CardTitle>Cần chú ý</CardTitle>
            <CardDescription>Các khóa học cần giảng viên xem lại hoặc tiếp tục hoàn thiện.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {rejectedCount > 0 ? (
              <div className="flex items-start gap-3">
                <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold">{formatNumber(rejectedCount)} khóa học bị từ chối</p>
                  <p className="text-sm text-muted-foreground">Trạng thái: {getStatusLabel('REJECTED')}</p>
                </div>
              </div>
            ) : null}
            {rejectedRecentCourses.length > 0 ? (
              <div className="flex flex-col gap-2">
                {rejectedRecentCourses.map((course) => (
                  <Link
                    key={course.id}
                    to={`/teacher/content/courses/${course.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg bg-muted px-4 py-3"
                  >
                    <span className="text-sm font-medium">{course.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Cập nhật {formatDate(course.updatedAt)} · {getStatusLabel(course.status)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : null}
            {rejectedCount > 0 && draftCount > 0 ? <Separator /> : null}
            {draftCount > 0 ? (
              <div className="flex items-start gap-3">
                <ClipboardList aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold">{formatNumber(draftCount)} khóa học bản nháp</p>
                  <p className="text-sm text-muted-foreground">Trạng thái: {getStatusLabel('DRAFT')}</p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
