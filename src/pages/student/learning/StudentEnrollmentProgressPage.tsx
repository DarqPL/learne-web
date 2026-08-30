import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../lib/api/client'
import { completeStudentLesson, getStudentEnrollment, startStudentLesson } from '../../../lib/api/studentLearningApi'
import type { StudentEnrollmentProgress, StudentLessonProgress } from '../../../lib/api/types'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { enrollmentStatusLabels, enrollmentStatusStyles, lessonProgressStatusLabels, lessonProgressStatusStyles, studentCourseTypeLabels, studentSkillTypeLabels } from './studentLearningLabels'
import { findFirstAvailableLesson, flattenProgressLessons, formatStudentLearningDate } from './studentLearningUtils'

type LessonAction = 'start' | 'complete'

function parseEnrollmentId(value: string | undefined) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function getProgressPercent(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

function getInitialSelectedLessonId(enrollment: StudentEnrollmentProgress) {
  const lessons = flattenProgressLessons(enrollment)
  const firstAvailableLesson = findFirstAvailableLesson(enrollment)
  const actionableLesson = lessons.find((lesson) => lesson.status === 'UNLOCKED' || lesson.status === 'IN_PROGRESS')
  const selectedLesson = firstAvailableLesson?.status === 'LOCKED' ? (actionableLesson ?? firstAvailableLesson) : firstAvailableLesson

  return selectedLesson?.lessonId ?? lessons[0]?.lessonId ?? null
}

function findLessonById(enrollment: StudentEnrollmentProgress, lessonId: number | null) {
  if (lessonId === null) return null
  return flattenProgressLessons(enrollment).find((lesson) => lesson.lessonId === lessonId) ?? null
}

export function StudentEnrollmentProgressPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const enrollmentId = parseEnrollmentId(id)
  const [enrollment, setEnrollment] = useState<StudentEnrollmentProgress | null>(null)
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [action, setAction] = useState<LessonAction | null>(null)

  useEffect(() => {
    let cancelled = false

    if (enrollmentId === null) {
      return () => {
        cancelled = true
      }
    }

    void (async () => {
      setEnrollment(null)
      setSelectedLessonId(null)
      setError(null)
      setInfo(null)
      try {
        const response = await getStudentEnrollment(enrollmentId)
        if (cancelled) return
        setEnrollment(response.data)
        setSelectedLessonId(getInitialSelectedLessonId(response.data))
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải tiến độ học tập.'))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enrollmentId])

  async function handleStartLesson(lesson: StudentLessonProgress) {
    if (enrollmentId === null || action !== null || lesson.status !== 'UNLOCKED') return

    const lessonId = lesson.lessonId
    setAction('start')
    setError(null)
    setInfo(null)
    try {
      const response = await startStudentLesson(enrollmentId, lessonId)
      setEnrollment(response.data)
      setSelectedLessonId(lessonId)
      setInfo('Đã bắt đầu bài học.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật tiến độ bài học.'))
    } finally {
      setAction(null)
    }
  }

  async function handleCompleteLesson(lesson: StudentLessonProgress) {
    if (enrollmentId === null || action !== null || lesson.status === 'COMPLETED') return

    const lessonId = lesson.lessonId
    setAction('complete')
    setError(null)
    setInfo(null)
    try {
      const response = await completeStudentLesson(enrollmentId, lessonId)
      setEnrollment(response.data)
      setSelectedLessonId(lessonId)
      setInfo('Đã hoàn thành bài học.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật tiến độ bài học.'))
    } finally {
      setAction(null)
    }
  }

  if (enrollmentId === null) {
    return (
      <div role="alert">
        <Alert>Không tìm thấy khóa học đã đăng ký.</Alert>
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

  const lessons = flattenProgressLessons(enrollment)
  const selectedLesson = findLessonById(enrollment, selectedLessonId)
  const progressPercent = getProgressPercent(enrollment.progressPercent)

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                {studentCourseTypeLabels[enrollment.course.type]}
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">Trình độ {enrollment.course.level}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${enrollmentStatusStyles[enrollment.status]}`}>
                {enrollmentStatusLabels[enrollment.status]}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Tiến độ học tập</h1>
            <h2 className="mt-3 text-xl font-semibold text-gray-900">{enrollment.course.name}</h2>
            <p className="mt-2 text-sm text-gray-600">{enrollment.course.teacherName}</p>
          </div>

          <Button variant="secondary" onClick={() => navigate('/student/enrollments')}>
            Khóa học đã đăng ký
          </Button>
        </div>

        <div className="mt-6">
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
            aria-label={`Tiến độ khóa học ${enrollment.course.name}`}
          >
            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="mt-2 text-xs font-medium text-gray-500">{progressPercent}% hoàn thành</p>
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        <aside className="space-y-4">
          {enrollment.topics.map((topic) => (
            <section key={topic.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Chủ đề</p>
              <h2 className="mt-1 text-base font-semibold text-gray-900">{topic.name}</h2>
              <div className="mt-4 space-y-2">
                {topic.lessons.map((lesson) => {
                  const lessonProgressPercent = getProgressPercent(lesson.progressPercent)
                  const selected = lesson.lessonId === selectedLessonId

                  return (
                    <button
                      key={lesson.lessonId}
                      type="button"
                      className={`w-full rounded-xl border p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                        selected ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 bg-gray-50 hover:border-indigo-200 hover:bg-white'
                      }`}
                      aria-current={selected ? 'true' : undefined}
                      onClick={() => setSelectedLessonId(lesson.lessonId)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm font-semibold text-gray-900">{lesson.title}</span>
                        <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${lessonProgressStatusStyles[lesson.status]}`}>
                          {lessonProgressStatusLabels[lesson.status]}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-white px-2 py-1 text-gray-700">{studentSkillTypeLabels[lesson.skillType]}</span>
                        <span className="text-gray-500">{lessonProgressPercent}%</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </aside>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {lessons.length === 0 || !selectedLesson ? (
            <p className="text-sm text-gray-600">Chưa có bài học nào trong khóa học này.</p>
          ) : (
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Bài học</p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900">{selectedLesson.title}</h2>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">{studentSkillTypeLabels[selectedLesson.skillType]}</span>
                    <span className={`rounded-full px-3 py-1 ${lessonProgressStatusStyles[selectedLesson.status]}`}>
                      {lessonProgressStatusLabels[selectedLesson.status]}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                  {selectedLesson.status === 'UNLOCKED' ? (
                    <Button loading={action === 'start'} disabled={action !== null} onClick={() => void handleStartLesson(selectedLesson)}>
                      Bắt đầu học
                    </Button>
                  ) : null}
                  {selectedLesson.status !== 'COMPLETED' ? (
                    <Button variant="secondary" loading={action === 'complete'} disabled={action !== null} onClick={() => void handleCompleteLesson(selectedLesson)}>
                      Hoàn thành bài học
                    </Button>
                  ) : null}
                </div>
              </div>

              <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">Ngày bắt đầu</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{formatStudentLearningDate(selectedLesson.startedAt)}</dd>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">Ngày hoàn thành</dt>
                  <dd className="mt-1 font-semibold text-gray-900">{formatStudentLearningDate(selectedLesson.completedAt)}</dd>
                </div>
              </dl>

              <div className="mt-6 rounded-2xl bg-gray-50 p-5">
                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{selectedLesson.content?.trim() ? selectedLesson.content : 'Bài học chưa có nội dung.'}</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
