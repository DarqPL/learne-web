import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StudentCourseDetailPage } from './StudentCourseDetailPage'
import { getStudentCourse } from '../../../lib/api/studentLearningApi'
import { checkoutCourse } from '../../../lib/api/studentMonetizationApi'
import type { OrderResponse, StudentCourseDetail } from '../../../lib/api/types'

vi.mock('../../../lib/api/studentLearningApi', () => ({
  enrollStudentCourse: vi.fn(),
  getStudentCourse: vi.fn(),
}))

vi.mock('../../../lib/api/studentMonetizationApi', () => ({
  checkoutCourse: vi.fn(),
}))

const mockedGetStudentCourse = vi.mocked(getStudentCourse)
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
        <Route path="/student/payment/orders/:orderId" element={<div>Payment order route</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('StudentCourseDetailPage checkout', () => {
  beforeEach(() => {
    mockedGetStudentCourse.mockReset()
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
})
