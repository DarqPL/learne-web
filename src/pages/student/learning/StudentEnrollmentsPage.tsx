import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import { getApiErrorMessage } from '../../../lib/api/client'
import { listStudentEnrollments } from '../../../lib/api/studentLearningApi'
import type { EnrollmentStatus, StudentEnrollment } from '../../../lib/api/types'
import { cn } from '../../../lib/utils'
import { Alert, AlertDescription, AlertTitle } from '../../../components/shadcn/ui/alert'
import { Avatar, AvatarFallback } from '../../../components/shadcn/ui/avatar'
import { Badge } from '../../../components/shadcn/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../../components/shadcn/ui/breadcrumb'
import { Card, CardContent, CardFooter, CardHeader } from '../../../components/shadcn/ui/card'
import { Button } from '../../../components/shadcn/ui/button'
import { enrollmentStatusLabels, enrollmentStatusStyles } from './studentLearningLabels'

const PAGE_SIZE = 6

const enrollmentStatusBorders: Record<EnrollmentStatus, string> = {
  ACTIVE: 'border-indigo-200',
  COMPLETED: 'border-green-200',
  CANCELLED: 'border-gray-200',
}

function getProgressPercent(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

function teacherInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export function StudentEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<StudentEnrollment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([undefined])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const requestVersion = useRef(0)

  useEffect(() => {
    const version = ++requestVersion.current
    let cancelled = false

    void (async () => {
      setEnrollments(null)
      setNextCursor(null)
      setHasNext(false)
      setError(null)
      try {
        const response = await listStudentEnrollments({ size: PAGE_SIZE })
        if (!cancelled && version === requestVersion.current) {
          setEnrollments(response.data.content)
          setNextCursor(response.data.nextCursor)
          setHasNext(response.data.hasNext)
          setPage(0)
          setCursorStack([undefined])
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải danh sách khóa học đã đăng ký.'))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  async function loadEnrollmentsPage(cursor: string | undefined, targetPage: number) {
    const version = requestVersion.current
    setError(null)
    try {
      const response = await listStudentEnrollments({ size: PAGE_SIZE, ...(cursor ? { cursor } : {}) })
      if (version === requestVersion.current) {
        setEnrollments(response.data.content)
        setNextCursor(response.data.nextCursor)
        setHasNext(response.data.hasNext)
        setPage(targetPage)
      }
    } catch (err) {
      if (version === requestVersion.current) {
        setError(getApiErrorMessage(err, 'Không thể tải danh sách khóa học đã đăng ký.'))
      }
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/student/courses">Khóa học</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Khóa học đã đăng ký</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="flex min-w-0 flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">Khóa học đã đăng ký</h1>
        <p className="text-base leading-7 text-gray-600">
          Theo dõi các khóa học bạn đang tham gia và tiếp tục bài học còn dang dở.
        </p>
      </section>

      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <XCircle aria-hidden="true" data-icon="inline-start" />
          <AlertTitle>Không thể tải khóa học đã đăng ký</AlertTitle>
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      ) : enrollments === null ? (
        <Card className="border-dashed border-indigo-200 bg-white/90 shadow-sm">
          <CardContent className="flex items-center gap-4 p-6 text-gray-600">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Loader2 aria-hidden="true" className="size-5 animate-spin" />
            </span>
            <div>
              <p className="font-medium text-gray-900">Đang tải khóa học đã đăng ký</p>
              <p className="text-sm text-gray-500">Hệ thống đang lấy các khóa học bạn đang tham gia.</p>
            </div>
          </CardContent>
        </Card>
      ) : enrollments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-600">Bạn chưa đăng ký khóa học nào.</p>
          <Link
            to="/student/courses"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Khám phá khóa học
          </Link>
        </div>
      ) : (
        <>
          <div className="grid min-w-0 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {enrollments.map((enrollment) => {
              const progressPercent = getProgressPercent(enrollment.progressPercent)

              return (
                <Link
                  key={enrollment.id}
                  to={`/student/enrollments/${enrollment.id}`}
                  className="group block min-w-0 rounded-3xl outline-none transition focus-visible:ring-4 focus-visible:ring-indigo-200"
                >
                  <Card className="h-full flex flex-col gap-3 overflow-hidden border-gray-200 bg-white p-5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:border-indigo-200 group-hover:shadow-sm">
                    <CardHeader className="flex flex-col gap-3 p-0">
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            enrollmentStatusStyles[enrollment.status],
                            enrollmentStatusBorders[enrollment.status],
                          )}
                        >
                          {enrollmentStatusLabels[enrollment.status]}
                        </Badge>
                      </div>
                      <h2 className="text-xl font-semibold tracking-tight text-gray-950 transition group-hover:text-indigo-700">
                        {enrollment.courseName}
                      </h2>
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar className="size-7">
                          <AvatarFallback>{teacherInitials(enrollment.teacherName)}</AvatarFallback>
                        </Avatar>
                        <p className="min-w-0 truncate text-sm font-medium text-gray-950">
                          {enrollment.teacherName}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 p-0">
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-5 text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <BookOpen aria-hidden="true" className="size-3.5 text-sky-600" />
                          {enrollment.completedLessonCount}/{enrollment.totalLessonCount} bài học
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <TrendingUp aria-hidden="true" className="size-3.5 text-emerald-600" />
                          {progressPercent}% hoàn thành
                        </span>
                      </p>
                      <div
                        className="h-2 overflow-hidden rounded-full bg-gray-100"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progressPercent}
                        aria-label={`Tiến độ khóa học ${enrollment.courseName}`}
                      >
                        <div className="h-full rounded-full bg-indigo-600" style={{ width: `${progressPercent}%` }} />
                      </div>
                    </CardContent>
                    <CardFooter className="mt-auto p-0 pt-1">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-700 [&_svg]:size-4">
                        Tiếp tục học
                        <ArrowRight aria-hidden="true" data-icon="inline-end" />
                      </span>
                    </CardFooter>
                  </Card>
                </Link>
              )
            })}
          </div>
          {enrollments.length > 0 ? (
            <nav aria-label="Phân trang khóa học" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p aria-live="polite" className="text-sm text-muted-foreground">
                Trang {page + 1} · {enrollments.length} khóa học
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Trang trước"
                  disabled={page === 0}
                  onClick={() => void loadEnrollmentsPage(cursorStack[page - 1], page - 1)}
                >
                  <ChevronLeft aria-hidden="true" />
                  Trước
                </Button>
                <span className="text-sm text-muted-foreground" aria-live="polite">
                  {page + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Trang tiếp"
                  disabled={!hasNext || !nextCursor}
                  onClick={() => {
                    if (!nextCursor) return
                    setCursorStack((current) => [...current.slice(0, page + 1), nextCursor])
                    void loadEnrollmentsPage(nextCursor, page + 1)
                  }}
                >
                  Tiếp
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            </nav>
          ) : null}
        </>
      )}
    </div>
  )
}
