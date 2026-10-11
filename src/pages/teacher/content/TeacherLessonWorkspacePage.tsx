import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/ui/alert'
import { Button } from '@/components/shadcn/ui/button'
import { Spinner } from '@/components/shadcn/ui/spinner'
import { getApiErrorMessage } from '../../../lib/api/client'
import {
  createTeacherQuestion,
  deleteTeacherLesson,
  deleteTeacherQuestion,
  getTeacherCourse,
  updateTeacherLesson,
  updateTeacherQuestion,
} from '../../../lib/api/teacherContentApi'
import type { TeacherCourse, TeacherLesson, TeacherLessonRequest, TeacherQuestion, TeacherQuestionRequest } from '../../../lib/api/types'
import { LessonForm } from './LessonForm'
import { QuestionForm } from './QuestionForm'
import { TeacherContentStatusBadge } from './TeacherContentStatusBadge'
import { questionTypeLabels, skillTypeLabels } from './contentLabels'
import { canEditContent, findTeacherLesson } from './contentUtils'
import { getLessonInitialValue, getQuestionInitialValue } from './teacherContentMappers'
import { LessonAudioPlayer } from '../../student/learning/LessonAudioPlayer'

const cardClassName = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm'

function parsePositiveInteger(value: string | undefined) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function findTeacherTopic(course: TeacherCourse, lessonId: number) {
  return course.topics.find((topic) => topic.lessons.some((lesson) => lesson.id === lessonId)) ?? null
}

function LessonEditForm({ lesson, action, onSubmit }: { lesson: TeacherLesson; action: string | null; onSubmit: (payload: TeacherLessonRequest) => void }) {
  const initialValue = useMemo(() => getLessonInitialValue(lesson), [lesson])

  return (
    <LessonForm
      initialValue={initialValue}
      loading={action === `update-lesson-${lesson.id}`}
      disabled={action !== null && action !== `update-lesson-${lesson.id}`}
      submitLabel="Lưu bài học"
      onSubmit={onSubmit}
    />
  )
}

function QuestionEditForm({
  question,
  action,
  onSubmit,
}: {
  question: TeacherQuestion
  action: string | null
  onSubmit: (question: TeacherQuestion, payload: TeacherQuestionRequest) => void
}) {
  const initialValue = useMemo(() => getQuestionInitialValue(question), [question])

  return (
    <QuestionForm
      initialValue={initialValue}
      loading={action === `update-question-${question.id}`}
      disabled={action !== null && action !== `update-question-${question.id}`}
      submitLabel="Lưu câu hỏi"
      onSubmit={(payload) => onSubmit(question, payload)}
    />
  )
}

function ReadOnlyQuestionDetails({ question }: { question: TeacherQuestion }) {
  const correctOption = question.options.find((option) => option.correct)

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
      {question.options.length > 0 ? (
        <div>
          <p className="font-medium text-gray-700">Lựa chọn</p>
          <div className="mt-2 space-y-2">
            {question.options.map((option) => (
              <p key={option.id} className={option.correct ? 'rounded-lg bg-green-50 px-3 py-2 font-medium text-green-700' : 'rounded-lg bg-white px-3 py-2 text-gray-600'}>
                {option.optionText}{option.correct ? ' (đáp án đúng)' : ''}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {question.correctAnswer || correctOption ? (
        <div>
          <p className="font-medium text-gray-700">Đáp án đúng</p>
          <p className="mt-1 whitespace-pre-wrap text-gray-600">{question.correctAnswer || correctOption?.optionText}</p>
        </div>
      ) : null}

      {question.explanation ? (
        <div>
          <p className="font-medium text-gray-700">Giải thích</p>
          <p className="mt-1 whitespace-pre-wrap text-gray-600">{question.explanation}</p>
        </div>
      ) : null}

      {question.knowledgePoint ? (
        <div>
          <p className="font-medium text-gray-700">Kiến thức liên quan</p>
          <p className="mt-1 whitespace-pre-wrap text-gray-600">{question.knowledgePoint}</p>
        </div>
      ) : null}
    </div>
  )
}

export function TeacherLessonWorkspacePage() {
  const navigate = useNavigate()
  const { courseId, lessonId } = useParams()
  const parsedCourseId = parsePositiveInteger(courseId)
  const parsedLessonId = parsePositiveInteger(lessonId)
  const [course, setCourse] = useState<TeacherCourse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [action, setAction] = useState<string | null>(null)
  const [formResetVersion, setFormResetVersion] = useState(0)
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await Promise.resolve()

      if (cancelled) return

      setCourse(null)
      setEditingQuestionId(null)
      if (parsedCourseId === null || parsedLessonId === null) return

      try {
        const response = await getTeacherCourse(parsedCourseId)
        if (!cancelled) {
          setCourse(response.data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setCourse(null)
          setError(getApiErrorMessage(err, 'Không thể tải bài học.'))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [parsedCourseId, parsedLessonId])

  const refreshCourse = async () => {
    if (parsedCourseId === null) return
    const response = await getTeacherCourse(parsedCourseId)
    setCourse(response.data)
  }

  const refreshCourseAfterSuccess = async (message: string) => {
    try {
      await refreshCourse()
      setInfo(message)
    } catch {
      setInfo(`${message} Tải lại dữ liệu chưa thành công, vui lòng làm mới trang nếu cần đồng bộ thêm.`)
    }
  }

  const handleUpdateLesson = async (payload: TeacherLessonRequest) => {
    if (!lesson) return
    setAction(`update-lesson-${lesson.id}`)
    setError(null)
    setInfo(null)
    try {
      await updateTeacherLesson(lesson.id, payload)
      await refreshCourseAfterSuccess('Đã cập nhật bài học.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật bài học.'))
    } finally {
      setAction(null)
    }
  }

  const handleDeleteLesson = async () => {
    if (!currentCourse || !lesson || !window.confirm('Bạn có chắc muốn xóa bài học này?')) return
    setAction(`delete-lesson-${lesson.id}`)
    setError(null)
    setInfo(null)
    try {
      await deleteTeacherLesson(lesson.id)
      navigate(`/teacher/content/courses/${currentCourse.id}`)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xóa bài học.'))
      setAction(null)
    }
  }

  const handleCreateQuestion = async (payload: TeacherQuestionRequest) => {
    if (!lesson) return
    setAction(`create-question-${lesson.id}`)
    setError(null)
    setInfo(null)
    try {
      await createTeacherQuestion(lesson.id, payload)
      setFormResetVersion((version) => version + 1)
      await refreshCourseAfterSuccess('Đã tạo câu hỏi.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tạo câu hỏi.'))
    } finally {
      setAction(null)
    }
  }

  const handleUpdateQuestion = async (question: TeacherQuestion, payload: TeacherQuestionRequest) => {
    setAction(`update-question-${question.id}`)
    setError(null)
    setInfo(null)
    try {
      await updateTeacherQuestion(question.id, payload)
      await refreshCourseAfterSuccess('Đã cập nhật câu hỏi.')
      setEditingQuestionId(null)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật câu hỏi.'))
    } finally {
      setAction(null)
    }
  }

  const handleDeleteQuestion = async (question: TeacherQuestion) => {
    if (!window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) return
    setAction(`delete-question-${question.id}`)
    setError(null)
    setInfo(null)
    try {
      await deleteTeacherQuestion(question.id)
      await refreshCourseAfterSuccess('Đã xóa câu hỏi.')
      if (editingQuestionId === question.id) {
        setEditingQuestionId(null)
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xóa câu hỏi.'))
    } finally {
      setAction(null)
    }
  }

  const currentCourse = parsedCourseId !== null && course?.id === parsedCourseId ? course : null
  const lesson = currentCourse && parsedLessonId !== null ? findTeacherLesson(currentCourse, parsedLessonId) : null
  const topic = currentCourse && parsedLessonId !== null ? findTeacherTopic(currentCourse, parsedLessonId) : null
  const editable = currentCourse ? canEditContent(currentCourse.status) : false
  const invalidRoute = parsedCourseId === null || parsedLessonId === null
  const displayError = invalidRoute || (currentCourse !== null && lesson === null) ? 'Không tìm thấy bài học.' : error

  return (
    <div className="space-y-6">
      {currentCourse ? (
        <Button
          variant="outline"
          onClick={() =>
            navigate(lesson ? `/teacher/content/courses/${currentCourse.id}?step=cau-hoi&lesson=${lesson.id}` : `/teacher/content/courses/${currentCourse.id}`)
          }
        >
          Quay lại khóa học
        </Button>
      ) : null}

      {displayError ? (
        <Alert variant="destructive">
          <AlertTitle>Đã xảy ra lỗi</AlertTitle>
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      ) : null}
      {info ? (
        <Alert className="border-emerald-200 bg-emerald-50/70 text-emerald-800">
          <AlertTitle>Thông báo</AlertTitle>
          <AlertDescription className="text-emerald-700">{info}</AlertDescription>
        </Alert>
      ) : null}

      {!invalidRoute && currentCourse === null && !displayError ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : null}

      {currentCourse && lesson ? (
        <>
          <header className={cardClassName}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-indigo-700">{currentCourse.name}</p>
                <h1 className="mt-1 text-2xl font-bold text-gray-900">{lesson.title}</h1>
                <p className="mt-2 text-gray-600">Chủ đề: {topic?.name ?? 'Không xác định'}</p>
                <p className="mt-3 text-sm text-gray-600">
                  {skillTypeLabels[lesson.skillType]} · {lesson.questions.length} câu hỏi · {lesson.xpReward} XP
                </p>
              </div>
              <TeacherContentStatusBadge status={lesson.status} />
            </div>
            {lesson.rejectionReason ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Lý do từ chối: {lesson.rejectionReason}</div>
            ) : null}
          </header>

          {editable ? (
            <section className={cardClassName}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Thông tin bài học</h2>
                  <p className="mt-1 text-sm text-gray-600">Cập nhật nội dung bài học và quản lý trạng thái trước khi gửi duyệt khóa học.</p>
                </div>
                <Button variant="destructive" loading={action === `delete-lesson-${lesson.id}`} disabled={action !== null && action !== `delete-lesson-${lesson.id}`} onClick={handleDeleteLesson}>
                  Xóa bài học
                </Button>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <LessonAudioPlayer audioUrl={lesson.audioUrl} />
                <LessonEditForm lesson={lesson} action={action} onSubmit={handleUpdateLesson} />
              </div>
            </section>
          ) : (
            <section className={cardClassName}>
              <h2 className="text-lg font-semibold text-gray-900">Nội dung bài học</h2>
              <p className="mt-3 text-sm font-medium text-gray-700">Mô tả</p>
              <p className="mt-1 whitespace-pre-wrap text-gray-600">{lesson.description || 'Chưa có mô tả bài học.'}</p>
              <LessonAudioPlayer audioUrl={lesson.audioUrl} />
              <p className="mt-4 text-sm font-medium text-gray-700">Nội dung</p>
              <p className="mt-1 whitespace-pre-wrap text-gray-600">{lesson.content || 'Chưa có nội dung bài học.'}</p>
            </section>
          )}

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Câu hỏi luyện tập</h2>
              <p className="mt-1 text-sm text-gray-600">Xây dựng và chỉnh sửa ngân hàng câu hỏi cho bài học này.</p>
            </div>

            {editable && editingQuestionId === null ? (
              <div className={cardClassName}>
                <h3 className="mb-4 font-semibold text-gray-900">Thêm câu hỏi</h3>
                <QuestionForm
                  key={`create-question-${lesson.id}-${formResetVersion}`}
                  loading={action === `create-question-${lesson.id}`}
                  disabled={action !== null && action !== `create-question-${lesson.id}`}
                  submitLabel="Tạo câu hỏi"
                  onSubmit={handleCreateQuestion}
                />
              </div>
            ) : null}

            {lesson.questions.length === 0 ? (
              <div className={cardClassName}>
                <p className="text-gray-600">Chưa có câu hỏi nào. Thêm câu hỏi đầu tiên để hoàn thiện bài học.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lesson.questions.map((question) => (
                  <article key={question.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{question.questionText}</h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {questionTypeLabels[question.type]}{question.difficulty ? ` · ${question.difficulty}` : ''} · {question.xpReward} XP
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <TeacherContentStatusBadge status={question.status} />
                        {editable ? (
                          <>
                            <Button variant="outline" disabled={action !== null} onClick={() => setEditingQuestionId(question.id)}>
                              Sửa câu hỏi
                            </Button>
                            <Button
                              variant="destructive"
                              loading={action === `delete-question-${question.id}`}
                              disabled={action !== null && action !== `delete-question-${question.id}`}
                              onClick={() => handleDeleteQuestion(question)}
                            >
                              Xóa câu hỏi
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {editable && editingQuestionId === question.id ? (
                      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h4 className="font-medium text-gray-900">Chỉnh sửa câu hỏi</h4>
                          <Button variant="outline" disabled={action !== null} onClick={() => setEditingQuestionId(null)}>
                            Đóng
                          </Button>
                        </div>
                        <QuestionEditForm question={question} action={action} onSubmit={handleUpdateQuestion} />
                      </div>
                    ) : null}

                    {!editable ? <ReadOnlyQuestionDetails question={question} /> : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
