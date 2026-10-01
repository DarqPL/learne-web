import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, FileQuestion, Loader2, Lock } from 'lucide-react'
import { getApiErrorMessage } from '../../../lib/api/client'
import { enrollStudentCourse, getStudentCourse, getStudentEnrollment } from '../../../lib/api/studentLearningApi'
import { checkoutCourse } from '../../../lib/api/studentMonetizationApi'
import type { StudentCourseDetail, StudentEnrollmentProgress } from '../../../lib/api/types'
import { cn } from '../../../lib/utils'
import { Alert, AlertDescription, AlertTitle } from '../../../components/shadcn/ui/alert'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../components/shadcn/ui/accordion'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/shadcn/ui/avatar'
import { Badge } from '../../../components/shadcn/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../../components/shadcn/ui/breadcrumb'
import { Button } from '../../../components/shadcn/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/shadcn/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '../../../components/shadcn/ui/field'
import { Input } from '../../../components/shadcn/ui/input'
import { lessonProgressStatusLabels, studentCourseTypeLabels, studentQuestionTypeLabels, studentSkillTypeLabels } from './studentLearningLabels'
import { countStudentLessons, countStudentQuestions, flattenProgressLessons } from './studentLearningUtils'
import { formatVnd } from '../payment/paymentUtils'

function parseCourseId(value: string | undefined) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function getContentPreview(content: string | null) {
  const text = content?.trim()
  if (!text) return 'Chưa có nội dung xem trước.'
  return text.length > 260 ? `${text.slice(0, 260).trimEnd()}...` : text
}

function getTotalLessonXp(lesson: StudentCourseDetail['topics'][number]['lessons'][number]) {
  return lesson.xpReward + lesson.questions.reduce((total, question) => total + question.xpReward, 0)
}

function getTeacherInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const enrollmentRedirectDelayMs = 900

export function StudentCourseDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const courseId = parseCourseId(id)
  const [course, setCourse] = useState<StudentCourseDetail | null>(null)
  const [enrollmentProgress, setEnrollmentProgress] = useState<StudentEnrollmentProgress | null>(null)
  const [expandedLessonId, setExpandedLessonId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [courseCouponCode, setCourseCouponCode] = useState('')
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null)
  const [redirectingEnrollmentId, setRedirectingEnrollmentId] = useState<number | null>(null)
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
    if (enrollmentRedirectTimerRef.current) {
      clearTimeout(enrollmentRedirectTimerRef.current)
      enrollmentRedirectTimerRef.current = null
    }

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
      setRedirectingEnrollmentId(null)
      setEnrollmentProgress(null)
      setExpandedLessonId(null)
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

  useEffect(() => {
    let cancelled = false

    if (!course?.enrolled || !course.activeEnrollmentId) {
      return () => {
        cancelled = true
      }
    }

    const enrollmentId = course.activeEnrollmentId
    void (async () => {
      try {
        const response = await getStudentEnrollment(enrollmentId)
        if (!cancelled) setEnrollmentProgress(response.data)
      } catch {
        if (!cancelled) setEnrollmentProgress(null)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [course?.enrolled, course?.activeEnrollmentId])

  async function handleEnroll() {
    if (!course || enrollingCourseId === course.id || redirectingEnrollmentId === course.id) return

    const enrollCourseId = course.id
    setError(null)
    setInfo(null)
    setEnrollingCourseId(enrollCourseId)
    try {
      const response = await enrollStudentCourse(enrollCourseId)
      if (!mountedRef.current || currentCourseIdRef.current !== enrollCourseId) return
      setInfo('Đăng ký khóa học thành công.')
      setRedirectingEnrollmentId(enrollCourseId)
      if (enrollmentRedirectTimerRef.current) clearTimeout(enrollmentRedirectTimerRef.current)
      enrollmentRedirectTimerRef.current = setTimeout(() => {
        navigate(`/student/enrollments/${response.data.id}`)
      }, enrollmentRedirectDelayMs)
    } catch (err) {
      if (!mountedRef.current || currentCourseIdRef.current !== enrollCourseId) return
      setError(getApiErrorMessage(err, 'Không thể đăng ký khóa học.'))
    } finally {
      if (mountedRef.current) {
        setEnrollingCourseId((currentId) => (currentId === enrollCourseId ? null : currentId))
      }
    }
  }

  async function handleCheckoutCourse() {
    if (!course || enrollingCourseId === course.id || redirectingEnrollmentId === course.id) return

    const checkoutCourseId = course.id
    setError(null)
    setInfo(null)
    setEnrollingCourseId(checkoutCourseId)
    try {
      const couponCode = courseCouponCode.trim()
      const response = await checkoutCourse(checkoutCourseId, couponCode ? { couponCode } : {})
      if (!mountedRef.current || currentCourseIdRef.current !== checkoutCourseId) return
      const order = response.data
      if (order.status === 'PENDING_PAYMENT' && order.paymentProvider === 'SEPAY') {
        navigate(`/student/payment/orders/${order.id}`)
        return
      }
      if (order.status === 'PAID') {
        const refreshed = await getStudentCourse(checkoutCourseId)
        if (!mountedRef.current || currentCourseIdRef.current !== checkoutCourseId) return
        setCourse(refreshed.data)
        setInfo('Thanh toán khóa học thành công.')
        if (refreshed.data.activeEnrollmentId) {
          setRedirectingEnrollmentId(checkoutCourseId)
          if (enrollmentRedirectTimerRef.current) clearTimeout(enrollmentRedirectTimerRef.current)
          enrollmentRedirectTimerRef.current = setTimeout(() => {
            navigate(`/student/enrollments/${refreshed.data.activeEnrollmentId}`)
          }, enrollmentRedirectDelayMs)
        }
        return
      }
      setError('Đơn thanh toán chưa sẵn sàng. Vui lòng thử lại sau.')
    } catch (err) {
      if (!mountedRef.current || currentCourseIdRef.current !== checkoutCourseId) return
      setError(getApiErrorMessage(err, 'Không thể tạo đơn thanh toán.'))
    } finally {
      if (mountedRef.current) {
        setEnrollingCourseId((currentId) => (currentId === checkoutCourseId ? null : currentId))
      }
    }
  }

  if (courseId === null) {
    return (
      <Card className="border-dashed border-gray-200 bg-white">
        <CardContent>
          <Alert variant="destructive">
            <FileQuestion aria-hidden="true" />
            <AlertTitle>Không tìm thấy khóa học.</AlertTitle>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (error && !course) {
    return (
      <Card className="border-red-100 bg-red-50/40">
        <CardContent>
          <Alert variant="destructive" className="border-red-200 bg-white">
            <FileQuestion aria-hidden="true" />
            <AlertTitle>Không thể tải khóa học</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!course) {
    return (
      <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/70">
        <CardContent className="flex items-center gap-3 py-8 text-sm font-medium text-gray-700">
          <Loader2 aria-hidden="true" className="size-4 animate-spin text-indigo-600" />
          Đang tải thông tin khóa học...
        </CardContent>
      </Card>
    )
  }

  const lessonCount = countStudentLessons(course)
  const questionCount = countStudentQuestions(course)
  const enrollmentActionPending = enrollingCourseId === course.id || redirectingEnrollmentId === course.id
  const requiresCheckout = course.accessStatus === 'LOCKED' && course.pricingType === 'PAID'
  const lessonStatusById = new Map(
    enrollmentProgress ? flattenProgressLessons(enrollmentProgress).map((lesson) => [lesson.lessonId, lesson.status] as const) : [],
  )
  const progressPercent = enrollmentProgress?.progressPercent ?? null

  function scrollToPurchasePanel() {
    document.getElementById('course-purchase-panel')?.scrollIntoView({ behavior: 'smooth' })
  }

  function toggleLesson(lessonId: number) {
    setExpandedLessonId((currentId) => (currentId === lessonId ? null : lessonId))
  }

  return (
    <div className="flex flex-col gap-6 overflow-hidden">
      <div className="flex flex-col gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/student/courses">Khóa học</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-56 truncate sm:max-w-none">{course.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button variant="ghost" size="sm" className="w-fit cursor-pointer" onClick={() => navigate('/student/courses')}>
          <ArrowLeft data-icon="inline-start" />
          Quay lại danh sách khóa học
        </Button>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">{course.name}</h1>
            {course.description ? <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-gray-600">{course.description}</p> : null}
            <div className="mt-3 flex items-center gap-2">
              <Avatar className="size-9">
                <AvatarImage src={course.teacherAvatarUrl ?? undefined} alt={course.teacherName} />
                <AvatarFallback>{getTeacherInitials(course.teacherName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-950">{course.teacherName}</p>
                <p className="text-xs text-gray-500">Giảng viên</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">
                {course.topics.length} chủ đề
              </Badge>
              <Badge variant="secondary" className="bg-sky-50 text-sky-700">
                {lessonCount} bài học
              </Badge>
              <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                {questionCount} câu hỏi
              </Badge>
              <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700">Trình độ {course.level}</Badge>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">{studentCourseTypeLabels[course.type]}</Badge>
            </div>
            {progressPercent !== null ? (
              <div className="mt-4 max-w-md">
                <div className="flex items-center justify-between gap-2 text-xs text-gray-600">
                  <span className="font-medium">Tiến độ của bạn</span>
                  <span>{progressPercent}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Tiến độ của bạn"
                  className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100"
                >
                  <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:min-w-60">
            {course.enrolled && course.activeEnrollmentId ? (
              <Button size="default" className="w-auto" onClick={() => navigate(`/student/enrollments/${course.activeEnrollmentId}`)}>
                Tiếp tục học
                <ArrowRight data-icon="inline-end" />
              </Button>
            ) : null}
            {!course.enrolled && requiresCheckout ? (
              <Card id="course-purchase-panel" className="w-full border-indigo-200 bg-white shadow-sm sm:w-72">
                <CardHeader>
                  <CardTitle>Thanh toán khóa học</CardTitle>
                  <CardDescription>
                    <span className="mt-1 block text-xl font-bold text-indigo-700">
                      {course.priceAmountVnd != null ? formatVnd(course.priceAmountVnd) : 'Liên hệ'}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="course-coupon-code">Mã giảm giá</FieldLabel>
                      <Input
                        id="course-coupon-code"
                        placeholder="Nhập mã giảm giá"
                        autoComplete="off"
                        value={courseCouponCode}
                        onChange={(event) => setCourseCouponCode(event.target.value)}
                      />
                      <FieldDescription>Nếu có mã, hệ thống sẽ áp dụng trước khi tạo QR.</FieldDescription>
                    </Field>
                    <Button size="default" className="w-full" loading={enrollmentActionPending} onClick={handleCheckoutCourse}>
                      Mua khóa học
                    </Button>
                  </FieldGroup>
                </CardContent>
              </Card>
            ) : null}
            {!course.enrolled && !requiresCheckout ? (
              <Button size="default" className="w-auto" loading={enrollmentActionPending} onClick={handleEnroll}>
                Đăng ký khóa học
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <FileQuestion aria-hidden="true" />
          <AlertTitle>{requiresCheckout ? 'Không thể tạo đơn thanh toán' : 'Không thể đăng ký khóa học'}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {info ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle>Đã đăng ký</AlertTitle>
          <AlertDescription className="text-emerald-700">{info}</AlertDescription>
        </Alert>
      ) : null}

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-xl font-bold tracking-tight text-gray-950 sm:text-2xl">Nội dung khóa học</h2>
          <p className="max-w-md text-sm leading-6 text-gray-500">Mở từng chủ đề, chọn bài học để xem trước nội dung và điểm kiến thức.</p>
        </div>

        <div className="flex flex-col gap-4">
          {course.topics.length === 0 && requiresCheckout ? (
            <Card className="border-indigo-200 bg-indigo-50/50">
              <CardContent className="flex flex-col items-start gap-3 py-6">
                <span className="flex size-10 items-center justify-center rounded-full bg-indigo-100">
                  <Lock aria-hidden="true" className="size-5 text-indigo-700" />
                </span>
                <CardTitle className="text-lg">Nội dung khóa học</CardTitle>
                <p className="text-sm leading-6 text-gray-600">
                  Nội dung chi tiết từng bài học và câu hỏi sẽ được mở ngay sau khi bạn hoàn tất mua khóa học.
                </p>
                <Button onClick={scrollToPurchasePanel}>Mua khóa học ngay</Button>
              </CardContent>
            </Card>
          ) : (
            <Accordion
              type="multiple"
              defaultValue={course.topics[0] ? [`topic-${course.topics[0].id}`] : []}
              className="flex flex-col gap-4"
            >
              {course.topics.map((topic) => (
                <AccordionItem
                  key={topic.id}
                  value={`topic-${topic.id}`}
                  className="rounded-2xl border border-gray-200 bg-white px-5 shadow-sm"
                >
                  <AccordionTrigger className="py-5 hover:no-underline">
                    <span className="flex min-w-0 flex-1 flex-col gap-2 text-left">
                      <span className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                          Chặng {topic.orderIndex}
                        </Badge>
                        <Badge variant="outline" className="border-gray-200 text-gray-700">
                          Chủ đề
                        </Badge>
                      </span>
                      <span className="text-xl font-semibold tracking-tight text-gray-950">{topic.name}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    {topic.description ? <p className="whitespace-pre-wrap text-sm leading-6 text-gray-600">{topic.description}</p> : null}

                    <div className="mt-3 flex flex-col gap-2">
                      {topic.lessons.map((lesson) => {
                        const expanded = expandedLessonId === lesson.id
                        const lessonStatus = lessonStatusById.get(lesson.id)
                        return (
                          <div key={lesson.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <button
                              type="button"
                              onClick={() => toggleLesson(lesson.id)}
                              aria-expanded={expanded}
                              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                            >
                              <span className="shrink-0 text-xs font-semibold text-gray-500">{lesson.orderIndex}</span>
                              <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-950">{lesson.title}</span>
                              <Badge variant="secondary" className="hidden shrink-0 text-[11px] sm:inline-flex">
                                {studentSkillTypeLabels[lesson.skillType]}
                              </Badge>
                              <Badge variant="outline" className="shrink-0 border-amber-200 bg-amber-50 text-[11px] text-amber-700">
                                {getTotalLessonXp(lesson)} XP
                              </Badge>
                              <span className="hidden shrink-0 text-xs whitespace-nowrap text-gray-500 md:inline">
                                {lesson.questionCount} câu hỏi
                              </span>
                              {lessonStatus ? (
                                <Badge variant="outline" className="shrink-0 text-[11px]">
                                  {lessonProgressStatusLabels[lessonStatus]}
                                </Badge>
                              ) : null}
                              <ChevronDown aria-hidden="true" className={cn('size-4 shrink-0 transition-transform', expanded ? 'rotate-180 text-indigo-500' : 'text-gray-400')} />
                            </button>
                            {expanded ? (
                              <div className="flex flex-col gap-3 border-t border-gray-100 px-3 py-3">
                                {lesson.description ? <p className="whitespace-pre-wrap text-sm leading-6 text-gray-600">{lesson.description}</p> : null}
                                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3">
                                  <p className="text-xs font-semibold tracking-wide text-gray-700 uppercase">Nội dung xem trước</p>
                                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-gray-700">{getContentPreview(lesson.content)}</p>
                                </div>
                                {lesson.questions.length > 0 ? (
                                  <div className="flex flex-col gap-2">
                                    {lesson.questions.map((question) => (
                                      <div key={question.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-2 text-xs text-gray-600">
                                        <Badge variant="secondary">
                                          <FileQuestion aria-hidden="true" className="text-amber-600" />
                                          {studentQuestionTypeLabels[question.type]}
                                        </Badge>
                                        <span>
                                          Điểm kiến thức: <span className="font-semibold text-gray-800">{question.knowledgePoint ?? 'Chưa có'}</span>
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </section>
    </div>
  )
}
