import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  FileQuestion,
  Filter,
  GraduationCap,
  Layers3,
  Loader2,
  Search,
  Sparkles,
  UserRound,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { getApiErrorMessage } from '../../../lib/api/client'
import { listStudentCourses } from '../../../lib/api/studentLearningApi'
import type { CourseType, StudentCourseSummary } from '../../../lib/api/types'
import { Alert, AlertDescription, AlertTitle } from '../../../components/shadcn/ui/alert'
import { Avatar } from '../../../components/ui/Avatar'
import { Badge } from '../../../components/shadcn/ui/badge'
import { Button } from '../../../components/shadcn/ui/button'
import { Card, CardContent } from '../../../components/shadcn/ui/card'
import { studentCourseTypeLabels } from './studentLearningLabels'
import { formatStudentLearningDate } from './studentLearningUtils'

const levelOptions = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const courseTypeStyles: Record<CourseType, string> = {
  COMPREHENSIVE: 'border-violet-200 bg-violet-50 text-violet-700',
  GRAMMAR: 'border-sky-200 bg-sky-50 text-sky-700',
  LISTENING: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  SPEAKING: 'border-rose-200 bg-rose-50 text-rose-700',
  READING: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  WRITING: 'border-amber-200 bg-amber-50 text-amber-700',
  VOCABULARY: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  PRONUNCIATION: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
}

function courseTypeClass(type: CourseType) {
  return courseTypeStyles[type]
}

export function StudentCourseListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawLevel = searchParams.get('level')?.trim() ?? ''
  const level = levelOptions.includes(rawLevel) ? rawLevel : undefined
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

  const hasFilters = Boolean(level || teacherId || localSearch.trim())
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
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/70 to-sky-50 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <Badge variant="outline" className="border-indigo-200 bg-white/80 text-indigo-700 shadow-sm">
              <Sparkles aria-hidden="true" />
              Phase 6 · Course Catalog
            </Badge>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">Khám phá khóa học</h1>
            <p className="mt-3 text-base leading-7 text-gray-600">
              Tìm các khóa học đã được duyệt, đúng trình độ hiện tại và sẵn sàng để bạn bắt đầu học theo tiến độ của mình.
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <GraduationCap aria-hidden="true" className="h-7 w-7" />
          </div>
        </div>
      </section>

      <Card className="border-gray-200 bg-white/95 py-0 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Filter aria-hidden="true" className="h-4 w-4 text-indigo-600" />
            Bộ lọc khóa học
          </div>
          <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Trình độ</span>
              <select
                value={level ?? ''}
                onChange={(event) => updateLevelFilter(event.target.value)}
                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
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
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Tìm kiếm</span>
              <span className="relative block">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={localSearch}
                  onChange={(event) => setLocalSearch(event.target.value)}
                  placeholder="Tìm theo tên khóa học hoặc giảng viên"
                  className="h-10 w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 shadow-xs outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </span>
            </label>
          </div>

          {teacherId ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/80 p-3">
              <Badge variant="outline" className="border-indigo-200 bg-white text-indigo-700">
                <UserRound aria-hidden="true" />
                Đang xem khóa học của giảng viên #{teacherId}
              </Badge>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-indigo-700 hover:text-indigo-800">
                <XCircle aria-hidden="true" />
                Xóa bộ lọc
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {error ? (
        <div className="space-y-4">
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
            <XCircle aria-hidden="true" className="h-4 w-4" />
            <AlertTitle>Không thể tải khóa học</AlertTitle>
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
          {hasFilters ? (
            <Button variant="outline" onClick={clearFilters}>
              <XCircle aria-hidden="true" />
              Xóa bộ lọc
            </Button>
          ) : null}
        </div>
      ) : courses === null ? (
        <Card className="border-dashed border-indigo-200 bg-white/90 shadow-sm">
          <CardContent className="flex items-center gap-4 p-6 text-gray-600">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
            </span>
            <div>
              <p className="font-medium text-gray-900">Đang tải danh sách khóa học</p>
              <p className="text-sm text-gray-500">Hệ thống đang lấy các khóa học đã duyệt phù hợp với bộ lọc của bạn.</p>
            </div>
          </CardContent>
        </Card>
      ) : hasNoResults ? (
        <Card className="border-dashed border-gray-200 bg-white text-center shadow-sm">
          <CardContent className="flex flex-col items-center p-8">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
              <BookOpen aria-hidden="true" className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-gray-950">Chưa có khóa học phù hợp</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-gray-600">Thử đổi trình độ, từ khóa tìm kiếm hoặc bỏ bộ lọc giảng viên để xem thêm khóa học.</p>
            {hasFilters ? (
              <Button variant="outline" onClick={clearFilters} className="mt-5">
                <XCircle aria-hidden="true" />
                Xóa bộ lọc
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredCourses?.map((course) => (
            <Link
              key={course.id}
              to={`/student/courses/${course.id}`}
              className="group block rounded-3xl outline-none transition focus-visible:ring-4 focus-visible:ring-indigo-200"
            >
              <Card className="h-full gap-0 overflow-hidden border-gray-200 bg-white py-0 shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:border-indigo-200 group-hover:shadow-lg group-hover:shadow-indigo-100/70">
                <CardContent className="flex h-full flex-col p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <Badge variant="outline" className={courseTypeClass(course.type)}>
                          {studentCourseTypeLabels[course.type]}
                        </Badge>
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                          {course.level}
                        </Badge>
                        {course.enrolled ? <Badge className="bg-emerald-600 text-white">Đã đăng ký</Badge> : null}
                      </div>
                      <h2 className="text-xl font-semibold tracking-tight text-gray-950 transition group-hover:text-indigo-700">{course.name}</h2>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">{course.description ?? 'Chưa có mô tả.'}</p>
                    </div>
                    <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                      <ArrowRight aria-hidden="true" className="h-5 w-5" />
                    </span>
                  </div>

                  <div className="mt-5 flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 p-3">
                    <Avatar name={course.teacherName} url={course.teacherAvatarUrl ?? undefined} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-950">{course.teacherName}</p>
                      <p className="truncate text-xs text-gray-500">{course.teacherEmail}</p>
                    </div>
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <Stat icon={Layers3} label="Chủ đề" value={course.topicCount} />
                    <Stat icon={BookOpen} label="Bài học" value={course.lessonCount} />
                    <Stat icon={FileQuestion} label="Câu hỏi" value={course.questionCount} />
                    <Stat icon={CalendarDays} label="Xuất bản" value={formatStudentLearningDate(course.publishedAt)} />
                  </dl>

                  <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-5 text-sm font-medium text-indigo-700">
                    <span>Xem chi tiết</span>
                    <ArrowRight aria-hidden="true" className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

interface StatProps {
  icon: LucideIcon
  label: string
  value: string | number
}

function Stat({ icon: Icon, label, value }: StatProps) {
  return (
    <div className="rounded-2xl bg-gray-50 p-3">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
        <Icon aria-hidden="true" className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd className="mt-1 truncate font-semibold text-gray-950">{value}</dd>
    </div>
  )
}
