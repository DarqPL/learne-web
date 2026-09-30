import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../lib/api/client'
import { getStudentEnrollment } from '../../../lib/api/studentLearningApi'
import type { StudentEnrollmentProgress } from '../../../lib/api/types'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../components/shadcn/ui/accordion'
import { enrollmentStatusLabels, enrollmentStatusStyles, lessonProgressStatusLabels, lessonProgressStatusStyles, studentCourseTypeLabels, studentSkillTypeLabels } from './studentLearningLabels'
import { formatStudentLearningDate } from './studentLearningUtils'

function parseEnrollmentId(value: string | undefined) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function getProgressPercent(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

export function StudentEnrollmentProgressPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const enrollmentId = parseEnrollmentId(id)
  const [enrollment, setEnrollment] = useState<StudentEnrollmentProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    if (enrollmentId === null) {
      return () => {
        cancelled = true
      }
    }

    void (async () => {
      setEnrollment(null)
      setError(null)
      try {
        const response = await getStudentEnrollment(enrollmentId)
        if (cancelled) return
        setEnrollment(response.data)
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải tiến độ học tập.'))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enrollmentId])

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
      <div className="space-y-5">
        {enrollment.topics.length === 0 ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-600">Chưa có bài học nào trong khóa học này.</p>
          </section>
        ) : (
          <Accordion
            type="multiple"
            defaultValue={enrollment.topics[0] ? [`topic-${enrollment.topics[0].id}`] : []}
            className="space-y-5"
          >
            {enrollment.topics.map((topic) => (
              <AccordionItem
                key={topic.id}
                value={`topic-${topic.id}`}
                className="rounded-2xl border border-gray-200 bg-white px-5 shadow-sm"
              >
                <AccordionTrigger className="py-5 hover:no-underline">
                  <span className="flex min-w-0 flex-1 flex-col gap-1 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Chủ đề</span>
                    <span className="text-lg font-semibold text-gray-900">{topic.name}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="mt-1 grid gap-3 pb-2 md:grid-cols-2 xl:grid-cols-3">
                    {topic.lessons.map((lesson) => {
                      const lessonProgressPercent = getProgressPercent(lesson.progressPercent)
                      const locked = lesson.status === 'LOCKED'

                      return (
                        <article
                          key={lesson.lessonId}
                          className={`rounded-xl border p-4 ${locked ? 'border-gray-100 bg-gray-50' : 'border-gray-200 bg-white'}`}
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
                          <dl className="mt-4 grid gap-2 text-xs text-gray-500">
                            <div>
                              <dt className="font-medium text-gray-600">Bắt đầu</dt>
                              <dd>{formatStudentLearningDate(lesson.startedAt)}</dd>
                            </div>
                            <div>
                              <dt className="font-medium text-gray-600">Hoàn thành</dt>
                              <dd>{formatStudentLearningDate(lesson.completedAt)}</dd>
                            </div>
                          </dl>
                          <Button
                            className="mt-4 w-full"
                            variant={locked ? 'secondary' : 'primary'}
                            disabled={locked}
                            onClick={() => navigate(`/student/enrollments/${enrollment.enrollmentId}/lessons/${lesson.lessonId}`)}
                          >
                            {locked ? 'Chưa mở khóa' : 'Vào bài học'}
                          </Button>
                        </article>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  )
}
