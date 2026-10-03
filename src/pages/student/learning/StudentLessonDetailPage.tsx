import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, FileQuestion } from 'lucide-react'
import { getApiErrorMessage } from '../../../lib/api/client'
import { getStudentEnrollment, startStudentLesson } from '../../../lib/api/studentLearningApi'
import type { StudentEnrollmentProgress, StudentLessonProgress } from '../../../lib/api/types'
import { cn } from '../../../lib/utils'
import { Alert, AlertDescription, AlertTitle } from '../../../components/shadcn/ui/alert'
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
import { Spinner } from '../../../components/ui/Spinner'
import { LessonAudioPlayer } from './LessonAudioPlayer'
import { lessonProgressStatusLabels, lessonProgressStatusStyles, studentCourseTypeLabels, studentSkillTypeLabels } from './studentLearningLabels'
import { flattenProgressLessons, formatStudentLearningDate } from './studentLearningUtils'

function parsePositiveInteger(value: string | undefined) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function getProgressPercent(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

function findLesson(enrollment: StudentEnrollmentProgress, lessonId: number) {
  return flattenProgressLessons(enrollment).find((lesson) => lesson.lessonId === lessonId) ?? null
}

export function StudentLessonDetailPage() {
  const navigate = useNavigate()
  const { enrollmentId: enrollmentIdParam, lessonId: lessonIdParam } = useParams()
  const enrollmentId = parsePositiveInteger(enrollmentIdParam)
  const lessonId = parsePositiveInteger(lessonIdParam)
  const mountedRef = useRef(false)
  const currentParamsRef = useRef({ enrollmentId, lessonId })
  const [enrollment, setEnrollment] = useState<StudentEnrollmentProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  useLayoutEffect(() => {
    currentParamsRef.current = { enrollmentId, lessonId }
  }, [enrollmentId, lessonId])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    if (enrollmentId === null || lessonId === null) {
      return () => {
        cancelled = true
      }
    }

    void (async () => {
      setEnrollment(null)
      setError(null)
      setInfo(null)
      setStarting(false)
      try {
        const response = await getStudentEnrollment(enrollmentId)
        if (!cancelled) setEnrollment(response.data)
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải bài học.'))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enrollmentId, lessonId])

  async function handleStartLesson(lesson: StudentLessonProgress) {
    if (enrollmentId === null || lessonId === null || starting || lesson.status !== 'UNLOCKED') return

    const currentEnrollmentId = enrollmentId
    const currentLessonId = lessonId
    setStarting(true)
    setError(null)
    setInfo(null)
    try {
      const response = await startStudentLesson(currentEnrollmentId, currentLessonId)
      if (!mountedRef.current) return
      const currentParams = currentParamsRef.current
      if (currentParams.enrollmentId !== currentEnrollmentId || currentParams.lessonId !== currentLessonId) return
      setEnrollment(response.data)
      setInfo('Đã bắt đầu bài học.')
    } catch (err) {
      if (!mountedRef.current) return
      const currentParams = currentParamsRef.current
      if (currentParams.enrollmentId !== currentEnrollmentId || currentParams.lessonId !== currentLessonId) return
      setError(getApiErrorMessage(err, 'Không thể bắt đầu bài học.'))
    } finally {
      if (mountedRef.current) {
        const currentParams = currentParamsRef.current
        if (currentParams.enrollmentId === currentEnrollmentId && currentParams.lessonId === currentLessonId) setStarting(false)
      }
    }
  }

  if (enrollmentId === null || lessonId === null) {
    return (
      <Alert variant="destructive" className="border-red-200 bg-red-50">
        <FileQuestion aria-hidden="true" />
        <AlertTitle>Không tìm thấy bài học.</AlertTitle>
      </Alert>
    )
  }

  if (error && !enrollment) {
    return (
      <Alert variant="destructive" className="border-red-200 bg-red-50">
        <FileQuestion aria-hidden="true" />
        <AlertTitle>Không thể tải bài học</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!enrollment) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  const lesson = findLesson(enrollment, lessonId)
  const courseProgressPercent = getProgressPercent(enrollment.progressPercent)
  const lessonProgressPercent = lesson ? getProgressPercent(lesson.progressPercent) : 0

  if (!lesson) {
    return (
      <Alert variant="destructive" className="border-red-200 bg-red-50">
        <FileQuestion aria-hidden="true" />
        <AlertTitle>Không tìm thấy bài học trong khóa học đã đăng ký.</AlertTitle>
      </Alert>
    )
  }

  const locked = lesson.status === 'LOCKED'
  const canStart = lesson.status === 'UNLOCKED'
  const content = lesson.content?.trim()
  const lessonsInOrder = flattenProgressLessons(enrollment)
  const currentLessonIndex = lessonsInOrder.findIndex((item) => item.lessonId === lessonId)
  const nextLesson =
    currentLessonIndex >= 0
      ? (lessonsInOrder.slice(currentLessonIndex + 1).find((item) => item.status !== 'LOCKED') ?? null)
      : null

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/student/courses">Khóa học</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/student/enrollments">Khóa học đã đăng ký</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/student/enrollments/${enrollment.enrollmentId}`}>{enrollment.course.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-56 truncate sm:max-w-none">{lesson.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button variant="ghost" size="sm" className="w-fit cursor-pointer" asChild>
          <Link to={`/student/enrollments/${enrollment.enrollmentId}`}>
            <ArrowLeft data-icon="inline-start" />
            Quay lại lộ trình học
          </Link>
        </Button>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">
                {studentCourseTypeLabels[enrollment.course.type]}
              </Badge>
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                Trình độ {enrollment.course.level}
              </Badge>
              <Badge variant="outline" className={cn(lessonProgressStatusStyles[lesson.status])}>
                {lessonProgressStatusLabels[lesson.status]}
              </Badge>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">{lesson.title}</h1>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {enrollment.course.name} · {studentSkillTypeLabels[lesson.skillType]}
            </p>
            <p className="mt-3 text-xs leading-5 text-gray-500">
              Tiến độ khóa học {courseProgressPercent}% · Tiến độ bài học {lessonProgressPercent}% · Bắt đầu{' '}
              {formatStudentLearningDate(lesson.startedAt)}
            </p>
            <div className="mt-3 max-w-md">
              <div className="flex items-center justify-between gap-2 text-xs text-gray-600">
                <span className="font-medium">Tiến độ bài học</span>
                <span>{lessonProgressPercent}%</span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={lessonProgressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Tiến độ bài học ${lesson.title}`}
                className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100"
              >
                <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${lessonProgressPercent}%` }} />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
            {canStart ? (
              <Button size="default" className="w-auto" loading={starting} disabled={starting} onClick={() => void handleStartLesson(lesson)}>
                Bắt đầu học
              </Button>
            ) : null}
            <Button
              size="default"
              className="w-auto"
              disabled={locked}
              onClick={() => navigate(`/student/enrollments/${enrollment.enrollmentId}/lessons/${lesson.lessonId}/quiz`)}
            >
              {lesson.status === 'COMPLETED' ? 'Làm lại quiz' : 'Bắt đầu làm quiz'}
            </Button>
          </div>
        </div>
      </section>

      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <FileQuestion aria-hidden="true" />
          <AlertTitle>Đã xảy ra lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {info ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle>Thành công</AlertTitle>
          <AlertDescription className="text-emerald-700">{info}</AlertDescription>
        </Alert>
      ) : null}

      {locked ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm leading-6 text-gray-700">Bài học này chưa được mở khóa. Hãy hoàn thành bài trước đó để tiếp tục.</p>
        </section>
      ) : (
        <div className="flex flex-col gap-3">
          {lesson.skillType === 'LISTENING' ? <LessonAudioPlayer audioUrl={lesson.audioUrl} /> : null}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Nội dung bài học</p>
            <div className="mt-3 rounded-xl bg-gray-50 p-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">{content || 'Bài học chưa có nội dung.'}</p>
            </div>
            <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 p-5">
              <p className="text-sm font-semibold text-indigo-900">Sẵn sàng kiểm tra mức hiểu bài?</p>
              <p className="mt-2 text-sm leading-6 text-indigo-800">Làm quiz để hệ thống chấm điểm, cập nhật tiến độ, XP và streak của bạn.</p>
              <Button
                size="default"
                className="mt-4 w-auto"
                onClick={() => navigate(`/student/enrollments/${enrollment.enrollmentId}/lessons/${lesson.lessonId}/quiz`)}
              >
                {lesson.status === 'COMPLETED' ? 'Làm lại quiz' : 'Bắt đầu làm quiz'}
              </Button>
            </div>
          </section>
        </div>
      )}
      <div className="flex justify-end">
        {nextLesson ? (
          <Button
            size="default"
            className="w-auto cursor-pointer"
            onClick={() => navigate(`/student/enrollments/${enrollment.enrollmentId}/lessons/${nextLesson.lessonId}`)}
          >
            Bài học tiếp theo
            <ArrowRight data-icon="inline-end" />
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="default"
            className="w-auto cursor-pointer"
            onClick={() => navigate(`/student/enrollments/${enrollment.enrollmentId}`)}
          >
            Quay lại lộ trình học
          </Button>
        )}
      </div>
    </div>
  )
}
