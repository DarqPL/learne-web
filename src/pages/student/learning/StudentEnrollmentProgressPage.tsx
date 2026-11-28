import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../lib/api/client'
import { getStudentEnrollment } from '../../../lib/api/studentLearningApi'
import type { StudentEnrollmentProgress } from '../../../lib/api/types'
import { cn } from '../../../lib/utils'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../components/shadcn/ui/accordion'
import { Badge } from '../../../components/shadcn/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../../components/shadcn/ui/breadcrumb'
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
            <BreadcrumbLink asChild>
              <Link to="/student/enrollments">Khóa học đã đăng ký</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{enrollment.course.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="taxonomy1">
            {studentCourseTypeLabels[enrollment.course.type]}
          </Badge>
          <Badge variant="outline" className="border-border bg-muted text-foreground">
            Trình độ {enrollment.course.level}
          </Badge>
          <Badge variant="outline" className={cn(enrollmentStatusStyles[enrollment.status])}>
            {enrollmentStatusLabels[enrollment.status]}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{enrollment.course.name}</h1>
        <p className="text-base leading-7 text-muted-foreground">
          {enrollment.course.teacherName} · {enrollment.completedLessonCount}/{enrollment.totalLessonCount} bài học ·{' '}
          {progressPercent}% hoàn thành
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-foreground">Tiến độ</span>
            <span className="font-semibold text-foreground">
              {enrollment.completedLessonCount}/{enrollment.totalLessonCount} bài học
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            aria-label={`Tiến độ khóa học ${enrollment.course.name}`}
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="mt-2 text-xs font-medium text-muted-foreground">{progressPercent}% hoàn thành</p>
        </div>
      </section>

      {error ? (
        <div role="alert">
          <Alert>{error}</Alert>
        </div>
      ) : null}
      <div className="space-y-5">
        {enrollment.topics.length === 0 ? (
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">Chưa có bài học nào trong khóa học này.</p>
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
                className="rounded-2xl border border-border bg-card px-5 shadow-sm"
              >
                <AccordionTrigger className="py-5 hover:no-underline">
                  <span className="flex min-w-0 flex-1 flex-col gap-1 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">Chủ đề</span>
                    <span className="text-lg font-semibold text-foreground">{topic.name}</span>
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
                          className={`rounded-xl border p-4 ${locked ? 'border-border bg-muted' : 'border-border bg-card'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-sm font-semibold text-foreground">{lesson.title}</span>
                            <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${lessonProgressStatusStyles[lesson.status]}`}>
                              {lessonProgressStatusLabels[lesson.status]}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                            <span className="rounded-full bg-card px-2 py-1 text-foreground">{studentSkillTypeLabels[lesson.skillType]}</span>
                            <span className="text-muted-foreground">{lessonProgressPercent}%</span>
                          </div>
                          <dl className="mt-4 grid gap-2 text-xs text-muted-foreground">
                            <div>
                              <dt className="font-medium text-muted-foreground">Bắt đầu</dt>
                              <dd>{formatStudentLearningDate(lesson.startedAt)}</dd>
                            </div>
                            <div>
                              <dt className="font-medium text-muted-foreground">Hoàn thành</dt>
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
