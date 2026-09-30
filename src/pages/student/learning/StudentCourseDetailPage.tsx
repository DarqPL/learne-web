import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileQuestion,
  GraduationCap,
  Layers3,
  Loader2,
  PlayCircle,
  Target,
  type LucideIcon,
} from 'lucide-react'
import { getApiErrorMessage } from '../../../lib/api/client'
import { enrollStudentCourse, getStudentCourse } from '../../../lib/api/studentLearningApi'
import { checkoutCourse } from '../../../lib/api/studentMonetizationApi'
import type { StudentCourseDetail } from '../../../lib/api/types'
import { Alert, AlertDescription, AlertTitle } from '../../../components/shadcn/ui/alert'
import { Avatar } from '../../../components/ui/Avatar'
import { Badge } from '../../../components/shadcn/ui/badge'
import { Button } from '../../../components/shadcn/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/shadcn/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '../../../components/shadcn/ui/field'
import { Input } from '../../../components/shadcn/ui/input'
import { studentCourseTypeLabels, studentQuestionTypeLabels, studentSkillTypeLabels } from './studentLearningLabels'
import { countStudentLessons, countStudentQuestions, formatStudentLearningDate } from './studentLearningUtils'
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

const enrollmentRedirectDelayMs = 900

export function StudentCourseDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const courseId = parseCourseId(id)
  const [course, setCourse] = useState<StudentCourseDetail | null>(null)
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
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-indigo-600" />
          Đang tải thông tin khóa học...
        </CardContent>
      </Card>
    )
  }

  const lessonCount = countStudentLessons(course)
  const questionCount = countStudentQuestions(course)
  const enrollmentActionPending = enrollingCourseId === course.id || redirectingEnrollmentId === course.id
  const requiresCheckout = course.accessStatus === 'LOCKED' && course.pricingType === 'PAID'

  return (
    <div className="space-y-6 overflow-hidden">
      <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_32%),linear-gradient(135deg,_#ffffff_0%,_#eef6ff_52%,_#f7f3ff_100%)] p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-indigo-200 bg-white/85 text-indigo-700 shadow-sm">
                <GraduationCap aria-hidden="true" />
                {studentCourseTypeLabels[course.type]}
              </Badge>
              <Badge variant="outline" className="border-sky-200 bg-white/85 text-sky-700 shadow-sm">
                <Target aria-hidden="true" />
                Trình độ {course.level}
              </Badge>
              {course.enrolled ? (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm">
                  <CheckCircle2 aria-hidden="true" />
                  Đã đăng ký
                </Badge>
              ) : null}
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600">Course Story</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-5xl">{course.name}</h1>
            {course.description ? <p className="mt-5 max-w-2xl whitespace-pre-wrap text-base leading-7 text-gray-600 sm:text-lg">{course.description}</p> : null}

            <Card className="mt-6 max-w-xl border-white/80 bg-white/80 py-4 shadow-sm backdrop-blur">
              <CardContent className="flex items-center gap-3 px-4">
                <Avatar name={course.teacherName} url={course.teacherAvatarUrl ?? undefined} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-950">{course.teacherName}</p>
                  <p className="truncate text-xs text-gray-500">{course.teacherEmail}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:min-w-72 lg:w-80">
            {course.enrolled && course.activeEnrollmentId ? (
              <Button className="w-full sm:w-auto" size="lg" onClick={() => navigate(`/student/enrollments/${course.activeEnrollmentId}`)}>
                Tiếp tục học
                <ArrowRight aria-hidden="true" />
              </Button>
            ) : null}
            {!course.enrolled && requiresCheckout ? (
              <Card className="border-indigo-200 bg-white/90 shadow-sm">
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
                    <Button className="w-full" size="lg" loading={enrollmentActionPending} onClick={handleCheckoutCourse}>
                      Mua khóa học
                    </Button>
                  </FieldGroup>
                </CardContent>
              </Card>
            ) : null}
            {!course.enrolled && !requiresCheckout ? (
              <Button className="w-full sm:w-auto" size="lg" loading={enrollmentActionPending} onClick={handleEnroll}>
                Đăng ký khóa học
              </Button>
            ) : null}
          </div>
        </div>

        <dl className="mt-7 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <StoryStat icon={CalendarDays} label="Ngày xuất bản" value={formatStudentLearningDate(course.publishedAt)} />
          <StoryStat icon={Layers3} label="Chủ đề" value={course.topics.length} />
          <StoryStat icon={BookOpen} label="Bài học" value={lessonCount} />
          <StoryStat icon={FileQuestion} label="Câu hỏi" value={questionCount} />
        </dl>
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

      <section className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
              <PlayCircle aria-hidden="true" />
              Course Story
            </Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">Lộ trình nội dung khóa học</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-gray-500">Đi qua từng chủ đề như một bản đồ học tập: mở ngữ cảnh, luyện kỹ năng, rồi kiểm tra bằng câu hỏi ngắn.</p>
        </div>

        <div className="space-y-5">
          {course.topics.map((topic) => (
          <Card key={topic.id} className="overflow-hidden border-gray-200 bg-white py-0 shadow-sm">
            <CardContent className="p-0">
              <div className="border-b border-gray-100 bg-gray-50/70 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="bg-white text-gray-700">
                    Chặng {topic.orderIndex}
                  </Badge>
                  <Badge variant="outline" className="border-indigo-200 text-indigo-700">
                    Chủ đề
                  </Badge>
                </div>
                <h3 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">{topic.name}</h3>
                {topic.description ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">{topic.description}</p> : null}
              </div>

              <div className="space-y-4 p-5 sm:p-6">
                {topic.lessons.map((lesson) => (
                <article key={lesson.id} className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-xs sm:p-5">
                  <div className="absolute left-5 top-5 hidden h-[calc(100%-2.5rem)] w-px bg-indigo-100 sm:block" aria-hidden="true" />
                  <div className="relative flex flex-col gap-4 sm:pl-8">
                    <span className="absolute -left-10 top-1 hidden h-5 w-5 rounded-full border-4 border-white bg-indigo-500 shadow-sm sm:block" aria-hidden="true" />
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Bài học {lesson.orderIndex}</p>
                        <h4 className="mt-1 text-lg font-semibold text-gray-950">{lesson.title}</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                          {studentSkillTypeLabels[lesson.skillType]}
                        </Badge>
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                          {lesson.xpReward} XP
                        </Badge>
                        <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                          {lesson.questionCount} câu hỏi
                        </Badge>
                      </div>
                    </div>

                    {lesson.description ? <p className="whitespace-pre-wrap text-sm leading-6 text-gray-600">{lesson.description}</p> : null}
                    <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Nội dung xem trước</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{getContentPreview(lesson.content)}</p>
                    </div>

                    {lesson.questions.length > 0 ? (
                      <div className="grid gap-3 lg:grid-cols-2">
                        {lesson.questions.map((question) => (
                          <Card key={question.id} className="gap-3 border-gray-100 bg-gray-50/70 py-4 shadow-none">
                            <CardContent className="space-y-3 px-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary" className="bg-white text-gray-700">
                                  <FileQuestion aria-hidden="true" />
                                  {studentQuestionTypeLabels[question.type]}
                                </Badge>
                                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                                  {question.xpReward} XP
                                </Badge>
                              </div>
                              <p className="line-clamp-3 text-sm font-medium leading-6 text-gray-950">{question.questionText}</p>
                              <dl className="grid gap-2 text-xs text-gray-600 sm:grid-cols-3">
                                <div>
                                  <dt className="text-gray-500">Điểm kiến thức</dt>
                                  <dd className="mt-1 font-semibold text-gray-800">{question.knowledgePoint ?? 'Chưa có'}</dd>
                                </div>
                                <div>
                                  <dt className="text-gray-500">Độ khó</dt>
                                  <dd className="mt-1 font-semibold text-gray-800">{question.difficulty ?? 'Chưa có'}</dd>
                                </div>
                                <div>
                                  <dt className="text-gray-500">Số lựa chọn</dt>
                                  <dd className="mt-1 font-semibold text-gray-800">{question.optionCount}</dd>
                                </div>
                              </dl>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

function StoryStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur">
      <dt className="flex items-center gap-2 text-xs font-medium text-gray-500">
        <Icon aria-hidden="true" className="h-4 w-4 text-indigo-500" />
        {label}
      </dt>
      <dd className="mt-2 text-lg font-bold text-gray-950">{value}</dd>
    </div>
  )
}
