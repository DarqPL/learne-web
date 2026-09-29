import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Info, Pencil, Plus, Send, Trash2, TriangleAlert } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/shadcn/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/ui/alert'
import { Badge } from '@/components/shadcn/ui/badge'
import { Button } from '@/components/shadcn/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/ui/card'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/ui/dialog'
import { Separator } from '@/components/shadcn/ui/separator'
import { Skeleton } from '@/components/shadcn/ui/skeleton'
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
import type { CourseImportResponse, TeacherCourse, TeacherCourseRequest, TeacherLesson, TeacherLessonRequest, TeacherTopic, TeacherTopicRequest } from '../../../lib/api/types'
import { CourseImportExportPanel } from './CourseImportExportPanel'
import { CourseForm } from './CourseForm'
import { LessonForm } from './LessonForm'
import { TeacherContentStatusBadge } from './TeacherContentStatusBadge'
import { TopicForm } from './TopicForm'
import { courseTypeLabels, skillTypeLabels } from './contentLabels'
import { canEditContent, canSubmitCourse, countLessons, countQuestions } from './contentUtils'
import { getCourseInitialValue, getLessonInitialValue, getTopicInitialValue } from './teacherContentMappers'

const cardSoftClassName = 'border-indigo-100 bg-white/95 shadow-sm shadow-indigo-100/60'

function parsePositiveInteger(value: string | undefined) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function CourseEditForm({ course, action, onSubmit }: { course: TeacherCourse; action: string | null; onSubmit: (payload: TeacherCourseRequest) => void }) {
  const initialValue = useMemo(() => getCourseInitialValue(course), [course])

  return (
    <CourseForm
      initialValue={initialValue}
      loading={action === 'update-course'}
      disabled={action !== null && action !== 'update-course'}
      submitLabel="Lưu khóa học"
      onSubmit={onSubmit}
    />
  )
}

function TopicEditForm({
  topic,
  action,
  onSubmit,
}: {
  topic: TeacherTopic
  action: string | null
  onSubmit: (topic: TeacherTopic, payload: TeacherTopicRequest) => void
}) {
  const initialValue = useMemo(() => getTopicInitialValue(topic), [topic])

  return (
    <TopicForm
      initialValue={initialValue}
      loading={action === `update-topic-${topic.id}`}
      disabled={action !== null && action !== `update-topic-${topic.id}`}
      submitLabel="Lưu chủ đề"
      onSubmit={(payload) => onSubmit(topic, payload)}
    />
  )
}

function LessonEditForm({
  lesson,
  action,
  onSubmit,
}: {
  lesson: TeacherLesson
  action: string | null
  onSubmit: (lesson: TeacherLesson, payload: TeacherLessonRequest) => void
}) {
  const initialValue = useMemo(() => getLessonInitialValue(lesson), [lesson])

  return (
    <LessonForm
      initialValue={initialValue}
      loading={action === `update-lesson-${lesson.id}`}
      disabled={action !== null && action !== `update-lesson-${lesson.id}`}
      submitLabel="Lưu bài học"
      onSubmit={(payload) => onSubmit(lesson, payload)}
    />
  )
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
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [deleteCourseDialogOpen, setDeleteCourseDialogOpen] = useState(false)
  const [deleteTopicTarget, setDeleteTopicTarget] = useState<TeacherTopic | null>(null)
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<TeacherLesson | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await Promise.resolve()

      if (cancelled) return

      setCourse(null)
      if (parsedCourseId === null) return

      try {
        const response = await getTeacherCourse(parsedCourseId)
        if (!cancelled) {
          setCourse(response.data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setCourse(null)
          setError(getApiErrorMessage(err, 'Không thể tải khóa học.'))
        }
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

  const refreshCourseAfterSuccess = async (message: string) => {
    try {
      await refreshCourse()
      setInfo(message)
    } catch {
      setInfo(`${message} Tải lại dữ liệu chưa thành công, vui lòng làm mới trang nếu cần đồng bộ thêm.`)
    }
  }

  const updateTopicInCourse = (topic: TeacherTopic) => {
    setCourse((current) => (current ? { ...current, topics: current.topics.map((item) => (item.id === topic.id ? topic : item)) } : current))
  }

  const updateLessonInCourse = (lesson: TeacherLesson) => {
    setCourse((current) =>
      current
        ? {
            ...current,
            topics: current.topics.map((topic) => ({
              ...topic,
              lessons: topic.lessons.map((item) => (item.id === lesson.id ? lesson : item)),
            })),
          }
        : current,
    )
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
    if (!course) return
    setAction('delete-course')
    setError(null)
    setInfo(null)
    try {
      await deleteTeacherCourse(course.id)
      setDeleteCourseDialogOpen(false)
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
      setSubmitDialogOpen(false)
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
      const response = await createTeacherTopic(course.id, payload)
      setCourse((current) => (current ? { ...current, topics: [...current.topics, response.data] } : current))
      setFormResetVersion((version) => version + 1)
      await refreshCourseAfterSuccess('Đã tạo chủ đề.')
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
      const response = await updateTeacherTopic(topic.id, payload)
      updateTopicInCourse(response.data)
      await refreshCourseAfterSuccess('Đã cập nhật chủ đề.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật chủ đề.'))
    } finally {
      setAction(null)
    }
  }

  const handleDeleteTopic = async (topic: TeacherTopic) => {
    setAction(`delete-topic-${topic.id}`)
    setError(null)
    setInfo(null)
    try {
      await deleteTeacherTopic(topic.id)
      setCourse((current) => (current ? { ...current, topics: current.topics.filter((item) => item.id !== topic.id) } : current))
      setDeleteTopicTarget(null)
      await refreshCourseAfterSuccess('Đã xóa chủ đề.')
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
      const response = await createTeacherLesson(topic.id, payload)
      setCourse((current) =>
        current
          ? {
              ...current,
              topics: current.topics.map((item) => (item.id === topic.id ? { ...item, lessons: [...item.lessons, response.data] } : item)),
            }
          : current,
      )
      setFormResetVersion((version) => version + 1)
      await refreshCourseAfterSuccess('Đã tạo bài học.')
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
      const response = await updateTeacherLesson(lesson.id, payload)
      updateLessonInCourse(response.data)
      await refreshCourseAfterSuccess('Đã cập nhật bài học.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật bài học.'))
    } finally {
      setAction(null)
    }
  }

  const handleDeleteLesson = async (lesson: TeacherLesson) => {
    setAction(`delete-lesson-${lesson.id}`)
    setError(null)
    setInfo(null)
    try {
      await deleteTeacherLesson(lesson.id)
      setCourse((current) =>
        current
          ? {
              ...current,
              topics: current.topics.map((topic) => ({ ...topic, lessons: topic.lessons.filter((item) => item.id !== lesson.id) })),
            }
          : current,
      )
      setDeleteLessonTarget(null)
      await refreshCourseAfterSuccess('Đã xóa bài học.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xóa bài học.'))
    } finally {
      setAction(null)
    }
  }

  const currentCourse = parsedCourseId !== null && course?.id === parsedCourseId ? course : null
  const editable = currentCourse ? canEditContent(currentCourse.status) : false
  const canSubmit = currentCourse ? canSubmitCourse(currentCourse) : false
  const displayError = parsedCourseId === null ? 'Không tìm thấy khóa học.' : error
  const busy = action !== null

  const handleImportCourse = async (response: CourseImportResponse) => {
    if (currentCourse && response.courseId === currentCourse.id) {
      await refreshCourseAfterSuccess('Đã import khóa học. Dữ liệu khóa học đã được cập nhật.')
      return
    }

    setInfo('Đã import một khóa học khác. Đang mở khóa học vừa import.')
    navigate(`/teacher/content/courses/${response.courseId}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
        <Link to="/teacher/content" className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
          Nội dung
        </Link>
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-indigo-300" />
        <span aria-current="page" className="max-w-64 truncate text-muted-foreground">
          {currentCourse ? currentCourse.name : 'Chi tiết khóa học'}
        </span>
      </nav>

      {displayError ? (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Đã xảy ra lỗi</AlertTitle>
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      ) : null}
      {info ? (
        <Alert className="border-indigo-200 bg-indigo-50/60">
          <Info aria-hidden="true" className="text-indigo-600" />
          <AlertTitle>Thông báo</AlertTitle>
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      ) : null}

      {parsedCourseId !== null && currentCourse === null && !displayError ? (
        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <Card className={cardSoftClassName}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-2/3" />
            </CardContent>
          </Card>
          <div className="flex min-w-0 flex-col gap-6">
            <Card className={cardSoftClassName}>
              <CardHeader>
                <Skeleton className="h-6 w-52" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-9 w-32" />
              </CardContent>
            </Card>
            <Card className={cardSoftClassName}>
              <CardHeader>
                <Skeleton className="h-6 w-44" />
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {currentCourse ? (
        <>
          <Card className={cardSoftClassName}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="text-2xl">{currentCourse.name}</CardTitle>
                  <CardDescription className="mt-2">{currentCourse.description || 'Chưa có mô tả khóa học.'}</CardDescription>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                      {courseTypeLabels[currentCourse.type]}
                    </Badge>
                    <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                      {currentCourse.level}
                    </Badge>
                    <TeacherContentStatusBadge status={currentCourse.status} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {currentCourse.topics.length} chủ đề · {countLessons(currentCourse)} bài học · {countQuestions(currentCourse)} câu hỏi
                  </p>
                </div>
                {editable ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button disabled={!canSubmit || busy} loading={action === 'submit-course'} onClick={() => setSubmitDialogOpen(true)}>
                      <Send data-icon="inline-start" aria-hidden="true" />
                      Gửi duyệt
                    </Button>
                    <Button variant="destructive" disabled={busy} onClick={() => setDeleteCourseDialogOpen(true)}>
                      <Trash2 data-icon="inline-start" aria-hidden="true" />
                      Xóa khóa học
                    </Button>
                  </div>
                ) : null}
              </div>
            </CardHeader>
            {currentCourse.rejectionReason ? (
              <CardContent>
                <Alert variant="destructive">
                  <TriangleAlert aria-hidden="true" />
                  <AlertTitle>Lý do từ chối</AlertTitle>
                  <AlertDescription>{currentCourse.rejectionReason}</AlertDescription>
                </Alert>
              </CardContent>
            ) : null}
          </Card>

          <CourseImportExportPanel
            courseId={currentCourse.id}
            description="Export khóa học hiện tại hoặc import ZIP để cập nhật cấu trúc nội dung."
            onImported={handleImportCourse}
          />

          {editable && !canSubmit ? (
            <Alert className="border-sky-200 bg-sky-50/70">
              <Info aria-hidden="true" className="text-sky-600" />
              <AlertTitle>Chưa đủ điều kiện gửi duyệt</AlertTitle>
              <AlertDescription>Cần có ít nhất 1 chủ đề, 1 bài học và 1 câu hỏi để gửi duyệt.</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <Card className={`${cardSoftClassName} self-start`}>
              <CardHeader>
                <CardTitle>Cấu trúc nội dung</CardTitle>
                <CardDescription>Quản lý chủ đề và bài học. Mở từng bài học để xây dựng câu hỏi.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {currentCourse.topics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có chủ đề nào. Thêm chủ đề đầu tiên để bắt đầu xây dựng cấu trúc khóa học.</p>
                ) : (
                  <Accordion type="multiple" defaultValue={currentCourse.topics.map((topic) => `topic-${topic.id}`)} className="flex flex-col gap-2">
                    {currentCourse.topics.map((topic) => (
                      <AccordionItem key={topic.id} value={`topic-${topic.id}`} className="rounded-xl border border-indigo-100 bg-indigo-50/40 px-3">
                        <AccordionTrigger className="py-3 hover:no-underline">
                          <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
                            <span className="min-w-0 flex-1 truncate font-medium">{topic.name}</span>
                            <Badge variant="outline" className="shrink-0 border-violet-200 bg-violet-50 text-violet-700">
                              {topic.lessons.length} bài
                            </Badge>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-col gap-2 pb-1">
                            {topic.lessons.length === 0 ? (
                              <p className="rounded-lg border border-dashed border-indigo-200 px-3 py-2 text-sm text-muted-foreground">
                                Chưa có bài học nào trong chủ đề này.
                              </p>
                            ) : (
                              topic.lessons.map((lesson) => (
                                <NavLink
                                  key={lesson.id}
                                  to={`/teacher/content/courses/${currentCourse.id}/lessons/${lesson.id}`}
                                  className={({ isActive }) =>
                                    `flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                                      isActive
                                        ? 'border-indigo-300 bg-indigo-100/70 font-medium'
                                        : 'border-indigo-100 bg-white/80 hover:border-indigo-200 hover:bg-indigo-50/60'
                                    }`
                                  }
                                >
                                  <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                                  <Badge variant="outline" className="shrink-0 border-sky-200 bg-sky-50 text-sky-700">
                                    {skillTypeLabels[lesson.skillType]}
                                  </Badge>
                                  <span className="shrink-0 text-xs text-muted-foreground">{lesson.questions.length} câu</span>
                                </NavLink>
                              ))
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
                {editable ? (
                  <>
                    <Separator className="bg-indigo-100" />
                    <Button asChild variant="outline" className="w-full border-indigo-200">
                      <a href="#them-chu-de">
                        <Plus data-icon="inline-start" aria-hidden="true" />
                        Thêm chủ đề
                      </a>
                    </Button>
                  </>
                ) : null}
              </CardContent>
            </Card>

            <div className="flex min-w-0 flex-col gap-6">
              {editable ? (
                <Card className={cardSoftClassName}>
                  <CardHeader>
                    <CardTitle>Thông tin khóa học</CardTitle>
                    <CardDescription>Cập nhật thông tin khóa học trước khi gửi duyệt.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                      <CourseEditForm course={currentCourse} action={action} onSubmit={handleUpdateCourse} />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className={cardSoftClassName}>
                  <CardHeader>
                    <CardTitle>Thông tin khóa học</CardTitle>
                    <CardDescription>Khóa học đang ở trạng thái chỉ đọc. Bạn không thể chỉnh sửa nội dung khi khóa học đang chờ duyệt, đã duyệt hoặc đã ẩn.</CardDescription>
                  </CardHeader>
                </Card>
              )}

              {editable ? (
                <Card id="them-chu-de" className={`${cardSoftClassName} scroll-mt-6`}>
                  <CardHeader>
                    <CardTitle>Thêm chủ đề</CardTitle>
                    <CardDescription>Tạo chủ đề mới cho khóa học này.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                      <TopicForm
                        key={`create-topic-${formResetVersion}`}
                        loading={action === 'create-topic'}
                        disabled={action !== null && action !== 'create-topic'}
                        submitLabel="Tạo chủ đề"
                        onSubmit={handleCreateTopic}
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {currentCourse.topics.length === 0 ? (
                <Card className={cardSoftClassName}>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Chưa có chủ đề nào. Thêm chủ đề đầu tiên để bắt đầu xây dựng cấu trúc khóa học.</p>
                  </CardContent>
                </Card>
              ) : (
                currentCourse.topics.map((topic) => (
                  <Card key={topic.id} className={cardSoftClassName}>
                    <CardHeader>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle>{topic.name}</CardTitle>
                          <CardDescription className="mt-1">{topic.description || 'Chưa có mô tả chủ đề.'}</CardDescription>
                        </div>
                        {editable ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            loading={action === `delete-topic-${topic.id}`}
                            disabled={busy}
                            onClick={() => setDeleteTopicTarget(topic)}
                          >
                            <Trash2 data-icon="inline-start" aria-hidden="true" />
                            Xóa chủ đề
                          </Button>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      {editable ? (
                        <div className="grid gap-4 xl:grid-cols-2">
                          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                            <h4 className="mb-3 font-medium">Chỉnh sửa chủ đề</h4>
                            <TopicEditForm topic={topic} action={action} onSubmit={handleUpdateTopic} />
                          </div>
                          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                            <h4 className="mb-3 font-medium">Thêm bài học</h4>
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

                      <div className="flex flex-col gap-3">
                        <h4 className="font-medium">Bài học</h4>
                        {topic.lessons.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-indigo-200 p-4 text-sm text-muted-foreground">
                            Chưa có bài học nào trong chủ đề này.
                          </p>
                        ) : (
                          topic.lessons.map((lesson) => (
                            <div key={lesson.id} className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h5 className="font-semibold">{lesson.title}</h5>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {skillTypeLabels[lesson.skillType]} · {lesson.questions.length} câu hỏi
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <TeacherContentStatusBadge status={lesson.status} />
                                  <Button asChild variant="outline" size="sm">
                                    <Link to={`/teacher/content/courses/${currentCourse.id}/lessons/${lesson.id}`}>
                                      <Pencil data-icon="inline-start" aria-hidden="true" />
                                      Mở bài học
                                    </Link>
                                  </Button>
                                </div>
                              </div>

                              {lesson.rejectionReason ? (
                                <Alert variant="destructive" className="mt-3">
                                  <TriangleAlert aria-hidden="true" />
                                  <AlertTitle>Lý do từ chối</AlertTitle>
                                  <AlertDescription>{lesson.rejectionReason}</AlertDescription>
                                </Alert>
                              ) : null}

                              {editable ? (
                                <div className="mt-4 rounded-xl border border-indigo-100 bg-white/90 p-4">
                                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                    <h6 className="font-medium">Chỉnh sửa bài học</h6>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                      loading={action === `delete-lesson-${lesson.id}`}
                                      disabled={busy}
                                      onClick={() => setDeleteLessonTarget(lesson)}
                                    >
                                      <Trash2 data-icon="inline-start" aria-hidden="true" />
                                      Xóa bài học
                                    </Button>
                                  </div>
                                  <LessonEditForm lesson={lesson} action={action} onSubmit={handleUpdateLesson} />
                                </div>
                              ) : null}
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
            <DialogContent>
              <DialogHeader className="gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                  <Send className="size-5" aria-hidden="true" />
                </div>
                <DialogTitle>Gửi duyệt khóa học</DialogTitle>
                <DialogDescription>
                  Gửi khóa học &ldquo;{currentCourse.name}&rdquo; để duyệt? Sau khi gửi, nội dung sẽ chuyển sang trạng thái chờ duyệt và chỉ đọc.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={busy}>
                    Hủy
                  </Button>
                </DialogClose>
                <Button loading={action === 'submit-course'} disabled={busy} onClick={() => void handleSubmitCourse()}>
                  <Send data-icon="inline-start" aria-hidden="true" />
                  Gửi duyệt
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={deleteCourseDialogOpen} onOpenChange={setDeleteCourseDialogOpen}>
            <DialogContent>
              <DialogHeader className="gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <TriangleAlert className="size-5" aria-hidden="true" />
                </div>
                <DialogTitle>Xóa khóa học</DialogTitle>
                <DialogDescription>
                  Xóa vĩnh viễn khóa học &ldquo;{currentCourse.name}&rdquo; cùng toàn bộ chủ đề, bài học và câu hỏi? Hành động này không thể hoàn tác.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={busy}>
                    Hủy
                  </Button>
                </DialogClose>
                <Button variant="destructive" loading={action === 'delete-course'} disabled={busy} onClick={() => void handleDeleteCourse()}>
                  <Trash2 data-icon="inline-start" aria-hidden="true" />
                  Xóa khóa học
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={deleteTopicTarget !== null}
            onOpenChange={(open) => {
              if (!open) setDeleteTopicTarget(null)
            }}
          >
            <DialogContent>
              <DialogHeader className="gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <TriangleAlert className="size-5" aria-hidden="true" />
                </div>
                <DialogTitle>Xóa chủ đề</DialogTitle>
                <DialogDescription>
                  {deleteTopicTarget ? (
                    <>
                      Xóa vĩnh viễn chủ đề &ldquo;{deleteTopicTarget.name}&rdquo; cùng toàn bộ bài học và câu hỏi bên trong? Hành động này không thể
                      hoàn tác.
                    </>
                  ) : null}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={busy}>
                    Hủy
                  </Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  loading={deleteTopicTarget !== null && action === `delete-topic-${deleteTopicTarget.id}`}
                  disabled={busy}
                  onClick={() => {
                    if (deleteTopicTarget) void handleDeleteTopic(deleteTopicTarget)
                  }}
                >
                  <Trash2 data-icon="inline-start" aria-hidden="true" />
                  Xóa chủ đề
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={deleteLessonTarget !== null}
            onOpenChange={(open) => {
              if (!open) setDeleteLessonTarget(null)
            }}
          >
            <DialogContent>
              <DialogHeader className="gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <TriangleAlert className="size-5" aria-hidden="true" />
                </div>
                <DialogTitle>Xóa bài học</DialogTitle>
                <DialogDescription>
                  {deleteLessonTarget ? (
                    <>
                      Xóa vĩnh viễn bài học &ldquo;{deleteLessonTarget.title}&rdquo; cùng toàn bộ câu hỏi bên trong? Hành động này không thể hoàn tác.
                    </>
                  ) : null}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={busy}>
                    Hủy
                  </Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  loading={deleteLessonTarget !== null && action === `delete-lesson-${deleteLessonTarget.id}`}
                  disabled={busy}
                  onClick={() => {
                    if (deleteLessonTarget) void handleDeleteLesson(deleteLessonTarget)
                  }}
                >
                  <Trash2 data-icon="inline-start" aria-hidden="true" />
                  Xóa bài học
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}
