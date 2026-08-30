import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../lib/api/client'
import { listStudentCourses } from '../../../lib/api/studentLearningApi'
import type { StudentCourseSummary } from '../../../lib/api/types'
import { Alert } from '../../../components/ui/Alert'
import { Avatar } from '../../../components/ui/Avatar'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { studentCourseTypeLabels } from './studentLearningLabels'
import { formatStudentLearningDate } from './studentLearningUtils'

const levelOptions = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']

export function StudentCourseListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const level = searchParams.get('level')?.trim() || undefined
  const rawTeacherId = searchParams.get('teacherId') ?? ''
  const parsedTeacherId = Number(rawTeacherId)
  const teacherId = Number.isInteger(parsedTeacherId) && parsedTeacherId > 0 ? parsedTeacherId : undefined
  const [courses, setCourses] = useState<StudentCourseSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [localSearch, setLocalSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setCourses(null)
      setError(null)
      try {
        const response = await listStudentCourses({
          ...(level ? { level } : {}),
          ...(teacherId ? { teacherId } : {}),
        })
        if (!cancelled) setCourses(response.data)
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải danh sách khóa học.'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [level, teacherId])

  const searchText = localSearch.trim().toLowerCase()
  const filteredCourses = courses?.filter((course) => {
    if (!searchText) return true
    const description = course.description ?? ''
    return [course.name, course.teacherName, description].some((value) => value.toLowerCase().includes(searchText))
  })

  const hasFilters = Boolean(level || rawTeacherId.trim() || localSearch.trim())
  const hasNoResults = courses !== null && filteredCourses?.length === 0

  function updateLevelFilter(value: string) {
    const nextParams = new URLSearchParams(searchParams)
    if (value) {
      nextParams.set('level', value)
    } else {
      nextParams.delete('level')
    }
    setSearchParams(nextParams)
  }

  function clearFilters() {
    setSearchParams({})
    setLocalSearch('')
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Khóa học đã duyệt</h1>
        <p className="mt-2 text-gray-600">Chọn khóa học phù hợp để đăng ký và bắt đầu học theo tiến độ của bạn.</p>
      </div>

      <div className="mb-6 grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-[220px_1fr]">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Trình độ</span>
          <select
            value={level ?? ''}
            onChange={(event) => updateLevelFilter(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Tất cả trình độ</option>
            {levelOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Tìm kiếm</span>
          <input
            value={localSearch}
            onChange={(event) => setLocalSearch(event.target.value)}
            placeholder="Tìm theo tên khóa học hoặc giảng viên"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>
      </div>

      {error ? (
        <div className="space-y-4">
          <Alert>{error}</Alert>
          {hasFilters ? (
            <Button variant="secondary" onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          ) : null}
        </div>
      ) : courses === null ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : hasNoResults ? (
        <div className="space-y-4">
          <p className="text-gray-600">Chưa có khóa học phù hợp.</p>
          {hasFilters ? (
            <Button variant="secondary" onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredCourses?.map((course) => (
            <button
              key={course.id}
              type="button"
              onClick={() => navigate(`/student/courses/${course.id}`)}
              className="rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-colors hover:border-indigo-200 hover:shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{course.name}</h2>
                  <p className="mt-2 line-clamp-3 text-sm text-gray-700">{course.description ?? 'Chưa có mô tả.'}</p>
                </div>
                {course.enrolled ? (
                  <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Đã đăng ký</span>
                ) : null}
              </div>

              <div className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-4">
                <Avatar name={course.teacherName} url={course.teacherAvatarUrl ?? undefined} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{course.teacherName}</p>
                  <p className="truncate text-xs text-gray-500">{course.teacherEmail}</p>
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-xl bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">Trình độ</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{course.level}</dd>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">Loại khóa học</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{studentCourseTypeLabels[course.type]}</dd>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">Ngày xuất bản</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{formatStudentLearningDate(course.publishedAt)}</dd>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">Chủ đề</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{course.topicCount}</dd>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">Bài học</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{course.lessonCount}</dd>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">Câu hỏi</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{course.questionCount}</dd>
                </div>
              </dl>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
