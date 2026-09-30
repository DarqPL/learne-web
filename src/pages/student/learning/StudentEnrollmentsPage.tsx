import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../../lib/api/client'
import { listStudentEnrollments } from '../../../lib/api/studentLearningApi'
import type { StudentEnrollment } from '../../../lib/api/types'
import { Alert } from '../../../components/ui/Alert'
import { Spinner } from '../../../components/ui/Spinner'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../../components/shadcn/ui/pagination'
import { enrollmentStatusLabels, enrollmentStatusStyles } from './studentLearningLabels'
import { formatStudentLearningDate } from './studentLearningUtils'

const PAGE_SIZE = 6

function getProgressPercent(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

export function StudentEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<StudentEnrollment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      setEnrollments(null)
      setError(null)
      try {
        const response = await listStudentEnrollments()
        if (!cancelled) setEnrollments(response.data)
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải danh sách khóa học đã đăng ký.'))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const totalPages = enrollments ? Math.max(1, Math.ceil(enrollments.length / PAGE_SIZE)) : 1
  const safePage = Math.min(Math.max(1, page), totalPages)
  const pagedEnrollments = enrollments
    ? enrollments.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
    : []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Khóa học đã đăng ký</h1>
        <p className="mt-2 text-gray-600">Theo dõi các khóa học bạn đang tham gia và tiếp tục bài học còn dang dở.</p>
      </div>

      {error ? (
        <div role="alert">
          <Alert>{error}</Alert>
        </div>
      ) : enrollments === null ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
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
          <div className="grid gap-6 lg:grid-cols-2">
            {pagedEnrollments.map((enrollment) => {
            const progressPercent = getProgressPercent(enrollment.progressPercent)

            return (
              <Link
                key={enrollment.id}
                to={`/student/enrollments/${enrollment.id}`}
                className="rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-colors hover:border-indigo-200 hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900">{enrollment.courseName}</h2>
                    <p className="mt-2 text-sm text-gray-600">{enrollment.teacherName}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${enrollmentStatusStyles[enrollment.status]}`}>
                    {enrollmentStatusLabels[enrollment.status]}
                  </span>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-gray-700">Tiến độ</span>
                    <span className="font-semibold text-gray-900">
                      {enrollment.completedLessonCount}/{enrollment.totalLessonCount} bài học
                    </span>
                  </div>
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
                  <p className="mt-2 text-xs font-medium text-gray-500">{progressPercent}% hoàn thành</p>
                </div>

                <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <dt className="text-xs text-gray-500">Ngày đăng ký</dt>
                    <dd className="mt-1 font-semibold text-gray-900">{formatStudentLearningDate(enrollment.enrolledAt)}</dd>
                  </div>
                  {enrollment.completedAt ? (
                    <div className="rounded-xl bg-gray-50 p-3">
                      <dt className="text-xs text-gray-500">Ngày hoàn thành</dt>
                      <dd className="mt-1 font-semibold text-gray-900">{formatStudentLearningDate(enrollment.completedAt)}</dd>
                    </div>
                  ) : null}
                </dl>
              </Link>
            )
          })}
          </div>
          {totalPages > 1 ? (
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault()
                      setPage((prev) => Math.max(1, Math.min(prev, totalPages) - 1))
                    }}
                    aria-disabled={safePage === 1}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      isActive={pageNumber === safePage}
                      onClick={(event) => {
                        event.preventDefault()
                        setPage(pageNumber)
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault()
                      setPage((prev) => Math.min(totalPages, Math.max(1, prev) + 1))
                    }}
                    aria-disabled={safePage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </>
      )}
    </div>
  )
}
