import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../lib/api/client'
import { enrollStudentCourse, getStudentCourse } from '../../../lib/api/studentLearningApi'
import type { StudentCourseDetail } from '../../../lib/api/types'
import { Alert } from '../../../components/ui/Alert'
import { Avatar } from '../../../components/ui/Avatar'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { studentCourseTypeLabels, studentQuestionTypeLabels, studentSkillTypeLabels } from './studentLearningLabels'
import { countStudentLessons, countStudentQuestions, formatStudentLearningDate } from './studentLearningUtils'

function parseCourseId(value: string | undefined) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function getContentPreview(content: string | null) {
  const text = content?.trim()
  if (!text) return 'Chưa có nội dung xem trước.'
  return text.length > 260 ? `${text.slice(0, 260).trimEnd()}...` : text
}

const enrollmentRedirectDelayMs = 900

export function StudentCourseDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const courseId = parseCourseId(id)
  const [course, setCourse] = useState<StudentCourseDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const enrollmentRedirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentCourseIdRef = useRef(courseId)
  const mountedRef = useRef(true)

  useLayoutEffect(() => {
    currentCourseIdRef.current = courseId
  }, [courseId])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (enrollmentRedirectTimerRef.current) clearTimeout(enrollmentRedirectTimerRef.current)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (enrollmentRedirectTimerRef.current) {
        clearTimeout(enrollmentRedirectTimerRef.current)
        enrollmentRedirectTimerRef.current = null
      }
    }
  }, [courseId])

  useEffect(() => {
    let cancelled = false

    if (courseId === null) {
      return () => {
        cancelled = true
      }
    }

    void (async () => {
      setCourse(null)
      setError(null)
      setInfo(null)
      try {
        const response = await getStudentCourse(courseId)
        if (!cancelled) setCourse(response.data)
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải thông tin khóa học.'))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [courseId])

  async function handleEnroll() {
    if (!course || enrolling) return

    const enrollingCourseId = course.id
    setError(null)
    setInfo(null)
    setEnrolling(true)
    try {
      const response = await enrollStudentCourse(enrollingCourseId)
      if (!mountedRef.current || currentCourseIdRef.current !== enrollingCourseId) return
      setInfo('Đăng ký khóa học thành công.')
      if (enrollmentRedirectTimerRef.current) clearTimeout(enrollmentRedirectTimerRef.current)
      enrollmentRedirectTimerRef.current = setTimeout(() => {
        navigate(`/student/enrollments/${response.data.id}`)
      }, enrollmentRedirectDelayMs)
    } catch (err) {
      if (!mountedRef.current) return
      setError(getApiErrorMessage(err, 'Không thể đăng ký khóa học.'))
      setEnrolling(false)
    }
  }

  if (courseId === null) {
    return (
      <div role="alert">
        <Alert>Không tìm thấy khóa học.</Alert>
      </div>
    )
  }

  if (error && !course) {
    return (
      <div role="alert">
        <Alert>{error}</Alert>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  const lessonCount = countStudentLessons(course)
  const questionCount = countStudentQuestions(course)

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                {studentCourseTypeLabels[course.type]}
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">Trình độ {course.level}</span>
              {course.enrolled ? (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Đã đăng ký</span>
              ) : null}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
            <div className="mt-5 flex items-center gap-3">
              <Avatar name={course.teacherName} url={course.teacherAvatarUrl ?? undefined} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{course.teacherName}</p>
                <p className="truncate text-xs text-gray-500">{course.teacherEmail}</p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
            {course.enrolled && course.activeEnrollmentId ? (
              <Button onClick={() => navigate(`/student/enrollments/${course.activeEnrollmentId}`)}>Tiếp tục học</Button>
            ) : null}
            {!course.enrolled ? (
              <Button loading={enrolling} onClick={handleEnroll}>
                Đăng ký khóa học
              </Button>
            ) : null}
          </div>
        </div>

        {course.description ? <p className="mt-6 whitespace-pre-wrap text-sm leading-6 text-gray-700">{course.description}</p> : null}

        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-xl bg-gray-50 p-3">
            <dt className="text-xs text-gray-500">Ngày xuất bản</dt>
            <dd className="mt-1 font-semibold text-gray-900">{formatStudentLearningDate(course.publishedAt)}</dd>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <dt className="text-xs text-gray-500">Chủ đề</dt>
            <dd className="mt-1 font-semibold text-gray-900">{course.topics.length}</dd>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <dt className="text-xs text-gray-500">Bài học</dt>
            <dd className="mt-1 font-semibold text-gray-900">{lessonCount}</dd>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <dt className="text-xs text-gray-500">Câu hỏi</dt>
            <dd className="mt-1 font-semibold text-gray-900">{questionCount}</dd>
          </div>
        </dl>
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

      <div className="space-y-6">
        {course.topics.map((topic) => (
          <section key={topic.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Chủ đề</p>
            <h2 className="mt-2 text-xl font-semibold text-gray-900">{topic.name}</h2>
            {topic.description ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{topic.description}</p> : null}

            <div className="mt-5 space-y-4">
              {topic.lessons.map((lesson) => (
                <article key={lesson.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Bài học</p>
                      <h3 className="mt-1 text-lg font-semibold text-gray-900">{lesson.title}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-white px-3 py-1 text-gray-700">{studentSkillTypeLabels[lesson.skillType]}</span>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">{lesson.xpReward} XP</span>
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">{lesson.questionCount} câu hỏi</span>
                    </div>
                  </div>

                  {lesson.description ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">{lesson.description}</p> : null}
                  <p className="mt-3 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm leading-6 text-gray-700">
                    {getContentPreview(lesson.content)}
                  </p>

                  {lesson.questions.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {lesson.questions.map((question) => (
                        <div key={question.id} className="rounded-xl border border-gray-200 bg-white p-4">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                              {studentQuestionTypeLabels[question.type]}
                            </span>
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">{question.xpReward} XP</span>
                          </div>
                          <p className="mt-3 text-sm font-medium text-gray-900">{question.questionText}</p>
                          <dl className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-3">
                            <div>
                              <dt className="text-xs text-gray-500">Điểm kiến thức</dt>
                              <dd className="mt-1 font-medium text-gray-800">{question.knowledgePoint ?? 'Chưa có'}</dd>
                            </div>
                            <div>
                              <dt className="text-xs text-gray-500">Độ khó</dt>
                              <dd className="mt-1 font-medium text-gray-800">{question.difficulty ?? 'Chưa có'}</dd>
                            </div>
                            <div>
                              <dt className="text-xs text-gray-500">Số lựa chọn</dt>
                              <dd className="mt-1 font-medium text-gray-800">Số lựa chọn: {question.optionCount}</dd>
                            </div>
                          </dl>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
