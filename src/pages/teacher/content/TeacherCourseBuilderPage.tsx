import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { getApiErrorMessage } from '../../../lib/api/client'
import {
  createTeacherLesson,
  createTeacherTopic,
  deleteTeacherCourse,
  deleteTeacherLesson,
  deleteTeacherTopic,
  getTeacherCourse,
  submitTeacherCourse,
  updateTeacherCourse,
  updateTeacherLesson,
  updateTeacherTopic,
} from '../../../lib/api/teacherContentApi'
import type { TeacherCourse, TeacherCourseRequest, TeacherLesson, TeacherLessonRequest, TeacherTopic, TeacherTopicRequest } from '../../../lib/api/types'
import { CourseForm } from './CourseForm'
import { LessonForm } from './LessonForm'
import { TeacherContentStatusBadge } from './TeacherContentStatusBadge'
import { TopicForm } from './TopicForm'
import { courseTypeLabels, skillTypeLabels } from './contentLabels'
import { canEditContent, canSubmitCourse, countLessons, countQuestions } from './contentUtils'
import { getCourseInitialValue, getLessonInitialValue, getTopicInitialValue } from './teacherContentMappers'

const cardClassName = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm'

function parsePositiveInteger(value: string | undefined) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function TeacherCourseBuilderPage() {
  const navigate = useNavigate()
  const { courseId } = useParams()
  const parsedCourseId = parsePositiveInteger(courseId)
  const [course, setCourse] = useState<TeacherCourse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [action, setAction] = useState<string | null>(null)
  const [formResetVersion, setFormResetVersion] = useState(0)

  useEffect(() => {
    if (parsedCourseId === null) return

    let cancelled = false
    void (async () => {
      try {
        const response = await getTeacherCourse(parsedCourseId)
        if (!cancelled) {
          setCourse(response.data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải khóa học.'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [parsedCourseId])

  const refreshCourse = async () => {
    if (parsedCourseId === null) return
    const response = await getTeacherCourse(parsedCourseId)
    setCourse(response.data)
  }

  const handleUpdateCourse = async (payload: TeacherCourseRequest) => {
    if (!course) return
    setAction('update-course')
    setError(null)
    setInfo(null)
    try {
      const response = await updateTeacherCourse(course.id, payload)
      setCourse(response.data)
      setInfo('Đã cập nhật khóa học.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật khóa học.'))
    } finally {
      setAction(null)
    }
  }

  const handleDeleteCourse = async () => {
    if (!course || !window.confirm('Bạn có chắc muốn xóa khóa học này?')) return
    setAction('delete-course')
    setError(null)
    setInfo(null)
    try {
      await deleteTeacherCourse(course.id)
      navigate('/teacher/content')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xóa khóa học.'))
      setAction(null)
    }
  }

  const handleSubmitCourse = async () => {
    if (!course || !canSubmitCourse(course)) return
    setAction('submit-course')
    setError(null)
    setInfo(null)
    try {
      const response = await submitTeacherCourse(course.id)
      setCourse(response.data)
      setInfo('Đã gửi khóa học để duyệt.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể gửi khóa học để duyệt.'))
    } finally {
      setAction(null)
    }
  }

  const handleCreateTopic = async (payload: TeacherTopicRequest) => {
    if (!course) return
    setAction('create-topic')
    setError(null)
    setInfo(null)
    try {
      await createTeacherTopic(course.id, payload)
      await refreshCourse()
      setFormResetVersion((version) => version + 1)
      setInfo('Đã tạo chủ đề.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tạo chủ đề.'))
    } finally {
      setAction(null)
    }
  }

  const handleUpdateTopic = async (topic: TeacherTopic, payload: TeacherTopicRequest) => {
    setAction(`update-topic-${topic.id}`)
    setError(null)
    setInfo(null)
    try {
      await updateTeacherTopic(topic.id, payload)
      await refreshCourse()
      setInfo('Đã cập nhật chủ đề.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật chủ đề.'))
    } finally {
      setAction(null)
    }
  }

  const handleDeleteTopic = async (topic: TeacherTopic) => {
    if (!window.confirm('Bạn có chắc muốn xóa chủ đề này?')) return
    setAction(`delete-topic-${topic.id}`)
    setError(null)
    setInfo(null)
    try {
      await deleteTeacherTopic(topic.id)
      await refreshCourse()
      setInfo('Đã xóa chủ đề.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xóa chủ đề.'))
    } finally {
      setAction(null)
    }
  }

  const handleCreateLesson = async (topic: TeacherTopic, payload: TeacherLessonRequest) => {
    setAction(`create-lesson-${topic.id}`)
    setError(null)
    setInfo(null)
    try {
      await createTeacherLesson(topic.id, payload)
      await refreshCourse()
      setFormResetVersion((version) => version + 1)
      setInfo('Đã tạo bài học.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tạo bài học.'))
    } finally {
      setAction(null)
    }
  }

  const handleUpdateLesson = async (lesson: TeacherLesson, payload: TeacherLessonRequest) => {
    setAction(`update-lesson-${lesson.id}`)
    setError(null)
    setInfo(null)
    try {
      await updateTeacherLesson(lesson.id, payload)
      await refreshCourse()
      setInfo('Đã cập nhật bài học.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật bài học.'))
    } finally {
      setAction(null)
    }
  }

  const handleDeleteLesson = async (lesson: TeacherLesson) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài học này?')) return
    setAction(`delete-lesson-${lesson.id}`)
    setError(null)
    setInfo(null)
    try {
      await deleteTeacherLesson(lesson.id)
      await refreshCourse()
      setInfo('Đã xóa bài học.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xóa bài học.'))
    } finally {
      setAction(null)
    }
  }

  const editable = course ? canEditContent(course.status) : false
  const canSubmit = course ? canSubmitCourse(course) : false
  const displayError = parsedCourseId === null ? 'Không tìm thấy khóa học.' : error

  return (
    <div className="space-y-6">
      <Button variant="secondary" onClick={() => navigate('/teacher/content')}>
        Quay lại thư viện
      </Button>

      {displayError ? <Alert>{displayError}</Alert> : null}
      {info ? <Alert variant="success">{info}</Alert> : null}

      {parsedCourseId !== null && course === null && !displayError ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : null}

      {course ? (
        <>
          <header className={cardClassName}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
                <p className="mt-2 text-gray-600">{course.description || 'Chưa có mô tả khóa học.'}</p>
                <p className="mt-3 text-sm text-gray-600">
                  {course.level} · {courseTypeLabels[course.type]} · {course.topics.length} chủ đề · {countLessons(course)} bài học · {countQuestions(course)} câu hỏi
                </p>
              </div>
              <TeacherContentStatusBadge status={course.status} />
            </div>
            {course.rejectionReason ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Lý do từ chối: {course.rejectionReason}</div>
            ) : null}
          </header>

          {editable ? (
            <section className={cardClassName}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Thông tin khóa học</h2>
                  <p className="mt-1 text-sm text-gray-600">Cập nhật thông tin khóa học trước khi gửi duyệt.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="danger" loading={action === 'delete-course'} disabled={action !== null && action !== 'delete-course'} onClick={handleDeleteCourse}>
                    Xóa khóa học
                  </Button>
                  <Button loading={action === 'submit-course'} disabled={!canSubmit || (action !== null && action !== 'submit-course')} onClick={handleSubmitCourse}>
                    Gửi duyệt
                  </Button>
                </div>
              </div>
              {!canSubmit ? <Alert variant="info">Cần có ít nhất 1 chủ đề, 1 bài học và 1 câu hỏi để gửi duyệt.</Alert> : null}
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <CourseForm
                  initialValue={getCourseInitialValue(course)}
                  loading={action === 'update-course'}
                  disabled={action !== null && action !== 'update-course'}
                  submitLabel="Lưu khóa học"
                  onSubmit={handleUpdateCourse}
                />
              </div>
            </section>
          ) : (
            <section className={cardClassName}>
              <h2 className="text-lg font-semibold text-gray-900">Thông tin khóa học</h2>
              <p className="mt-2 text-gray-600">Khóa học đang ở trạng thái chỉ đọc. Bạn không thể chỉnh sửa nội dung khi khóa học đang chờ duyệt, đã duyệt hoặc đã ẩn.</p>
            </section>
          )}

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Cấu trúc nội dung</h2>
              <p className="mt-1 text-sm text-gray-600">Quản lý chủ đề và bài học. Mở từng bài học để xây dựng câu hỏi.</p>
            </div>

            {editable ? (
              <div className={cardClassName}>
                <h3 className="mb-4 font-semibold text-gray-900">Thêm chủ đề</h3>
                <TopicForm
                  key={`create-topic-${formResetVersion}`}
                  loading={action === 'create-topic'}
                  disabled={action !== null && action !== 'create-topic'}
                  submitLabel="Tạo chủ đề"
                  onSubmit={handleCreateTopic}
                />
              </div>
            ) : null}

            {course.topics.length === 0 ? (
              <div className={cardClassName}>
                <p className="text-gray-600">Chưa có chủ đề nào. Thêm chủ đề đầu tiên để bắt đầu xây dựng cấu trúc khóa học.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {course.topics.map((topic) => (
                  <article key={topic.id} className={cardClassName}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{topic.name}</h3>
                        <p className="mt-1 text-sm text-gray-600">{topic.description || 'Chưa có mô tả chủ đề.'}</p>
                      </div>
                      {editable ? (
                        <Button variant="danger" loading={action === `delete-topic-${topic.id}`} disabled={action !== null && action !== `delete-topic-${topic.id}`} onClick={() => handleDeleteTopic(topic)}>
                          Xóa chủ đề
                        </Button>
                      ) : null}
                    </div>

                    {editable ? (
                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <h4 className="mb-3 font-medium text-gray-900">Chỉnh sửa chủ đề</h4>
                          <TopicForm
                            initialValue={getTopicInitialValue(topic)}
                            loading={action === `update-topic-${topic.id}`}
                            disabled={action !== null && action !== `update-topic-${topic.id}`}
                            submitLabel="Lưu chủ đề"
                            onSubmit={(payload) => handleUpdateTopic(topic, payload)}
                          />
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <h4 className="mb-3 font-medium text-gray-900">Thêm bài học</h4>
                          <LessonForm
                            key={`create-lesson-${topic.id}-${formResetVersion}`}
                            loading={action === `create-lesson-${topic.id}`}
                            disabled={action !== null && action !== `create-lesson-${topic.id}`}
                            submitLabel="Tạo bài học"
                            onSubmit={(payload) => handleCreateLesson(topic, payload)}
                          />
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-5 space-y-3">
                      <h4 className="font-medium text-gray-900">Bài học</h4>
                      {topic.lessons.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-600">Chưa có bài học nào trong chủ đề này.</div>
                      ) : (
                        <div className="space-y-3">
                          {topic.lessons.map((lesson) => (
                            <div key={lesson.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <h5 className="font-semibold text-gray-900">{lesson.title}</h5>
                                  <p className="mt-1 text-sm text-gray-600">
                                    {skillTypeLabels[lesson.skillType]} · {lesson.questions.length} câu hỏi
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <TeacherContentStatusBadge status={lesson.status} />
                                  <Button variant="secondary" onClick={() => navigate(`/teacher/content/courses/${course.id}/lessons/${lesson.id}`)}>
                                    Mở bài học
                                  </Button>
                                </div>
                              </div>

                              {lesson.rejectionReason ? (
                                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Lý do từ chối: {lesson.rejectionReason}</div>
                              ) : null}

                              {editable ? (
                                <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                                  <div className="mb-3 flex items-center justify-between gap-3">
                                    <h6 className="font-medium text-gray-900">Chỉnh sửa bài học</h6>
                                    <Button
                                      variant="danger"
                                      loading={action === `delete-lesson-${lesson.id}`}
                                      disabled={action !== null && action !== `delete-lesson-${lesson.id}`}
                                      onClick={() => handleDeleteLesson(lesson)}
                                    >
                                      Xóa bài học
                                    </Button>
                                  </div>
                                  <LessonForm
                                    initialValue={getLessonInitialValue(lesson)}
                                    loading={action === `update-lesson-${lesson.id}`}
                                    disabled={action !== null && action !== `update-lesson-${lesson.id}`}
                                    submitLabel="Lưu bài học"
                                    onSubmit={(payload) => handleUpdateLesson(lesson, payload)}
                                  />
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
