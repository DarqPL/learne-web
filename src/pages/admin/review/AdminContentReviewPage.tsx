import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../../lib/api/client'
import { approveReviewCourse, getReviewCourse, listPendingReviewCourses, rejectReviewCourse } from '../../../lib/api/adminReviewApi'
import type { AdminReviewCourseDetail, AdminReviewCourseSummary } from '../../../lib/api/types'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { RejectCourseForm } from './RejectCourseForm'
import { reviewCourseTypeLabels, reviewQuestionTypeLabels, reviewSkillTypeLabels, reviewStatusLabels, reviewStatusStyles } from './adminReviewLabels'
import { countReviewLessons, countReviewQuestions, formatReviewDate } from './adminReviewUtils'

const cardClassName = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm'
const mutedCardClassName = 'rounded-xl border border-gray-200 bg-gray-50 p-4'

function StatusBadge({ status }: { status: AdminReviewCourseDetail['status'] }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${reviewStatusStyles[status]}`}>{reviewStatusLabels[status]}</span>
}

export function AdminContentReviewPage() {
  const [courses, setCourses] = useState<AdminReviewCourseSummary[] | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<AdminReviewCourseDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [action, setAction] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await listPendingReviewCourses()
        const pendingCourses = response.data
        if (cancelled) return

        setCourses(pendingCourses)
        const firstCourseId = pendingCourses[0]?.id ?? null
        if (firstCourseId === null) {
          setSelectedCourse(null)
          return
        }

        const detailResponse = await getReviewCourse(firstCourseId)
        if (!cancelled) setSelectedCourse(detailResponse.data)
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Không thể tải khóa học chờ duyệt.'))
          setCourses([])
          setSelectedCourse(null)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loadPendingCourses = async (nextSelectedId?: number | null) => {
    const response = await listPendingReviewCourses()
    const pendingCourses = response.data
    setCourses(pendingCourses)

    const nextCourseId = nextSelectedId ?? pendingCourses[0]?.id ?? null
    if (nextCourseId === null) {
      setSelectedCourse(null)
      return
    }

    const detailResponse = await getReviewCourse(nextCourseId)
    setSelectedCourse(detailResponse.data)
  }

  const handleSelectCourse = async (courseId: number) => {
    setError(null)
    setInfo(null)
    try {
      const response = await getReviewCourse(courseId)
      setSelectedCourse(response.data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải khóa học chờ duyệt.'))
    }
  }

  const handleApproveCourse = async () => {
    if (!selectedCourse || !window.confirm('Bạn có chắc muốn duyệt khóa học này?')) return
    setAction(`approve-course-${selectedCourse.id}`)
    setError(null)
    setInfo(null)
    try {
      await approveReviewCourse(selectedCourse.id)
      setInfo('Đã duyệt khóa học.')
      await loadPendingCourses(null)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật kiểm duyệt nội dung.'))
    } finally {
      setAction(null)
    }
  }

  const handleRejectCourse = async (reason: string) => {
    if (!selectedCourse) return
    setAction(`reject-course-${selectedCourse.id}`)
    setError(null)
    setInfo(null)
    try {
      await rejectReviewCourse(selectedCourse.id, { reason })
      setInfo('Đã từ chối khóa học.')
      await loadPendingCourses(null)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật kiểm duyệt nội dung.'))
    } finally {
      setAction(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kiểm duyệt nội dung</h1>
        <p className="mt-2 text-gray-600">Xem khóa học giảng viên gửi duyệt và phê duyệt hoặc từ chối theo gói nội dung.</p>
      </div>

      <div className="mb-4 space-y-3">
        {error ? <Alert>{error}</Alert> : null}
        {info ? <Alert variant="success">{info}</Alert> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <aside className={cardClassName}>
          <h2 className="text-lg font-semibold text-gray-900">Khóa học chờ duyệt</h2>
          {courses === null ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : courses.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">Không có khóa học nào đang chờ duyệt.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {courses.map((course) => {
                const selected = selectedCourse?.id === course.id
                return (
                  <button
                    key={course.id}
                    type="button"
                    className={`w-full rounded-xl border p-4 text-left transition-colors ${
                      selected ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectCourse(course.id)}
                  >
                    <span className="block font-medium text-gray-900">{course.name}</span>
                    <span className="mt-1 block text-sm text-gray-600">
                      {course.teacherName} · {course.teacherEmail}
                    </span>
                    <span className="mt-2 block text-sm text-gray-600">
                      {course.level} · {reviewCourseTypeLabels[course.type]}
                    </span>
                    <span className="mt-2 block text-xs text-gray-500">
                      {course.topicCount} chủ đề · {course.lessonCount} bài học · {course.questionCount} câu hỏi
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">Cập nhật: {formatReviewDate(course.updatedAt)}</span>
                  </button>
                )
              })}
            </div>
          )}
        </aside>

        <section className={cardClassName}>
          {selectedCourse === null ? (
            <p className="text-sm text-gray-600">Chọn một khóa học để xem nội dung cần duyệt.</p>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-gray-900">{selectedCourse.name}</h2>
                    <StatusBadge status={selectedCourse.status} />
                  </div>
                  <dl className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                    <div>
                      <dt className="font-medium text-gray-900">Giảng viên</dt>
                      <dd>
                        {selectedCourse.teacherName} · {selectedCourse.teacherEmail}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-900">Cấp độ</dt>
                      <dd>{selectedCourse.level}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-900">Loại khóa học</dt>
                      <dd>{reviewCourseTypeLabels[selectedCourse.type]}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-900">Cập nhật</dt>
                      <dd>{formatReviewDate(selectedCourse.updatedAt)}</dd>
                    </div>
                  </dl>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">{selectedCourse.topics.length} chủ đề</span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">{countReviewLessons(selectedCourse)} bài học</span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">{countReviewQuestions(selectedCourse)} câu hỏi</span>
                </div>
              </div>

              {selectedCourse.description ? <p className="text-sm leading-6 text-gray-700">{selectedCourse.description}</p> : null}

              <div className="grid gap-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4 lg:grid-cols-[auto_1fr]">
                <Button loading={action?.startsWith('approve-course') ?? false} disabled={action !== null} onClick={handleApproveCourse}>
                  Duyệt khóa học
                </Button>
                <RejectCourseForm loading={action?.startsWith('reject-course') ?? false} disabled={action !== null} onSubmit={handleRejectCourse} />
              </div>

              <div className="space-y-5">
                {selectedCourse.topics.map((topic) => (
                  <article key={topic.id} className={mutedCardClassName}>
                    <h3 className="text-lg font-semibold text-gray-900">Chủ đề: {topic.name}</h3>
                    {topic.description ? <p className="mt-2 text-sm text-gray-600">{topic.description}</p> : null}

                    <div className="mt-4 space-y-4">
                      {topic.lessons.map((lesson) => (
                        <section key={lesson.id} className="rounded-xl border border-gray-200 bg-white p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-gray-900">Bài học: {lesson.title}</h4>
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                              {reviewSkillTypeLabels[lesson.skillType]}
                            </span>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{lesson.xpReward} XP</span>
                            {lesson.placementTest ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Bài kiểm tra đầu vào</span>
                            ) : null}
                          </div>
                          {lesson.description ? <p className="mt-2 text-sm text-gray-600">{lesson.description}</p> : null}
                          {lesson.content ? <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-700">{lesson.content}</p> : null}

                          <div className="mt-4 space-y-3">
                            {lesson.questions.map((question) => (
                              <div key={question.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h5 className="font-medium text-gray-900">Câu hỏi: {question.questionText}</h5>
                                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                    {reviewQuestionTypeLabels[question.type]}
                                  </span>
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{question.xpReward} XP</span>
                                </div>
                                <dl className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                                  {question.correctAnswer ? (
                                    <div>
                                      <dt className="font-medium text-gray-900">Đáp án đúng</dt>
                                      <dd>{question.correctAnswer}</dd>
                                    </div>
                                  ) : null}
                                  {question.explanation ? (
                                    <div>
                                      <dt className="font-medium text-gray-900">Giải thích</dt>
                                      <dd>{question.explanation}</dd>
                                    </div>
                                  ) : null}
                                  {question.knowledgePoint ? (
                                    <div>
                                      <dt className="font-medium text-gray-900">Điểm kiến thức</dt>
                                      <dd>{question.knowledgePoint}</dd>
                                    </div>
                                  ) : null}
                                  {question.difficulty ? (
                                    <div>
                                      <dt className="font-medium text-gray-900">Độ khó</dt>
                                      <dd>{question.difficulty}</dd>
                                    </div>
                                  ) : null}
                                </dl>
                                {question.options.length > 0 ? (
                                  <ul className="mt-3 space-y-2">
                                    {question.options.map((option) => (
                                      <li key={option.id} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm text-gray-700">
                                        <span>{option.optionText}</span>
                                        {option.correct ? (
                                          <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Đáp án đúng</span>
                                        ) : null}
                                      </li>
                                    ))}
                                  </ul>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
