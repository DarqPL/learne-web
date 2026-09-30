import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getApiErrorMessage } from '../../../lib/api/client'
import { getStudentEnrollment, startStudentLesson } from '../../../lib/api/studentLearningApi'
import type { StudentEnrollmentProgress, StudentLessonProgress } from '../../../lib/api/types'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
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
      <div role="alert">
        <Alert>Không tìm thấy bài học.</Alert>
      </div>
    )
  }

  if (error && !enrollment) {
    return (
      <div role="alert">
        <Alert>{error}</Alert>
      </div>
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
      <div role="alert">
        <Alert>Không tìm thấy bài học trong khóa học đã đăng ký.</Alert>
      </div>
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
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-6">
          <button className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700" type="button" onClick={() => navigate(`/student/enrollments/${enrollment.enrollmentId}`)}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Quay lại lộ trình học
          </button>

          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">{studentCourseTypeLabels[enrollment.course.type]}</span>
                <span className="rounded-full bg-white px-3 py-1 text-gray-700 shadow-sm">Trình độ {enrollment.course.level}</span>
                <span className={`rounded-full px-3 py-1 ${lessonProgressStatusStyles[lesson.status]}`}>{lessonProgressStatusLabels[lesson.status]}</span>
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-indigo-600">Bài học</p>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">{lesson.title}</h1>
              <p className="mt-3 text-sm text-gray-600">
                {enrollment.course.name} · {studentSkillTypeLabels[lesson.skillType]}
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
              {canStart ? (
                <Button loading={starting} disabled={starting} onClick={() => void handleStartLesson(lesson)}>
                  Bắt đầu học
                </Button>
              ) : null}
              <Button disabled={locked} onClick={() => navigate(`/student/enrollments/${enrollment.enrollmentId}/lessons/${lesson.lessonId}/quiz`)}>
                {lesson.status === 'COMPLETED' ? 'Làm lại quiz' : 'Bắt đầu làm quiz'}
              </Button>
            </div>
          </div>

          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <dt className="text-xs text-gray-500">Tiến độ khóa học</dt>
              <dd className="mt-1 font-semibold text-gray-900">{courseProgressPercent}%</dd>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <dt className="text-xs text-gray-500">Tiến độ bài học</dt>
              <dd className="mt-1 font-semibold text-gray-900">{lessonProgressPercent}%</dd>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <dt className="text-xs text-gray-500">Ngày bắt đầu</dt>
              <dd className="mt-1 font-semibold text-gray-900">{formatStudentLearningDate(lesson.startedAt)}</dd>
            </div>
          </dl>
        </div>
      </section>

      {error ? (
        <div role="alert">
          <Alert>{error}</Alert>
        </div>
      ) : null}
      {info ? (
        <div role="alert">
          <Alert variant="success">{info}</Alert>
        </div>
      ) : null}

      {locked ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm leading-6 text-gray-700">Bài học này chưa được mở khóa. Hãy hoàn thành bài trước đó để tiếp tục.</p>
        </section>
      ) : (
        <>
          {lesson.skillType === 'LISTENING' ? <LessonAudioPlayer audioUrl={lesson.audioUrl} /> : null}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Nội dung bài học</p>
            <div className="mt-4 rounded-2xl bg-gray-50 p-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">{content || 'Bài học chưa có nội dung.'}</p>
            </div>
            <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
              <p className="text-sm font-semibold text-indigo-900">Sẵn sàng kiểm tra mức hiểu bài?</p>
              <p className="mt-2 text-sm leading-6 text-indigo-800">Làm quiz để hệ thống chấm điểm, cập nhật tiến độ, XP và streak của bạn.</p>
              <Button className="mt-4" onClick={() => navigate(`/student/enrollments/${enrollment.enrollmentId}/lessons/${lesson.lessonId}/quiz`)}>
                {lesson.status === 'COMPLETED' ? 'Làm lại quiz' : 'Bắt đầu làm quiz'}
              </Button>
            </div>
          </section>
        </>
      )}
      <div className="flex justify-end">
        {nextLesson ? (
          <Button
            className="cursor-pointer"
            onClick={() => navigate(`/student/enrollments/${enrollment.enrollmentId}/lessons/${nextLesson.lessonId}`)}
          >
            Bài học tiếp theo
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="cursor-pointer"
            onClick={() => navigate(`/student/enrollments/${enrollment.enrollmentId}`)}
          >
            Quay lại lộ trình học
          </Button>
        )}
      </div>
    </div>
  )
}
