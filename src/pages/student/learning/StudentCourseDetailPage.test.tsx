import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StudentCourseDetailPage } from './StudentCourseDetailPage'
import { getStudentCourse, getStudentEnrollment } from '../../../lib/api/studentLearningApi'
import { checkoutCourse } from '../../../lib/api/studentMonetizationApi'
import type { OrderResponse, StudentCourseDetail, StudentEnrollmentProgress } from '../../../lib/api/types'

vi.mock('../../../lib/api/studentLearningApi', () => ({
  enrollStudentCourse: vi.fn(),
  getStudentCourse: vi.fn(),
  getStudentEnrollment: vi.fn(),
}))

vi.mock('../../../lib/api/studentMonetizationApi', () => ({
  checkoutCourse: vi.fn(),
}))

const mockedGetStudentCourse = vi.mocked(getStudentCourse)
const mockedGetStudentEnrollment = vi.mocked(getStudentEnrollment)
const mockedCheckoutCourse = vi.mocked(checkoutCourse)

function courseApiResponse(data: StudentCourseDetail): Awaited<ReturnType<typeof getStudentCourse>> {
  return { data } as Awaited<ReturnType<typeof getStudentCourse>>
}

function checkoutApiResponse(data: OrderResponse): Awaited<ReturnType<typeof checkoutCourse>> {
  return { data } as Awaited<ReturnType<typeof checkoutCourse>>
}

function makeCourse(overrides: Partial<StudentCourseDetail> = {}): StudentCourseDetail {
  return {
    id: 99,
    name: 'Premium English',
    description: 'Khóa học trả phí',
    type: 'COMPREHENSIVE',
    level: 'B1',
    teacherId: 7,
    teacherName: 'Teacher One',
    teacherEmail: 'teacher@example.com',
    teacherAvatarUrl: null,
    publishedAt: new Date().toISOString(),
    pricingType: 'PAID',
    priceAmountVnd: 300000,
    accessStatus: 'LOCKED',
    accessReason: 'Purchase is required.',
    enrolled: false,
    activeEnrollmentId: null,
    topics: [],
    ...overrides,
  }
}

function makeOrder(overrides: Partial<OrderResponse> = {}): OrderResponse {
  return {
    id: 42,
    orderType: 'COURSE_PURCHASE',
    status: 'PENDING_PAYMENT',
    originalAmountVnd: 300000,
    discountAmountVnd: 0,
    finalAmountVnd: 300000,
    couponId: null,
    paymentProvider: 'SEPAY',
    paymentReference: 'LEPAYMENT42',
    paidAt: null,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    items: [],
    paymentInstructions: null,
    ...overrides,
  }
}

function renderCourseDetail() {
  return render(
    <MemoryRouter initialEntries={['/student/courses/99']}>
      <Routes>
        <Route path="/student/courses/:id" element={<StudentCourseDetailPage />} />
        <Route path="/student/courses" element={<div>Courses list route</div>} />
        <Route path="/student/payment/orders/:orderId" element={<div>Payment order route</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function makeEnrollmentProgress(overrides: Partial<StudentEnrollmentProgress> = {}): StudentEnrollmentProgress {
  return {
    enrollmentId: 123,
    status: 'ACTIVE',
    progressPercent: 50,
    completedLessonCount: 1,
    totalLessonCount: 2,
    course: {
      id: 99,
      name: 'Premium English',
      level: 'B1',
      type: 'COMPREHENSIVE',
      teacherId: 7,
      teacherName: 'Teacher One',
    },
    topics: [
      {
        id: 1,
        name: 'Topic Alpha',
        orderIndex: 1,
        lessons: [
          {
            lessonId: 10,
            title: 'Lesson One',
            content: 'Lesson content preview',
            audioUrl: null,
            audioPublicId: null,
            skillType: 'GRAMMAR',
            orderIndex: 1,
            status: 'COMPLETED',
            progressPercent: 100,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          },
        ],
      },
    ],
    ...overrides,
  }
}

function enrollmentApiResponse(data: StudentEnrollmentProgress): Awaited<ReturnType<typeof getStudentEnrollment>> {
  return { data } as Awaited<ReturnType<typeof getStudentEnrollment>>
}

describe('StudentCourseDetailPage checkout', () => {
  beforeEach(() => {
    mockedGetStudentCourse.mockReset()
    mockedGetStudentEnrollment.mockReset()
    mockedGetStudentEnrollment.mockRejectedValue(new Error('not enrolled'))
    mockedCheckoutCourse.mockReset()
  })

  it('redirects paid locked SEPAY checkout orders to the payment page', async () => {
    mockedGetStudentCourse.mockResolvedValue(courseApiResponse(makeCourse()))
    mockedCheckoutCourse.mockResolvedValue(checkoutApiResponse(makeOrder()))

    renderCourseDetail()

    fireEvent.click(await screen.findByRole('button', { name: 'Mua khóa học' }))

    await waitFor(() => expect(mockedCheckoutCourse).toHaveBeenCalledWith(99, {}))
    expect(await screen.findByText('Payment order route')).toBeInTheDocument()
  })

  it('refreshes course access when checkout is already paid', async () => {
    mockedGetStudentCourse
      .mockResolvedValueOnce(courseApiResponse(makeCourse()))
      .mockResolvedValueOnce(courseApiResponse(makeCourse({ enrolled: true, activeEnrollmentId: 123, accessStatus: 'OWNED' })))
    mockedCheckoutCourse.mockResolvedValue(checkoutApiResponse(makeOrder({ status: 'PAID', paidAt: new Date().toISOString(), paymentInstructions: null })))

    renderCourseDetail()

    fireEvent.click(await screen.findByRole('button', { name: 'Mua khóa học' }))

    await waitFor(() => expect(mockedGetStudentCourse).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('Thanh toán khóa học thành công.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tiếp tục học' })).toBeInTheDocument()
  })

  it('sends coupon code when checking out a locked paid course', async () => {
    mockedGetStudentCourse.mockResolvedValue(courseApiResponse(makeCourse()))
    mockedCheckoutCourse.mockResolvedValue(checkoutApiResponse(makeOrder()))

    renderCourseDetail()

    fireEvent.change(await screen.findByLabelText(/mã giảm giá/i), { target: { value: ' sale20 ' } })
    fireEvent.click(await screen.findByRole('button', { name: 'Mua khóa học' }))

    await waitFor(() => expect(mockedCheckoutCourse).toHaveBeenCalledWith(99, { couponCode: 'sale20' }))
  })

  it('shows locked content notice for paid locked course without topics', async () => {
    mockedGetStudentCourse.mockResolvedValue(courseApiResponse(makeCourse({ topics: [] })))
    const scrollIntoViewMock = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock

    renderCourseDetail()

    expect(await screen.findByText(/sẽ được mở ngay sau khi bạn hoàn tất mua/i)).toBeInTheDocument()
    const noticeButton = await screen.findByRole('button', { name: 'Mua khóa học ngay' })
    expect(document.getElementById('course-purchase-panel')).toBeInTheDocument()
    fireEvent.click(noticeButton)
    expect(scrollIntoViewMock).toHaveBeenCalled()
  })
})

describe('StudentCourseDetailPage course detail accordion', () => {
  beforeEach(() => {
    mockedGetStudentCourse.mockReset()
    mockedGetStudentEnrollment.mockReset()
    mockedGetStudentEnrollment.mockRejectedValue(new Error('not enrolled'))
    mockedCheckoutCourse.mockReset()
  })

  function makeDetailCourse() {
    return makeCourse({
      accessStatus: 'OWNED',
      enrolled: true,
      activeEnrollmentId: 123,
      topics: [
        {
          id: 1,
          name: 'Topic Alpha',
          description: 'Topic description',
          orderIndex: 1,
          lessons: [
            {
              id: 10,
              title: 'Lesson One',
              description: 'Lesson description',
              content: 'Lesson content preview',
              audioUrl: null,
              audioPublicId: null,
              skillType: 'GRAMMAR',
              orderIndex: 1,
              xpReward: 10,
              questionCount: 2,
              questions: [
                {
                  id: 100,
                  type: 'MULTIPLE_CHOICE',
                  questionText: 'SECRET_QUESTION_TEXT_XYZ',
                  knowledgePoint: 'Present simple',
                  difficulty: 'EASY',
                  xpReward: 5,
                  optionCount: 4,
                },
                {
                  id: 101,
                  type: 'FILL_BLANK',
                  questionText: 'ANOTHER_SECRET_TEXT_XYZ',
                  knowledgePoint: 'Past simple',
                  difficulty: 'MEDIUM',
                  xpReward: 5,
                  optionCount: 0,
                },
              ],
            },
          ],
        },
      ],
    })
  }

  it('renders topic names as accordion triggers', async () => {
    mockedGetStudentCourse.mockResolvedValue(courseApiResponse(makeDetailCourse()))

    renderCourseDetail()

    expect(await screen.findByRole('button', { name: /Topic Alpha/i })).toBeInTheDocument()
  })

  it('does not render quiz question text in preview cards', async () => {
    mockedGetStudentCourse.mockResolvedValue(courseApiResponse(makeDetailCourse()))

    renderCourseDetail()

    await screen.findByRole('button', { name: /Topic Alpha/i })
    expect(screen.queryByText('SECRET_QUESTION_TEXT_XYZ')).not.toBeInTheDocument()
    expect(screen.queryByText('ANOTHER_SECRET_TEXT_XYZ')).not.toBeInTheDocument()
  })

  it('shows summed lesson XP badge including question rewards', async () => {
    mockedGetStudentCourse.mockResolvedValue(courseApiResponse(makeDetailCourse()))

    renderCourseDetail()

    expect(await screen.findByText('20 XP')).toBeInTheDocument()
  })
})

describe('StudentCourseDetailPage compact redesign', () => {
  beforeEach(() => {
    mockedGetStudentCourse.mockReset()
    mockedGetStudentEnrollment.mockReset()
    mockedGetStudentEnrollment.mockRejectedValue(new Error('not enrolled'))
    mockedCheckoutCourse.mockReset()
  })

  function makeCompactCourse() {
    return makeCourse({
      accessStatus: 'OWNED',
      enrolled: true,
      activeEnrollmentId: 123,
      topics: [
        {
          id: 1,
          name: 'Topic Alpha',
          description: 'Topic description',
          orderIndex: 1,
          lessons: [
            {
              id: 10,
              title: 'Lesson One',
              description: 'Lesson description',
              content: 'Lesson content preview',
              audioUrl: null,
              audioPublicId: null,
              skillType: 'GRAMMAR',
              orderIndex: 1,
              xpReward: 10,
              questionCount: 2,
              questions: [
                {
                  id: 100,
                  type: 'MULTIPLE_CHOICE',
                  questionText: 'SECRET_QUESTION_TEXT_XYZ',
                  knowledgePoint: 'Present simple',
                  difficulty: 'EASY',
                  xpReward: 5,
                  optionCount: 4,
                },
              ],
            },
          ],
        },
      ],
    })
  }

  it('shows breadcrumb and back link to course list', async () => {
    mockedGetStudentCourse.mockResolvedValue(courseApiResponse(makeCompactCourse()))

    renderCourseDetail()

    expect(await screen.findByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument()
    expect(screen.getByText('Khóa học')).toBeInTheDocument()
    const backLink = await screen.findByText(/quay lại danh sách khóa học/i)
    expect(backLink).toBeInTheDocument()
    expect(backLink.closest('button, a')).toHaveClass('cursor-pointer')
    fireEvent.click(backLink.closest('button, a') as HTMLElement)
    expect(await screen.findByText('Courses list route')).toBeInTheDocument()
  })

  it('renders slim hero stats as badges without big stat cards', async () => {
    mockedGetStudentCourse.mockResolvedValue(courseApiResponse(makeCompactCourse()))

    renderCourseDetail()

    await screen.findByRole('button', { name: /Topic Alpha/i })
    expect(screen.queryByText('Ngày xuất bản')).not.toBeInTheDocument()
    expect(screen.queryByText('Course Story')).not.toBeInTheDocument()
    expect(screen.getByText(/1 chủ đề/i)).toBeInTheDocument()
    expect(screen.getByText(/1 bài học/i)).toBeInTheDocument()
    expect(screen.getAllByText(/2 câu hỏi/i).length).toBeGreaterThanOrEqual(1)
  })

  it('shows teacher as mini profile with role instead of email card', async () => {
    mockedGetStudentCourse.mockResolvedValue(courseApiResponse(makeCompactCourse()))

    renderCourseDetail()

    expect(await screen.findByText('Giảng viên')).toBeInTheDocument()
    expect(screen.getByText('Teacher One')).toBeInTheDocument()
    expect(screen.queryByText('teacher@example.com')).not.toBeInTheDocument()
  })

  it('hides lesson detail content until row expanded', async () => {
    mockedGetStudentCourse.mockResolvedValue(courseApiResponse(makeCompactCourse()))

    renderCourseDetail()

    const lessonRow = await screen.findByRole('button', { name: /Lesson One/i })
    expect(screen.queryByText('Lesson description')).not.toBeInTheDocument()
    expect(screen.queryByText('Lesson content preview')).not.toBeInTheDocument()

    fireEvent.click(lessonRow)

    expect(await screen.findByText('Lesson description')).toBeInTheDocument()
    expect(screen.getByText('Lesson content preview')).toBeInTheDocument()
    expect(screen.queryByText('SECRET_QUESTION_TEXT_XYZ')).not.toBeInTheDocument()
    expect(screen.getByText('Present simple')).toBeInTheDocument()
  })

  it('shows lesson status and overall progress when enrolled with enrollment progress', async () => {
    mockedGetStudentCourse.mockResolvedValue(courseApiResponse(makeCompactCourse()))
    mockedGetStudentEnrollment.mockResolvedValue(enrollmentApiResponse(makeEnrollmentProgress()))

    renderCourseDetail()

    expect(await screen.findByText('Tiến độ của bạn')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(await screen.findByText('Đã hoàn thành')).toBeInTheDocument()
    await waitFor(() => expect(mockedGetStudentEnrollment).toHaveBeenCalledWith(123))
  })

  it('shows no lesson status when not enrolled', async () => {
    mockedGetStudentCourse.mockResolvedValue(courseApiResponse(makeCourse({ topics: [] })))

    renderCourseDetail()

    await screen.findByRole('heading', { name: 'Premium English' })
    expect(screen.queryByText('Tiến độ của bạn')).not.toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(mockedGetStudentEnrollment).not.toHaveBeenCalled()
  })
})
