import { useEffect, useState } from 'react'
import { useCourseSubmission } from './useCourseSubmission'
import { CourseSubmissionStatus } from './CourseSubmissionStatus'
import { getContentEditingState } from './contentUtils'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Info, Trash2, TriangleAlert } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/shadcn/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/ui/alert'
import { Badge } from '@/components/shadcn/ui/badge'
import { Button } from '@/components/shadcn/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/ui/card'
import { Skeleton } from '@/components/shadcn/ui/skeleton'
import { getApiErrorMessage } from '../../../lib/api/client'
import { CourseCoverEditorDialog } from '../../../components/course/CourseCoverEditorDialog'
import {
  createTeacherLesson,
  createTeacherQuestion,
  createTeacherTopic,
  cancelCourseCoverProposal,
  deleteTeacherCourse,
  deleteTeacherLesson,
  deleteTeacherQuestion,
  deleteTeacherTopic,
  getTeacherCourse,
  getCourseCoverState,
  submitTeacherCourse,
  uploadCourseCover,
  removeCourseCover,
  uploadCourseRevisionCover,
  removeCourseRevisionCover,
  updateTeacherCourse,
  updateTeacherLesson,
  updateTeacherQuestion,
  updateTeacherTopic,
} from '../../../lib/api/teacherContentApi'
import type {
  CourseImportResponse,
  LessonAudioFields,
  TeacherCourse,
  TeacherCourseCoverState,
  TeacherCourseRequest,
  TeacherLesson,
  TeacherLessonRequest,
  TeacherQuestion,
  TeacherQuestionRequest,
  TeacherTopic,
  TeacherTopicRequest,
} from '../../../lib/api/types'
import { CourseCoverImage } from '../../../components/course/CourseCoverImage'
import { CourseImportExportPanel } from './CourseImportExportPanel'
import { CourseBuilderWorkspace } from './CourseBuilderWorkspace'
import { TeacherContentStatusBadge } from './TeacherContentStatusBadge'
import { coursePricingTypeLabels, courseTypeLabels, formatVndAmount } from './contentLabels'
import { canSubmitCourse, countLessons, countQuestions, isPendingRevision, mergeLessonAudio } from './contentUtils'

const cardSoftClassName = 'border-indigo-100 bg-white/95 shadow-sm shadow-indigo-100/60'

function parsePositiveInteger(value: string | undefined) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function TeacherCourseBuilderPage() {
  const navigate = useNavigate()
  const { courseId } = useParams()
  const parsedCourseId = parsePositiveInteger(courseId)
  const [course, setCourse] = useState<TeacherCourse | null>(null)
  const [coverState, setCoverState] = useState<TeacherCourseCoverState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [action, setAction] = useState<string | null>(null)
  const [formResetVersion, setFormResetVersion] = useState(0)
  const [deleteCourseDialogOpen, setDeleteCourseDialogOpen] = useState(false)
  const [coverEditorOpen, setCoverEditorOpen] = useState(false)
  const [coverSourceFile, setCoverSourceFile] = useState<File | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await Promise.resolve()

      if (cancelled) return

      setCourse(null)
      setCoverState(null)
      if (parsedCourseId === null) return

      try {
        const [response, coverResponse] = await Promise.all([
          getTeacherCourse(parsedCourseId),
          getCourseCoverState(parsedCourseId),
        ])
        if (!cancelled) {
          setCourse(response.data)
          setCoverState(coverResponse.data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setCourse(null)
          setCoverState(null)
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
    const [response, coverResponse] = await Promise.all([
      getTeacherCourse(parsedCourseId),
      getCourseCoverState(parsedCourseId),
    ])
    setCourse((current) => current?.id === response.data.id ? response.data : current)
    setCoverState(coverResponse.data)
  }

  const refreshCoverState = async () => {
    if (parsedCourseId === null) return
    const response = await getCourseCoverState(parsedCourseId)
    setCoverState(response.data)
  }

  const { submission, acceptSubmission, active } = useCourseSubmission(parsedCourseId, course?.id === parsedCourseId ? course.submission : null, refreshCourse)
  const editingState = course ? getContentEditingState({ ...course, editingLocked: course.editingLocked || active }) : { kind: 'read-only' as const, reason: 'Đang tải khóa học.' }
  const mutationAllowed = editingState.kind === 'editable' && course?.id === parsedCourseId && action === null
  const handleConflict = async (err: unknown) => {
    if ((err as { response?: { status?: number } }).response?.status === 409) await refreshCourse().catch(() => undefined)
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

  const handleAudioChanged = (lessonId: number, audio: LessonAudioFields) => {
    setCourse((current) => (current ? mergeLessonAudio(current, lessonId, audio) : current))
  }

  const handleUpdateCourse = async (payload: TeacherCourseRequest) => {
    if (!course || !mutationAllowed) return
    setAction('update-course')
    setError(null)
    setInfo(null)
    try {
      const response = await updateTeacherCourse(course.id, payload)
      setCourse(response.data)
      setInfo('Đã cập nhật khóa học.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật khóa học.'))
      await handleConflict(err)
    } finally {
      setAction(null)
    }
  }

  const handleDeleteCourse = async () => {
    if (!course || !mutationAllowed) return
    setAction('delete-course')
    setError(null)
    setInfo(null)
    try {
      await deleteTeacherCourse(course.id)
      setDeleteCourseDialogOpen(false)
      navigate('/teacher/content')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xóa khóa học.'))
      await handleConflict(err)
      setAction(null)
    }
  }

  const handleUploadCover = async (file: File) => {
    if (!course || action !== null || action === 'delete-course') return
    setAction('upload-cover')
    setError(null)
    setInfo(null)
    try {
      const revisionCover = course.hasEditableRevision || course.latestRevisionStatus === 'PENDING_REVIEW'
      if (revisionCover) {
        await uploadCourseRevisionCover(course.id, file)
        setInfo('Đã gửi ảnh bìa cùng bản sửa để duyệt.')
      } else {
        await uploadCourseCover(course.id, file)
        setInfo('Đã gửi ảnh bìa để duyệt.')
      }
      try {
        await refreshCoverState()
      } catch {
        setError('Đã gửi ảnh bìa nhưng chưa thể tải lại trạng thái duyệt.')
      }
    } catch (err) {
      const message = getApiErrorMessage(err, 'Không thể tải ảnh bìa khóa học.')
      throw new Error(message, { cause: err })
    } finally {
      setAction(null)
    }
  }

  const handleCancelCoverProposal = async () => {
    if (!course || action !== null) return
    setAction('cancel-cover')
    setError(null)
    setInfo(null)
    try {
      await cancelCourseCoverProposal(course.id)
      await refreshCoverState()
      setInfo('Đã hủy đề xuất ảnh bìa đang chờ duyệt.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể hủy đề xuất ảnh bìa.'))
    } finally {
      setAction(null)
    }
  }

  const handleRemoveRevisionCover = async () => {
    if (!course || action !== null) return
    setAction('remove-revision-cover')
    setError(null)
    setInfo(null)
    try {
      await removeCourseRevisionCover(course.id)
      await refreshCoverState()
      setInfo('Đã xóa ảnh bìa đề xuất trong bản sửa.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xóa ảnh bìa đề xuất.'))
    } finally {
      setAction(null)
    }
  }

  const handleRemoveCover = async () => {
    if (!course || action !== null || action === 'delete-course') return
    setAction('remove-cover')
    setError(null)
    setInfo(null)
    try {
      await removeCourseCover(course.id)
      setCourse((current) => current ? { ...current, imageUrl: null } : current)
      setInfo('Đã xóa ảnh bìa khóa học.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xóa ảnh bìa khóa học.'))
    } finally {
      setAction(null)
    }
  }

  const handleSubmitCourse = async () => {
    if (!course || !mutationAllowed || !canSubmitCourse(course)) return
    setAction('submit-course')
    setError(null)
    setInfo(null)
    try {
      const response = await submitTeacherCourse(course.id)
      acceptSubmission(response.data)
      setCourse((current) => current?.id === response.data.courseId ? { ...current, submission: response.data, editingLocked: true } : current)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể gửi khóa học để duyệt.'))
      await handleConflict(err)
    } finally {
      setAction(null)
    }
  }

  const handleCreateTopic = async (payload: TeacherTopicRequest) => {
    if (!course || !mutationAllowed) return
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
      await handleConflict(err)
    } finally {
      setAction(null)
    }
  }

  const handleUpdateTopic = async (topic: TeacherTopic, payload: TeacherTopicRequest) => {
    if (!mutationAllowed) return
    setAction(`update-topic-${topic.id}`)
    setError(null)
    setInfo(null)
    try {
      const response = await updateTeacherTopic(topic.id, payload)
      updateTopicInCourse(response.data)
      await refreshCourseAfterSuccess('Đã cập nhật chủ đề.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật chủ đề.'))
      await handleConflict(err)
    } finally {
      setAction(null)
    }
  }

  const handleDeleteTopic = async (topic: TeacherTopic) => {
    if (!mutationAllowed) return
    setAction(`delete-topic-${topic.id}`)
    setError(null)
    setInfo(null)
    try {
      await deleteTeacherTopic(topic.id)
      setCourse((current) => (current ? { ...current, topics: current.topics.filter((item) => item.id !== topic.id) } : current))
      await refreshCourseAfterSuccess('Đã xóa chủ đề.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xóa chủ đề.'))
      await handleConflict(err)
    } finally {
      setAction(null)
    }
  }

  const handleCreateLesson = async (topic: TeacherTopic, payload: TeacherLessonRequest) => {
    if (!mutationAllowed) return
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
      await handleConflict(err)
    } finally {
      setAction(null)
    }
  }

  const handleUpdateLesson = async (lesson: TeacherLesson, payload: TeacherLessonRequest) => {
    if (!mutationAllowed) return
    setAction(`update-lesson-${lesson.id}`)
    setError(null)
    setInfo(null)
    try {
      const response = await updateTeacherLesson(lesson.id, payload)
      updateLessonInCourse(response.data)
      await refreshCourseAfterSuccess('Đã cập nhật bài học.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật bài học.'))
      await handleConflict(err)
    } finally {
      setAction(null)
    }
  }

  const handleDeleteLesson = async (lesson: TeacherLesson) => {
    if (!mutationAllowed) return
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
      await refreshCourseAfterSuccess('Đã xóa bài học.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xóa bài học.'))
      await handleConflict(err)
    } finally {
      setAction(null)
    }
  }

  const handleCreateQuestion = async (lessonId: number, payload: TeacherQuestionRequest) => {
    if (!mutationAllowed) return
    setAction(`create-question-${lessonId}`)
    setError(null)
    setInfo(null)
    try {
      await createTeacherQuestion(lessonId, payload)
      setFormResetVersion((version) => version + 1)
      await refreshCourseAfterSuccess('Đã tạo câu hỏi.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tạo câu hỏi.'))
      await handleConflict(err)
    } finally {
      setAction(null)
    }
  }

  const handleUpdateQuestion = async (question: TeacherQuestion, payload: TeacherQuestionRequest) => {
    if (!mutationAllowed) return
    setAction(`update-question-${question.id}`)
    setError(null)
    setInfo(null)
    try {
      await updateTeacherQuestion(question.id, payload)
      await refreshCourseAfterSuccess('Đã cập nhật câu hỏi.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật câu hỏi.'))
      await handleConflict(err)
    } finally {
      setAction(null)
    }
  }

  const handleDeleteQuestion = async (question: TeacherQuestion) => {
    if (!mutationAllowed) return
    setAction(`delete-question-${question.id}`)
    setError(null)
    setInfo(null)
    try {
      await deleteTeacherQuestion(question.id)
      await refreshCourseAfterSuccess('Đã xóa câu hỏi.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xóa câu hỏi.'))
      await handleConflict(err)
    } finally {
      setAction(null)
    }
  }

  const currentCourse = parsedCourseId !== null && course?.id === parsedCourseId ? course : null
  const editable = editingState.kind === 'editable'
  const canSubmit = editable && currentCourse ? canSubmitCourse(currentCourse) : false
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
        <div className="flex flex-col gap-6">
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
      ) : null}

      {currentCourse ? (
        <>
          <CourseSubmissionStatus submission={submission} />
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
                    <Badge variant={currentCourse.pricingType === 'PAID' ? 'default' : 'secondary'}>
                      {coursePricingTypeLabels[currentCourse.pricingType]}
                    </Badge>
                    {currentCourse.pricingType === 'PAID' ? (
                      <Badge variant="outline">
                        {formatVndAmount(currentCourse.priceAmountVnd ?? currentCourse.proposedPriceAmountVnd)}
                      </Badge>
                    ) : null}
                    <TeacherContentStatusBadge status={currentCourse.status} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {currentCourse.topics.length} chủ đề · {countLessons(currentCourse)} bài học · {countQuestions(currentCourse)} câu hỏi
                  </p>
                </div>
                {editable ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="destructive" disabled={busy} onClick={() => setDeleteCourseDialogOpen(true)}>
                      <Trash2 data-icon="inline-start" aria-hidden="true" />
                      Xóa khóa học
                    </Button>
                  </div>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)] sm:items-center">
                <CourseCoverImage courseName={currentCourse.name} imageUrl={currentCourse.imageUrl} />
                <div className="flex flex-wrap gap-2">
                  <label className={`inline-flex h-9 cursor-pointer items-center rounded-md bg-indigo-600 px-4 text-sm font-medium text-white ${action !== null ? 'pointer-events-none opacity-50' : ''}`}>
                    {action === 'upload-cover' ? 'Đang tải...' : currentCourse.imageUrl ? 'Thay ảnh bìa' : 'Tải ảnh bìa'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={action !== null}
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        event.target.value = ''
                        if (file) {
                          setCoverSourceFile(file)
                          setCoverEditorOpen(true)
                        }
                      }}
                    />
                  </label>
                  {currentCourse.imageUrl ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={action !== null}
                      onClick={() => void handleRemoveCover()}
                    >
                      {action === 'remove-cover' ? 'Đang xóa...' : 'Xóa ảnh bìa'}
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Ảnh công khai chỉ thay đổi sau khi được duyệt. Xóa ảnh công khai có hiệu lực ngay.
              </p>
              {!currentCourse.imageUrl ? (
                <p className="mt-2 text-sm text-muted-foreground">Chưa có ảnh bìa công khai.</p>
              ) : null}
              {coverState?.pendingSnapshot?.kind === 'COVER_ONLY' &&
              coverState.pendingSnapshot.status === 'PENDING_REVIEW' &&
              coverState.pendingSnapshot.proposedImageUrl ? (
                <div className="mt-4 grid gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3 sm:grid-cols-[minmax(0,240px)_1fr] sm:items-center">
                  <CourseCoverImage
                    courseName={currentCourse.name}
                    imageUrl={coverState.pendingSnapshot.proposedImageUrl}
                    imageAlt={`Ảnh bìa đề xuất đang chờ duyệt cho ${currentCourse.name}`}
                  />
                  <div className="flex flex-col items-start gap-2">
                    <p className="text-sm font-medium text-amber-900">Ảnh bìa mới đang chờ duyệt.</p>
                    <Button type="button" variant="outline" disabled={action !== null} onClick={() => void handleCancelCoverProposal()}>
                      {action === 'cancel-cover' ? 'Đang hủy...' : 'Hủy đề xuất ảnh bìa'}
                    </Button>
                  </div>
                </div>
              ) : null}
              {coverState?.revisionCandidate ? (
                <div className="mt-4 grid gap-3 rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 sm:grid-cols-[minmax(0,240px)_1fr] sm:items-center">
                  <CourseCoverImage
                    courseName={currentCourse.name}
                    imageUrl={coverState.revisionCandidate.proposedImageUrl}
                    imageAlt={`Ảnh bìa đề xuất trong bản sửa cho ${currentCourse.name}`}
                  />
                  <div className="flex flex-col items-start gap-2">
                    <p className="text-sm font-medium text-indigo-900">
                      Ảnh bìa đề xuất trong bản sửa · {coverState.revisionCandidate.status}
                    </p>
                      {coverState.revisionCandidate.status === 'DRAFT' ||
                      coverState.revisionCandidate.status === 'REJECTED' ? (
                        <Button type="button" variant="outline" disabled={action !== null} onClick={() => void handleRemoveRevisionCover()}>
                          {action === 'remove-revision-cover' ? 'Đang xóa...' : 'Xóa ảnh bìa đề xuất'}
                        </Button>
                      ) : null}
                  </div>
                </div>
              ) : null}
              {coverState?.latestCoverReview?.status === 'REJECTED' ? (
                <Alert variant="destructive" className="mt-4">
                  <TriangleAlert aria-hidden="true" />
                  <AlertTitle>Ảnh bìa bị từ chối</AlertTitle>
                  <AlertDescription>{coverState.latestCoverReview.rejectionReason || 'Không có lý do được cung cấp.'}</AlertDescription>
                </Alert>
              ) : null}
              {coverState?.latestCoverReview?.status === 'SUPERSEDED' ? (
                <Alert className="mt-4">
                  <AlertTitle>Đề xuất ảnh bìa đã được thay thế</AlertTitle>
                  <AlertDescription>Đề xuất cũ không còn trong hàng chờ duyệt.</AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
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

          {isPendingRevision(currentCourse) ? (
            <Alert className="border-amber-200 bg-amber-50/60">
              <Info aria-hidden="true" className="text-amber-600" />
              <AlertTitle>Thông báo</AlertTitle>
              <AlertDescription>Bản nháp đang chờ duyệt.</AlertDescription>
            </Alert>
          ) : null}
          {currentCourse.status === 'APPROVED' &&
          (currentCourse.hasEditableRevision ||
            currentCourse.latestRevisionStatus === 'DRAFT' ||
            currentCourse.latestRevisionStatus === 'REJECTED') ? (
            <Alert className="border-indigo-200 bg-indigo-50/60">
              <Info aria-hidden="true" className="text-indigo-600" />
              <AlertTitle>Thông báo</AlertTitle>
              <AlertDescription>
                Đang sửa bản nháp R{currentCourse.latestRevisionId} — nội dung đã xuất bản không đổi cho đến khi được
                duyệt.
              </AlertDescription>
            </Alert>
          ) : null}

          <CourseBuilderWorkspace
            course={currentCourse}
            action={action}
            editingState={editingState}
            canSubmit={canSubmit}
            formResetVersion={formResetVersion}
            importExportPanel={
              <CourseImportExportPanel
                courseId={currentCourse.id}
                editingState={editingState}
                onConflict={refreshCourse}
                description="Export khóa học hiện tại hoặc import gói nén để cập nhật cấu trúc nội dung."
                onImported={handleImportCourse}
              />
            }
            onUpdateCourse={handleUpdateCourse}
            onSubmitCourse={handleSubmitCourse}
            onCreateTopic={handleCreateTopic}
            onUpdateTopic={handleUpdateTopic}
            onDeleteTopic={handleDeleteTopic}
            onCreateLesson={handleCreateLesson}
            onUpdateLesson={handleUpdateLesson}
            onDeleteLesson={handleDeleteLesson}
            onCreateQuestion={handleCreateQuestion}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onAudioChanged={handleAudioChanged}
          />

          <CourseCoverEditorDialog
            open={coverEditorOpen}
            sourceFile={coverSourceFile}
            submitting={action === 'upload-cover'}
            onOpenChange={(open) => {
              setCoverEditorOpen(open)
              if (!open) setCoverSourceFile(null)
            }}
            onSubmit={handleUploadCover}
          />

          <AlertDialog
            open={deleteCourseDialogOpen}
            onOpenChange={(open) => {
              if (!open && busy) return
              setDeleteCourseDialogOpen(open)
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                    <TriangleAlert className="size-5" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <AlertDialogTitle>Xóa khóa học</AlertDialogTitle>
                    <AlertDialogDescription>
                      Xóa vĩnh viễn khóa học <span className="font-semibold text-gray-900">{currentCourse.name}</span> cùng toàn bộ chủ đề, bài học và câu hỏi?
                      <span className="mt-2 block rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                        Hành động này không thể hoàn tác.
                      </span>
                    </AlertDialogDescription>
                  </div>
                </div>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button variant="outline" disabled={busy}>
                    Hủy
                  </Button>
                </AlertDialogCancel>
                <Button variant="destructive" loading={action === 'delete-course'} disabled={busy} onClick={() => void handleDeleteCourse()}>
                  <Trash2 data-icon="inline-start" aria-hidden="true" />
                  Xóa khóa học
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </div>
  )
}
