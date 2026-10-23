import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, FileQuestion, Layers, Loader2, Search, XCircle } from 'lucide-react'
import { getApiErrorMessage } from '../../../lib/api/client'
import { listStudentCourses } from '../../../lib/api/studentLearningApi'
import type { CourseType, StudentCourseSummary } from '../../../lib/api/types'
import { cn } from '../../../lib/utils'
import { Alert, AlertDescription, AlertTitle } from '../../../components/shadcn/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/shadcn/ui/avatar'
import { Badge } from '../../../components/shadcn/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../../components/shadcn/ui/breadcrumb'
import { Button } from '../../../components/shadcn/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '../../../components/shadcn/ui/card'
import { studentCourseTypeLabels } from './studentLearningLabels'

const levelOptions = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const PAGE_SIZE = 6

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

function teacherInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
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
  const [page, setPage] = useState(0)
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([undefined])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const requestVersion = useRef(0)

  useEffect(() => {
    const version = ++requestVersion.current
    let cancelled = false
    void (async () => {
      setCourses(null)
      setNextCursor(null)
      setHasNext(false)
      setError(null)
      try {
        const response = await listStudentCourses({
          ...(level ? { level } : {}),
          ...(teacherId ? { teacherId } : {}),
          ...(localSearch.trim() ? { q: localSearch.trim() } : {}),
          size: PAGE_SIZE,
        })
        if (!cancelled && version === requestVersion.current) {
          setCourses(response.data.content)
          setNextCursor(response.data.nextCursor)
          setHasNext(response.data.hasNext)
          setPage(0)
          setCursorStack([undefined])
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải danh sách khóa học.'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [level, teacherId, localSearch])

  const hasFilters = Boolean(level || teacherId || localSearch.trim())
  const hasNoResults = courses !== null && courses.length === 0
  const teacherFilterName = teacherId ? courses?.find((course) => course.teacherId === teacherId)?.teacherName : undefined

  async function loadCoursesPage(cursor: string | undefined, targetPage: number) {
    const version = requestVersion.current
    setError(null)
    try {
      const response = await listStudentCourses({
        ...(level ? { level } : {}),
        ...(teacherId ? { teacherId } : {}),
        ...(localSearch.trim() ? { q: localSearch.trim() } : {}),
        size: PAGE_SIZE,
        ...(cursor ? { cursor } : {}),
      })
      if (version === requestVersion.current) {
        setCourses(response.data.content)
        setNextCursor(response.data.nextCursor)
        setHasNext(response.data.hasNext)
        setPage(targetPage)
      }
    } catch (err) {
      if (version === requestVersion.current) {
        setError(getApiErrorMessage(err, 'Không thể tải danh sách khóa học.'))
      }
    }
  }

  function updateLevelFilter(value: string) {
    const nextParams = new URLSearchParams(searchParams)
    if (value) {
      nextParams.set('level', value)
    } else {
      nextParams.delete('level')
    }
    setSearchParams(nextParams)
  }

  function handleSearchChange(value: string) {
    setLocalSearch(value)
  }

  function clearFilters() {
    setSearchParams({})
    setLocalSearch('')
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/student">Trang chủ</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Khóa học</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="flex min-w-0 flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">Khám phá khóa học</h1>
        <p className="text-base leading-7 text-gray-600">Tìm khóa học phù hợp với trình độ của bạn.</p>
      </section>

      <Card className="border-gray-200 bg-white/95 py-0 shadow-sm">
        <CardContent className="p-4 sm:p-5">
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
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={localSearch}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder="Tìm theo tên khóa học hoặc giảng viên"
                  className="h-10 w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 shadow-xs outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </span>
            </label>
          </div>

          {teacherId ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/80 p-3">
              <Badge variant="outline" className="border-indigo-200 bg-white text-indigo-700">
                {teacherFilterName ? `Đang xem khóa học của giảng viên ${teacherFilterName}` : 'Đang lọc theo giảng viên'}
              </Badge>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-indigo-700 hover:text-indigo-800">
                <XCircle aria-hidden="true" data-icon="inline-start" />
                Xóa bộ lọc
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {error ? (
        <div className="flex flex-col gap-4">
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
            <XCircle aria-hidden="true" data-icon="inline-start" />
            <AlertTitle>Không thể tải khóa học</AlertTitle>
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
          {hasFilters ? (
            <Button variant="outline" onClick={clearFilters}>
              <XCircle aria-hidden="true" data-icon="inline-start" />
              Xóa bộ lọc
            </Button>
          ) : null}
        </div>
      ) : courses === null ? (
        <Card className="border-dashed border-indigo-200 bg-white/90 shadow-sm">
          <CardContent className="flex items-center gap-4 p-6 text-gray-600">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Loader2 aria-hidden="true" className="size-5 animate-spin" />
            </span>
            <div>
              <p className="font-medium text-gray-900">Đang tải danh sách khóa học</p>
              <p className="text-sm text-gray-500">Hệ thống đang lấy các khóa học đã duyệt phù hợp với bộ lọc của bạn.</p>
            </div>
          </CardContent>
        </Card>
      ) : hasNoResults ? (
        <Card className="border-dashed border-gray-200 bg-white text-center shadow-sm">
          <CardContent className="flex flex-col items-center gap-0 p-8">
            <h2 className="mt-4 text-lg font-semibold text-gray-950">Chưa có khóa học phù hợp</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-gray-600">Thử đổi trình độ, từ khóa tìm kiếm hoặc bỏ bộ lọc giảng viên để xem thêm khóa học.</p>
            {hasFilters ? (
              <Button variant="outline" onClick={clearFilters} className="mt-5">
                <XCircle aria-hidden="true" data-icon="inline-start" />
                Xóa bộ lọc
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid min-w-0 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {courses?.map((course) => (
            <Link
              key={course.id}
              to={`/student/courses/${course.id}`}
              className="group block min-w-0 rounded-3xl outline-none transition focus-visible:ring-4 focus-visible:ring-indigo-200"
            >
              <Card className="h-full flex flex-col gap-3 overflow-hidden border-gray-200 bg-white p-5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:border-indigo-200 group-hover:shadow-sm">
                <CardHeader className="flex flex-col gap-3 p-0">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={cn(courseTypeClass(course.type))}>
                      {studentCourseTypeLabels[course.type]}
                    </Badge>
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                      {course.level}
                    </Badge>
                    {course.enrolled ? <Badge className="bg-emerald-600 text-white">Đã đăng ký</Badge> : null}
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight text-gray-950 transition group-hover:text-indigo-700">
                    {course.name}
                  </h2>
                  <p className="line-clamp-2 text-sm leading-6 text-gray-600">{course.description ?? 'Chưa có mô tả.'}</p>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 p-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="size-7">
                      {course.teacherAvatarUrl ? <AvatarImage src={course.teacherAvatarUrl} alt={course.teacherName} /> : null}
                      <AvatarFallback>{teacherInitials(course.teacherName)}</AvatarFallback>
                    </Avatar>
                    <p className="min-w-0 truncate text-sm font-medium text-gray-950">{course.teacherName}</p>
                  </div>
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-5 text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Layers aria-hidden="true" className="size-3.5 text-indigo-600" />
                      {course.topicCount} chủ đề
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <BookOpen aria-hidden="true" className="size-3.5 text-sky-600" />
                      {course.lessonCount} bài học
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <FileQuestion aria-hidden="true" className="size-3.5 text-amber-600" />
                      {course.questionCount} câu hỏi
                    </span>
                  </p>
                </CardContent>
                <CardFooter className="mt-auto p-0 pt-1">
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-700 [&_svg]:size-4">
                    Xem khóa học
                    <ArrowRight aria-hidden="true" data-icon="inline-end" />
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
          </div>
          {courses.length > 0 ? (
            <nav aria-label="Phân trang khóa học" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p aria-live="polite" className="text-sm text-muted-foreground">
                Trang {page + 1} · {courses.length} khóa học
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Trang trước"
                  disabled={page === 0}
                  onClick={() => void loadCoursesPage(cursorStack[page - 1], page - 1)}
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
                    void loadCoursesPage(nextCursor, page + 1)
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
