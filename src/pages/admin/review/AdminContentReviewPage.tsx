import { useEffect, useRef, useState } from 'react'
import { BadgeCheck, XCircle } from 'lucide-react'
import { getApiErrorMessage } from '../../../lib/api/client'
import { approveReviewCourse, getReviewCourse, listPendingReviewCourses, rejectReviewCourse } from '../../../lib/api/adminReviewApi'
import type { AdminReviewCourseDetail, AdminReviewCourseSummary, AdminReviewLesson, CoursePricingType } from '../../../lib/api/types'
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/shadcn/ui/accordion'
import { Badge } from '@/components/shadcn/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/shadcn/ui/breadcrumb'
import { Button } from '@/components/shadcn/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/shadcn/ui/dialog'
import { Skeleton } from '@/components/shadcn/ui/skeleton'
import { RejectCourseForm } from './RejectCourseForm'
import { reviewCourseTypeLabels, reviewQuestionTypeLabels, reviewSkillTypeLabels, reviewStatusLabels, reviewStatusStyles } from './adminReviewLabels'
import { countReviewLessons, countReviewQuestions, formatReviewDate } from './adminReviewUtils'

function StatusBadge({ status }: { status: AdminReviewCourseDetail['status'] }) {
  return (
    <Badge variant="outline" className={reviewStatusStyles[status]}>
      {reviewStatusLabels[status]}
    </Badge>
  )
}

function formatVnd(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'Chưa có giá'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

function pricingLabel(pricingType: CoursePricingType): string {
  return pricingType === 'PAID' ? 'Trả phí' : 'Miễn phí'
}

export function AdminContentReviewPage() {
  const [courses, setCourses] = useState<AdminReviewCourseSummary[] | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<AdminReviewCourseDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [action, setAction] = useState<string | null>(null)
  const [approveOpen, setApproveOpen] = useState(false)
  const [approveError, setApproveError] = useState<string | null>(null)
  const [approveProcessing, setApproveProcessing] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [lessonDetail, setLessonDetail] = useState<AdminReviewLesson | null>(null)
  const mountedRef = useRef(false)
  const detailRequestIdRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    mountedRef.current = true
    void (async () => {
      try {
        const response = await listPendingReviewCourses()
        const pendingCourses = response.data
        if (cancelled || !mountedRef.current) return

        setCourses(pendingCourses)
        const firstCourseId = pendingCourses[0]?.id ?? null
        if (firstCourseId === null) {
          detailRequestIdRef.current += 1
          setSelectedCourse(null)
          return
        }

        const requestId = detailRequestIdRef.current + 1
        detailRequestIdRef.current = requestId
        const detailResponse = await getReviewCourse(firstCourseId)
        if (!cancelled && mountedRef.current && detailRequestIdRef.current === requestId) setSelectedCourse(detailResponse.data)
      } catch (err) {
        if (!cancelled && mountedRef.current) {
          detailRequestIdRef.current += 1
          setError(getApiErrorMessage(err, 'Không thể tải khóa học chờ duyệt.'))
          setCourses([])
          setSelectedCourse(null)
        }
      }
    })()
    return () => {
      cancelled = true
      mountedRef.current = false
      detailRequestIdRef.current += 1
    }
  }, [])

  const loadPendingCourses = async (nextSelectedId?: number | null) => {
    const response = await listPendingReviewCourses()
    const pendingCourses = response.data
    if (!mountedRef.current) return

    setCourses(pendingCourses)

    const nextCourseId = nextSelectedId ?? pendingCourses[0]?.id ?? null
    if (nextCourseId === null) {
      detailRequestIdRef.current += 1
      setSelectedCourse(null)
      return
    }

    const requestId = detailRequestIdRef.current + 1
    detailRequestIdRef.current = requestId
    setSelectedCourse(null)
    setShowRejectForm(false)
    const detailResponse = await getReviewCourse(nextCourseId)
    if (mountedRef.current && detailRequestIdRef.current === requestId) setSelectedCourse(detailResponse.data)
  }

  const handleSelectCourse = async (courseId: number) => {
    const requestId = detailRequestIdRef.current + 1
    detailRequestIdRef.current = requestId
    setError(null)
    setInfo(null)
    setSelectedCourse(null)
    setShowRejectForm(false)
    try {
      const response = await getReviewCourse(courseId)
      if (mountedRef.current && detailRequestIdRef.current === requestId) setSelectedCourse(response.data)
    } catch (err) {
      if (mountedRef.current && detailRequestIdRef.current === requestId) {
        setSelectedCourse(null)
        setError(getApiErrorMessage(err, 'Không thể tải khóa học chờ duyệt.'))
      }
    }
  }

  const handleOpenApprove = () => {
    if (!selectedCourse || action !== null || approveProcessing) return
    if (selectedCourse.status !== 'PENDING_REVIEW') return
    setApproveError(null)
    setApproveOpen(true)
  }

  const handleConfirmApprove = () => {
    if (!selectedCourse || approveProcessing) return
    setApproveProcessing(true)
    setApproveError(null)
    setAction(`approve-course-${selectedCourse.id}`)
    setError(null)
    setInfo(null)
    void (async () => {
      try {
        await approveReviewCourse(selectedCourse.id)
        if (!mountedRef.current) return
        setInfo('Đã duyệt khóa học.')
        setShowRejectForm(false)
        await loadPendingCourses(null)
        setApproveOpen(false)
      } catch (err) {
        if (mountedRef.current) setApproveError(getApiErrorMessage(err, 'Không thể cập nhật kiểm duyệt nội dung.'))
      } finally {
        if (mountedRef.current) {
          setApproveProcessing(false)
          setAction(null)
        }
      }
    })()
  }

  const handleRejectCourse = async (reason: string) => {
    if (!selectedCourse) return
    setAction(`reject-course-${selectedCourse.id}`)
    setError(null)
    setInfo(null)
    try {
      await rejectReviewCourse(selectedCourse.id, { reason })
      if (!mountedRef.current) return
      setInfo('Đã từ chối khóa học.')
      setShowRejectForm(false)
      await loadPendingCourses(null)
    } catch (err) {
      if (mountedRef.current) setError(getApiErrorMessage(err, 'Không thể cập nhật kiểm duyệt nội dung.'))
    } finally {
      if (mountedRef.current) setAction(null)
    }
  }

  const busy = action !== null || approveProcessing
  const isDecided = selectedCourse !== null && selectedCourse.status !== 'PENDING_REVIEW'
  const detailLoading = courses !== null && courses.length > 0 && selectedCourse === null && error === null

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="flex flex-col gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Kiểm duyệt nội dung</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">Kiểm duyệt nội dung</h1>
          <p className="text-sm text-gray-600">Xem khóa học giảng viên gửi duyệt và phê duyệt hoặc từ chối theo gói nội dung.</p>
        </div>
      </section>

      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <XCircle aria-hidden="true" data-icon="inline-start" />
          <AlertTitle>Không thể tải khóa học chờ duyệt</AlertTitle>
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      ) : null}
      {info ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <AlertTitle>Thành công</AlertTitle>
          <AlertDescription className="text-emerald-700">{info}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <aside className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Khóa học chờ duyệt</h2>
            {courses !== null ? (
              <p className="mt-1 text-sm text-gray-600">{courses.length} khóa học đang chờ</p>
            ) : null}
          </div>
          <div className="p-4">
            {courses === null ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-24 w-full" />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <p className="px-1 py-4 text-sm text-gray-600">Không có khóa học nào đang chờ duyệt.</p>
            ) : (
              <div className="max-h-[65vh] overflow-y-auto">
                <div className="flex flex-col gap-3">
                  {courses.map((course) => {
                    const isSelected = selectedCourse?.id === course.id
                    return (
                      <button
                        key={course.id}
                        type="button"
                        className={`w-full rounded-xl border p-4 text-left transition-colors ${
                          isSelected ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-gray-50'
                        }`}
                        disabled={busy}
                        aria-current={isSelected ? 'true' : undefined}
                        onClick={() => handleSelectCourse(course.id)}
                      >
                        <span className="block font-medium text-gray-900">{course.name}</span>
                        <span className="mt-1 block text-sm text-gray-600">
                          {course.teacherName} · {course.teacherEmail}
                        </span>
                        <span className="mt-2 block text-sm text-gray-600">
                          {course.level} · {reviewCourseTypeLabels[course.type]}
                        </span>
                        <span className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge variant={course.pricingType === 'PAID' ? 'default' : 'secondary'}>{pricingLabel(course.pricingType)}</Badge>
                          {course.pricingType === 'PAID' ? <span className="text-sm text-gray-600">{formatVnd(course.proposedPriceAmountVnd)}</span> : null}
                        </span>
                        <span className="mt-2 block text-xs text-gray-500">
                          {course.topicCount} chủ đề · {course.lessonCount} bài học · {course.questionCount} câu hỏi
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">Cập nhật: {formatReviewDate(course.updatedAt)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </aside>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          {courses === null || detailLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : selectedCourse === null ? (
            <p className="text-sm text-gray-600">Chọn một khóa học để xem nội dung cần duyệt.</p>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-gray-900">{selectedCourse.name}</h2>
                  <StatusBadge status={selectedCourse.status} />
                </div>
                <dl className="grid gap-x-6 gap-y-1 text-sm text-gray-600 sm:grid-cols-2">
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-medium text-gray-900">Giảng viên</dt>
                    <dd className="truncate">
                      {selectedCourse.teacherName} · {selectedCourse.teacherEmail}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-medium text-gray-900">Cấp độ</dt>
                    <dd>{selectedCourse.level}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-medium text-gray-900">Loại khóa học</dt>
                    <dd>{reviewCourseTypeLabels[selectedCourse.type]}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-medium text-gray-900">Cập nhật</dt>
                    <dd>{formatReviewDate(selectedCourse.updatedAt)}</dd>
                  </div>
                </dl>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <Badge variant={selectedCourse.pricingType === 'PAID' ? 'default' : 'secondary'}>{pricingLabel(selectedCourse.pricingType)}</Badge>
                  {selectedCourse.pricingType === 'PAID' ? <span>{formatVnd(selectedCourse.proposedPriceAmountVnd)}</span> : null}
                  <span>
                    {selectedCourse.topics.length} chủ đề · {countReviewLessons(selectedCourse)} bài học · {countReviewQuestions(selectedCourse)} câu hỏi
                  </span>
                </div>
                {selectedCourse.description ? <p className="text-sm leading-6 text-gray-700">{selectedCourse.description}</p> : null}
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-semibold text-gray-900">Thông tin giá</h3>
                  <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                    <div className="flex gap-2">
                      <dt className="font-medium text-gray-900">Giá hiện tại</dt>
                      <dd>{formatVnd(selectedCourse.priceAmountVnd)}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="font-medium text-gray-900">Giá đề xuất</dt>
                      <dd>{formatVnd(selectedCourse.proposedPriceAmountVnd)}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="font-medium text-gray-900">Trạng thái giá</dt>
                      <dd>{selectedCourse.priceStatus}</dd>
                    </div>
                  </dl>
                </div>
                {selectedCourse.level === 'A1' && selectedCourse.pricingType === 'PAID' ? (
                  <Alert variant="destructive" className="mt-1">
                    <AlertTitle>A1 phải miễn phí</AlertTitle>
                    <AlertDescription>Backend sẽ từ chối duyệt khóa A1 trả phí.</AlertDescription>
                  </Alert>
                ) : null}
                {selectedCourse.pricingType === 'PAID' &&
                (selectedCourse.proposedPriceAmountVnd === null || selectedCourse.proposedPriceAmountVnd <= 0) ? (
                  <Alert variant="destructive" className="mt-1">
                    <AlertTitle>Thiếu giá đề xuất</AlertTitle>
                    <AlertDescription>Khóa trả phí cần giá đề xuất lớn hơn 0 trước khi duyệt.</AlertDescription>
                  </Alert>
                ) : null}
              </div>

              <div data-testid="approval-panel" className="sticky top-0 z-10 flex flex-col gap-3 border-y border-gray-200 bg-white py-3">
                <p className="text-sm text-gray-600">Trạng thái hiện tại: {reviewStatusLabels[selectedCourse.status]}</p>
                <div className="flex flex-row gap-2">
                  <Button disabled={busy || isDecided} onClick={handleOpenApprove}>
                    Duyệt khóa học
                  </Button>
                  <Button variant="outline" disabled={busy || isDecided} aria-expanded={showRejectForm} onClick={() => setShowRejectForm((value) => !value)}>
                    Từ chối
                  </Button>
                </div>
                {showRejectForm && !isDecided ? (
                  <RejectCourseForm key={selectedCourse.id} loading={action?.startsWith('reject-course') ?? false} disabled={busy} onSubmit={handleRejectCourse} />
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-gray-900">Nội dung khóa học</h3>
                {selectedCourse.topics.length === 0 ? (
                  <p className="text-sm text-gray-600">Khóa học chưa có chủ đề.</p>
                ) : (
                  <Accordion type="multiple" className="flex flex-col gap-2">
                    {selectedCourse.topics.map((topic) => (
                      <AccordionItem key={topic.id} value={`topic-${topic.id}`} className="rounded-lg border border-gray-200 px-4">
                        <AccordionTrigger className="py-3 hover:no-underline">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-gray-900">Chủ đề: {topic.name}</span>
                            <Badge variant="secondary">{topic.lessons.length} bài học</Badge>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          {topic.description ? <p className="mb-2 text-sm text-gray-600">{topic.description}</p> : null}
                          <div className="flex flex-col gap-1">
                            {topic.lessons.map((lesson) => (
                              <div key={lesson.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 py-2">
                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                  <span className="font-medium text-gray-900">{lesson.title}</span>
                                  <Badge variant="secondary">{reviewSkillTypeLabels[lesson.skillType]}</Badge>
                                  <Badge variant="secondary">{lesson.xpReward} XP</Badge>
                                  <Badge variant="outline" className={reviewStatusStyles[lesson.status]}>
                                    {reviewStatusLabels[lesson.status]}
                                  </Badge>
                                  {lesson.placementTest ? <Badge variant="secondary">Bài kiểm tra đầu vào</Badge> : null}
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setLessonDetail(lesson)}>
                                  Xem chi tiết bài học
                                </Button>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <Dialog
        open={lessonDetail !== null}
        onOpenChange={(open) => {
          if (!open) setLessonDetail(null)
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Xem chi tiết bài học</DialogTitle>
            {lessonDetail ? <DialogDescription>{lessonDetail.title}</DialogDescription> : null}
          </DialogHeader>
          {lessonDetail ? (
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{reviewSkillTypeLabels[lessonDetail.skillType]}</Badge>
                <Badge variant="secondary">{lessonDetail.xpReward} XP</Badge>
                <Badge variant="outline" className={reviewStatusStyles[lessonDetail.status]}>
                  {reviewStatusLabels[lessonDetail.status]}
                </Badge>
                {lessonDetail.placementTest ? <Badge variant="secondary">Bài kiểm tra đầu vào</Badge> : null}
              </div>
              {lessonDetail.description ? <p className="text-gray-600">{lessonDetail.description}</p> : null}
              {lessonDetail.content ? <p className="whitespace-pre-line leading-6 text-gray-700">{lessonDetail.content}</p> : null}
              <div className="flex flex-col gap-3">
                {lessonDetail.questions.map((question) => (
                  <div key={question.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h5 className="font-medium text-gray-900">Câu hỏi: {question.questionText}</h5>
                      <Badge variant="secondary">{reviewQuestionTypeLabels[question.type]}</Badge>
                      <Badge variant="secondary">{question.xpReward} XP</Badge>
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
                      <ul className="mt-3 flex flex-col gap-2">
                        {question.options.map((option) => (
                          <li key={option.id} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm text-gray-700">
                            <span>{option.optionText}</span>
                            {option.correct ? <Badge variant="secondary">Đáp án đúng</Badge> : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={approveOpen}
        onOpenChange={(open) => {
          if (approveProcessing) return
          if (!open) {
            setApproveOpen(false)
            setApproveError(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <BadgeCheck className="size-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <AlertDialogTitle>Duyệt khóa học {selectedCourse?.name}</AlertDialogTitle>
                <AlertDialogDescription>
                  Xác nhận duyệt khóa học <span className="font-semibold text-gray-900">{selectedCourse?.name}</span>?
                  <span className="mt-2 block rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                    Khóa học sẽ được xuất bản cho học viên sau khi duyệt.
                  </span>
                </AlertDialogDescription>
                {approveError ? (
                  <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
                    <XCircle aria-hidden="true" data-icon="inline-start" />
                    <AlertTitle>Không thể duyệt khóa học</AlertTitle>
                    <AlertDescription className="text-red-700">{approveError}</AlertDescription>
                  </Alert>
                ) : null}
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={approveProcessing}>
                Hủy
              </Button>
            </AlertDialogCancel>
            <Button loading={approveProcessing} disabled={approveProcessing} onClick={handleConfirmApprove}>
              Duyệt
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
