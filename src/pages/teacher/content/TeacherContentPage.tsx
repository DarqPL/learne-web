import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../../lib/api/client'
import {
  createTeacherCourse,
  createTeacherLesson,
  createTeacherQuestion,
  createTeacherTopic,
  deleteTeacherCourse,
  deleteTeacherLesson,
  deleteTeacherQuestion,
  deleteTeacherTopic,
  listTeacherCourses,
  submitTeacherCourse,
  updateTeacherCourse,
  updateTeacherLesson,
  updateTeacherQuestion,
  updateTeacherTopic,
} from '../../../lib/api/teacherContentApi'
import type {
  TeacherCourse,
  TeacherCourseRequest,
  TeacherLesson,
  TeacherLessonRequest,
  TeacherQuestion,
  TeacherQuestionRequest,
  TeacherTopicRequest,
} from '../../../lib/api/types'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { CourseForm } from './CourseForm'
import { LessonForm } from './LessonForm'
import { QuestionForm } from './QuestionForm'
import { TopicForm } from './TopicForm'
import {
  contentStatusLabels,
  contentStatusStyles,
  courseTypeLabels,
  questionTypeLabels,
  skillTypeLabels,
} from './contentLabels'
import { canEditContent, canSubmitCourse, countLessons, countQuestions } from './contentUtils'

const cardClassName = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm'
const mutedCardClassName = 'rounded-xl border border-gray-200 bg-gray-50 p-4'

function getCourseInitialValue(course: TeacherCourse): TeacherCourseRequest {
  return {
    name: course.name,
    description: course.description ?? '',
    type: course.type,
    level: course.level,
    orderIndex: course.orderIndex,
  }
}

function getTopicInitialValue(topic: TeacherCourse['topics'][number]): TeacherTopicRequest {
  return {
    name: topic.name,
    description: topic.description ?? '',
    orderIndex: topic.orderIndex,
  }
}

function getLessonInitialValue(lesson: TeacherLesson): TeacherLessonRequest {
  return {
    title: lesson.title,
    description: lesson.description ?? '',
    content: lesson.content ?? '',
    skillType: lesson.skillType,
    orderIndex: lesson.orderIndex,
    xpReward: lesson.xpReward,
    placementTest: lesson.placementTest,
  }
}

function getQuestionInitialValue(question: TeacherQuestion): TeacherQuestionRequest {
  return {
    type: question.type,
    questionText: question.questionText,
    explanation: question.explanation ?? '',
    correctAnswer: question.correctAnswer ?? '',
    knowledgePoint: question.knowledgePoint ?? '',
    orderIndex: question.orderIndex,
    difficulty: question.difficulty ?? '',
    xpReward: question.xpReward,
    options: question.options.map((option) => ({
      optionText: option.optionText,
      correct: option.correct,
      orderIndex: option.orderIndex,
    })),
  }
}

function StatusBadge({ status }: { status: TeacherCourse['status'] }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${contentStatusStyles[status]}`}>
      {contentStatusLabels[status]}
    </span>
  )
}

export function TeacherContentPage() {
  const [courses, setCourses] = useState<TeacherCourse[] | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [action, setAction] = useState<string | null>(null)
  const [formResetVersion, setFormResetVersion] = useState(0)

  const selectedCourse = courses?.find((course) => course.id === selectedCourseId) ?? null
  const selectedCourseEditable = selectedCourse ? canEditContent(selectedCourse.status) : false

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await listTeacherCourses()
        if (!cancelled) {
          setCourses(response.data)
          setSelectedCourseId((current) => current ?? response.data[0]?.id ?? null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Không thể tải nội dung học tập.'))
          setCourses([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const refreshCourses = async (nextSelectedId?: number | null) => {
    const response = await listTeacherCourses()
    setCourses(response.data)
    setSelectedCourseId(nextSelectedId ?? response.data[0]?.id ?? null)
  }

  const handleCreateCourse = async (payload: TeacherCourseRequest) => {
    setAction('create-course')
    setError(null)
    setInfo(null)
    try {
      const response = await createTeacherCourse(payload)
      await refreshCourses(response.data.id)
      setFormResetVersion((version) => version + 1)
      setInfo('Đã tạo khóa học.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
    } finally {
      setAction(null)
    }
  }

  const handleUpdateCourse = async (payload: TeacherCourseRequest) => {
    if (!selectedCourse) return
    setAction(`update-course-${selectedCourse.id}`)
    setError(null)
    setInfo(null)
    try {
      await updateTeacherCourse(selectedCourse.id, payload)
      await refreshCourses(selectedCourse.id)
      setInfo('Đã lưu khóa học.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
    } finally {
      setAction(null)
    }
  }

  const handleDeleteCourse = async () => {
    if (!selectedCourse || !window.confirm('Bạn có chắc muốn xóa khóa học này?')) return
    setAction(`delete-course-${selectedCourse.id}`)
    setError(null)
    setInfo(null)
    try {
      await deleteTeacherCourse(selectedCourse.id)
      await refreshCourses(null)
      setInfo('Đã xóa khóa học.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
    } finally {
      setAction(null)
    }
  }

  const handleSubmitCourse = async () => {
    if (!selectedCourse) return
    setAction(`submit-course-${selectedCourse.id}`)
    setError(null)
    setInfo(null)
    try {
      await submitTeacherCourse(selectedCourse.id)
      await refreshCourses(selectedCourse.id)
      setInfo('Đã gửi khóa học sang trạng thái chờ duyệt.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
    } finally {
      setAction(null)
    }
  }

  const handleCreateTopic = async (courseId: number, payload: TeacherTopicRequest) => {
    setAction(`create-topic-${courseId}`)
    setError(null)
    setInfo(null)
    try {
      await createTeacherTopic(courseId, payload)
      await refreshCourses(courseId)
      setFormResetVersion((version) => version + 1)
      setInfo('Đã tạo chủ đề.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
    } finally {
      setAction(null)
    }
  }

  const handleUpdateTopic = async (topicId: number, payload: TeacherTopicRequest) => {
    setAction(`update-topic-${topicId}`)
    setError(null)
    setInfo(null)
    try {
      await updateTeacherTopic(topicId, payload)
      await refreshCourses(selectedCourseId)
      setInfo('Đã lưu chủ đề.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
    } finally {
      setAction(null)
    }
  }

  const handleDeleteTopic = async (topicId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa chủ đề này?')) return
    setAction(`delete-topic-${topicId}`)
    setError(null)
    setInfo(null)
    try {
      await deleteTeacherTopic(topicId)
      await refreshCourses(selectedCourseId)
      setInfo('Đã xóa chủ đề.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
    } finally {
      setAction(null)
    }
  }

  const handleCreateLesson = async (topicId: number, payload: TeacherLessonRequest) => {
    setAction(`create-lesson-${topicId}`)
    setError(null)
    setInfo(null)
    try {
      await createTeacherLesson(topicId, payload)
      await refreshCourses(selectedCourseId)
      setFormResetVersion((version) => version + 1)
      setInfo('Đã tạo bài học.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
    } finally {
      setAction(null)
    }
  }

  const handleUpdateLesson = async (lessonId: number, payload: TeacherLessonRequest) => {
    setAction(`update-lesson-${lessonId}`)
    setError(null)
    setInfo(null)
    try {
      await updateTeacherLesson(lessonId, payload)
      await refreshCourses(selectedCourseId)
      setInfo('Đã lưu bài học.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
    } finally {
      setAction(null)
    }
  }

  const handleDeleteLesson = async (lessonId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài học này?')) return
    setAction(`delete-lesson-${lessonId}`)
    setError(null)
    setInfo(null)
    try {
      await deleteTeacherLesson(lessonId)
      await refreshCourses(selectedCourseId)
      setInfo('Đã xóa bài học.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
    } finally {
      setAction(null)
    }
  }

  const handleCreateQuestion = async (lessonId: number, payload: TeacherQuestionRequest) => {
    setAction(`create-question-${lessonId}`)
    setError(null)
    setInfo(null)
    try {
      await createTeacherQuestion(lessonId, payload)
      await refreshCourses(selectedCourseId)
      setFormResetVersion((version) => version + 1)
      setInfo('Đã tạo câu hỏi.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
    } finally {
      setAction(null)
    }
  }

  const handleUpdateQuestion = async (questionId: number, payload: TeacherQuestionRequest) => {
    setAction(`update-question-${questionId}`)
    setError(null)
    setInfo(null)
    try {
      await updateTeacherQuestion(questionId, payload)
      await refreshCourses(selectedCourseId)
      setInfo('Đã lưu câu hỏi.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
    } finally {
      setAction(null)
    }
  }

  const handleDeleteQuestion = async (questionId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) return
    setAction(`delete-question-${questionId}`)
    setError(null)
    setInfo(null)
    try {
      await deleteTeacherQuestion(questionId)
      await refreshCourses(selectedCourseId)
      setInfo('Đã xóa câu hỏi.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
    } finally {
      setAction(null)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Nội dung học tập</h1>
        <p className="mt-2 max-w-3xl text-gray-600">
          Giảng viên có thể tạo khóa học, chủ đề, bài học và câu hỏi, sau đó gửi nội dung sang trạng thái chờ duyệt.
        </p>
      </header>

      {error ? <Alert>{error}</Alert> : null}
      {info ? <Alert variant="success">{info}</Alert> : null}

      {courses === null ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
          <aside className={cardClassName}>
            <h2 className="text-lg font-semibold text-gray-900">Khóa học của tôi</h2>
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <CourseForm
                key={`create-course-${formResetVersion}`}
                loading={action === 'create-course'}
                disabled={action !== null && action !== 'create-course'}
                submitLabel="Tạo khóa học"
                onSubmit={handleCreateCourse}
              />
            </div>

            <div className="mt-5 space-y-3">
              {courses.length === 0 ? <p className="text-sm text-gray-600">Chưa có khóa học nào.</p> : null}
              {courses.map((course) => {
                const active = course.id === selectedCourseId
                return (
                  <button
                    key={course.id}
                    type="button"
                    className={`w-full rounded-xl border p-4 text-left transition-colors ${
                      active ? 'border-indigo-300 bg-indigo-50 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedCourseId(course.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{course.name}</p>
                        <p className="mt-1 text-sm text-gray-600">
                          {course.level} · {courseTypeLabels[course.type]}
                        </p>
                      </div>
                      <StatusBadge status={course.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                      <span>{course.topics.length} chủ đề</span>
                      <span>{countLessons(course)} bài học</span>
                      <span>{countQuestions(course)} câu hỏi</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>

          <main className="space-y-6">
            {!selectedCourse ? (
              <section className={cardClassName}>
                <p className="text-gray-600">Chọn hoặc tạo một khóa học để bắt đầu.</p>
              </section>
            ) : (
              <>
                <section className={cardClassName}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedCourse.name}</h2>
                      <p className="mt-1 text-sm text-gray-600">
                        {selectedCourse.level} · {courseTypeLabels[selectedCourse.type]} · {selectedCourse.topics.length} chủ đề ·{' '}
                        {countLessons(selectedCourse)} bài học · {countQuestions(selectedCourse)} câu hỏi
                      </p>
                    </div>
                    <StatusBadge status={selectedCourse.status} />
                  </div>

                  {selectedCourse.rejectionReason ? (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      Lý do từ chối: {selectedCourse.rejectionReason}
                    </div>
                  ) : null}

                  {selectedCourseEditable ? (
                    <div className="mt-5 space-y-4">
                      <CourseForm
                        key={`course-${selectedCourse.id}`}
                        initialValue={getCourseInitialValue(selectedCourse)}
                        loading={action === `update-course-${selectedCourse.id}`}
                        disabled={action !== null && action !== `update-course-${selectedCourse.id}`}
                        submitLabel="Lưu khóa học"
                        onSubmit={handleUpdateCourse}
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          variant="danger"
                          loading={action === `delete-course-${selectedCourse.id}`}
                          disabled={action !== null && action !== `delete-course-${selectedCourse.id}`}
                          onClick={handleDeleteCourse}
                        >
                          Xóa khóa học
                        </Button>
                        <Button
                          loading={action === `submit-course-${selectedCourse.id}`}
                          disabled={!canSubmitCourse(selectedCourse) || (action !== null && action !== `submit-course-${selectedCourse.id}`)}
                          onClick={handleSubmitCourse}
                        >
                          Gửi duyệt
                        </Button>
                      </div>
                      {!canSubmitCourse(selectedCourse) ? (
                        <p className="text-sm text-amber-700">Cần có ít nhất 1 chủ đề, 1 bài học và 1 câu hỏi để gửi duyệt.</p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-5 space-y-3 text-sm text-gray-700">
                      <p>{selectedCourse.description || 'Chưa có mô tả.'}</p>
                      <p>Khóa học đang ở trạng thái không thể chỉnh sửa.</p>
                    </div>
                  )}
                </section>

                <section className={cardClassName}>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">Cấu trúc nội dung</h2>
                    <span className="text-sm text-gray-500">{selectedCourse.topics.length} chủ đề</span>
                  </div>

                  {selectedCourseEditable ? (
                    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <TopicForm
                        key={`create-topic-${selectedCourse.id}-${formResetVersion}`}
                        loading={action === `create-topic-${selectedCourse.id}`}
                        disabled={action !== null && action !== `create-topic-${selectedCourse.id}`}
                        submitLabel="Thêm chủ đề"
                        onSubmit={(payload) => handleCreateTopic(selectedCourse.id, payload)}
                      />
                    </div>
                  ) : null}

                  <div className="mt-5 space-y-5">
                    {selectedCourse.topics.length === 0 ? <p className="text-sm text-gray-600">Chưa có chủ đề nào.</p> : null}
                    {selectedCourse.topics.map((topic) => (
                      <article key={topic.id} className={mutedCardClassName}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Chủ đề</p>
                            <h3 className="mt-1 text-lg font-semibold text-gray-900">{topic.name}</h3>
                            <p className="mt-1 text-sm text-gray-600">{topic.description || 'Chưa có mô tả.'}</p>
                          </div>
                          <span className="text-sm text-gray-500">{topic.lessons.length} bài học</span>
                        </div>

                        {selectedCourseEditable ? (
                          <div className="mt-4 space-y-4">
                            <TopicForm
                              key={`topic-${topic.id}`}
                              initialValue={getTopicInitialValue(topic)}
                              loading={action === `update-topic-${topic.id}`}
                              disabled={action !== null && action !== `update-topic-${topic.id}`}
                              submitLabel="Lưu chủ đề"
                              onSubmit={(payload) => handleUpdateTopic(topic.id, payload)}
                            />
                            <Button
                              variant="danger"
                              loading={action === `delete-topic-${topic.id}`}
                              disabled={action !== null && action !== `delete-topic-${topic.id}`}
                              onClick={() => handleDeleteTopic(topic.id)}
                            >
                              Xóa chủ đề
                            </Button>
                            <div className="rounded-xl border border-gray-200 bg-white p-4">
                              <LessonForm
                                key={`create-lesson-${topic.id}-${formResetVersion}`}
                                loading={action === `create-lesson-${topic.id}`}
                                disabled={action !== null && action !== `create-lesson-${topic.id}`}
                                submitLabel="Thêm bài học"
                                onSubmit={(payload) => handleCreateLesson(topic.id, payload)}
                              />
                            </div>
                          </div>
                        ) : null}

                        <div className="mt-4 space-y-4">
                          {topic.lessons.length === 0 ? <p className="text-sm text-gray-600">Chưa có bài học nào.</p> : null}
                          {topic.lessons.map((lesson) => (
                            <article key={lesson.id} className="rounded-xl border border-gray-200 bg-white p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Bài học</p>
                                  <h4 className="mt-1 font-semibold text-gray-900">{lesson.title}</h4>
                                  <p className="mt-1 text-sm text-gray-600">
                                    {skillTypeLabels[lesson.skillType]} · {lesson.questions.length} câu hỏi
                                  </p>
                                </div>
                                <StatusBadge status={lesson.status} />
                              </div>

                              {lesson.rejectionReason ? (
                                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                  Lý do từ chối: {lesson.rejectionReason}
                                </p>
                              ) : null}

                              {selectedCourseEditable ? (
                                <div className="mt-4 space-y-4">
                                  <LessonForm
                                    key={`lesson-${lesson.id}`}
                                    initialValue={getLessonInitialValue(lesson)}
                                    loading={action === `update-lesson-${lesson.id}`}
                                    disabled={action !== null && action !== `update-lesson-${lesson.id}`}
                                    submitLabel="Lưu bài học"
                                    onSubmit={(payload) => handleUpdateLesson(lesson.id, payload)}
                                  />
                                  <Button
                                    variant="danger"
                                    loading={action === `delete-lesson-${lesson.id}`}
                                    disabled={action !== null && action !== `delete-lesson-${lesson.id}`}
                                    onClick={() => handleDeleteLesson(lesson.id)}
                                  >
                                    Xóa bài học
                                  </Button>
                                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                    <QuestionForm
                                      key={`create-question-${lesson.id}-${formResetVersion}`}
                                      loading={action === `create-question-${lesson.id}`}
                                      disabled={action !== null && action !== `create-question-${lesson.id}`}
                                      submitLabel="Thêm câu hỏi"
                                      onSubmit={(payload) => handleCreateQuestion(lesson.id, payload)}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-3 space-y-2 text-sm text-gray-700">
                                  <p>{lesson.description || 'Chưa có mô tả bài học.'}</p>
                                  <p>{lesson.content || 'Chưa có nội dung bài học.'}</p>
                                </div>
                              )}

                              <div className="mt-4 space-y-3">
                                {lesson.questions.length === 0 ? <p className="text-sm text-gray-600">Chưa có câu hỏi nào.</p> : null}
                                {lesson.questions.map((question) => (
                                  <article key={question.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                      <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Câu hỏi</p>
                                        <p className="mt-1 font-medium text-gray-900">{question.questionText}</p>
                                        <p className="mt-1 text-sm text-gray-600">{questionTypeLabels[question.type]}</p>
                                      </div>
                                      <StatusBadge status={question.status} />
                                    </div>

                                    {selectedCourseEditable ? (
                                      <div className="mt-4 space-y-4">
                                        <QuestionForm
                                          key={`question-${question.id}`}
                                          initialValue={getQuestionInitialValue(question)}
                                          loading={action === `update-question-${question.id}`}
                                          disabled={action !== null && action !== `update-question-${question.id}`}
                                          submitLabel="Lưu câu hỏi"
                                          onSubmit={(payload) => handleUpdateQuestion(question.id, payload)}
                                        />
                                        <Button
                                          variant="danger"
                                          loading={action === `delete-question-${question.id}`}
                                          disabled={action !== null && action !== `delete-question-${question.id}`}
                                          onClick={() => handleDeleteQuestion(question.id)}
                                        >
                                          Xóa câu hỏi
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="mt-3 space-y-2 text-sm text-gray-700">
                                        {question.correctAnswer ? <p>Đáp án đúng: {question.correctAnswer}</p> : null}
                                        {question.explanation ? <p>Giải thích: {question.explanation}</p> : null}
                                        {question.options.length > 0 ? (
                                          <ul className="space-y-1">
                                            {question.options.map((option) => (
                                              <li key={option.id}>
                                                {option.optionText} {option.correct ? '(đúng)' : ''}
                                              </li>
                                            ))}
                                          </ul>
                                        ) : null}
                                      </div>
                                    )}
                                  </article>
                                ))}
                              </div>
                            </article>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </>
            )}
          </main>
        </div>
      )}
    </div>
  )
}
