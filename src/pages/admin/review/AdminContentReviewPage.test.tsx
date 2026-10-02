import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminContentReviewPage } from './AdminContentReviewPage'
import {
  approveReviewCourse,
  getReviewCourse,
  listPendingReviewCourses,
  rejectReviewCourse,
} from '../../../lib/api/adminReviewApi'
import type { AdminReviewCourseDetail, AdminReviewCourseSummary } from '../../../lib/api/types'

vi.mock('../../../lib/api/adminReviewApi', () => ({
  listPendingReviewCourses: vi.fn(),
  getReviewCourse: vi.fn(),
  approveReviewCourse: vi.fn(),
  rejectReviewCourse: vi.fn(),
}))

const mockedList = vi.mocked(listPendingReviewCourses)
const mockedDetail = vi.mocked(getReviewCourse)
const mockedApprove = vi.mocked(approveReviewCourse)
const mockedReject = vi.mocked(rejectReviewCourse)

function makeSummary(overrides: Partial<AdminReviewCourseSummary> = {}): AdminReviewCourseSummary {
  return {
    id: 1,
    name: 'Khoa hoc A1 co ban',
    description: null,
    type: 'COMPREHENSIVE',
    level: 'A1',
    status: 'PENDING_REVIEW',
    teacherId: 10,
    teacherName: 'Nguyen Van A',
    teacherEmail: 'a@example.com',
    topicCount: 2,
    lessonCount: 3,
    questionCount: 5,
    updatedAt: '2026-01-01T00:00:00Z',
    revisionId: null,
    revisionNumber: 1,
    pricingType: 'FREE',
    priceAmountVnd: null,
    proposedPriceAmountVnd: null,
    priceStatus: 'NONE',
    ...overrides,
  }
}

function makeDetail(overrides: Partial<AdminReviewCourseDetail> = {}): AdminReviewCourseDetail {
  return {
    id: 1,
    name: 'Khoa hoc A1 co ban',
    description: 'Mo ta khoa hoc',
    type: 'COMPREHENSIVE',
    level: 'A2',
    orderIndex: 0,
    status: 'PENDING_REVIEW',
    rejectionReason: null,
    teacherId: 10,
    teacherName: 'Nguyen Van A',
    teacherEmail: 'a@example.com',
    reviewedByAdminId: null,
    reviewedAt: null,
    publishedAt: null,
    updatedAt: '2026-01-01T00:00:00Z',
    revisionId: null,
    revisionNumber: 1,
    pricingType: 'PAID',
    priceAmountVnd: 100000,
    proposedPriceAmountVnd: 199000,
    priceStatus: 'PENDING_REVIEW',
    topics: [],
    ...overrides,
  }
}

function apiList(data: AdminReviewCourseSummary[]) {
  return { data } as Awaited<ReturnType<typeof listPendingReviewCourses>>
}

function apiDetail(data: AdminReviewCourseDetail) {
  return { data } as Awaited<ReturnType<typeof getReviewCourse>>
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminContentReviewPage />
    </MemoryRouter>,
  )
}

describe('AdminContentReviewPage shadcn sync', () => {
  beforeEach(() => {
    mockedList.mockReset()
    mockedDetail.mockReset()
    mockedApprove.mockReset()
    mockedReject.mockReset()
    mockedApprove.mockResolvedValue(apiDetail(makeDetail()) as never)
    mockedReject.mockResolvedValue(apiDetail(makeDetail()) as never)
  })

  it('shows shadcn skeletons while loading the pending list', () => {
    mockedList.mockReturnValue(new Promise(() => {}) as never)

    renderPage()

    expect(document.querySelector('[data-slot="skeleton"]')).not.toBeNull()
  })

  it('shows a shadcn error alert when the pending list request fails', async () => {
    mockedList.mockRejectedValue(new Error('boom'))

    renderPage()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveAttribute('data-slot', 'alert')
    expect(within(alert).getByText('Không thể tải khóa học chờ duyệt.')).toBeInTheDocument()
  })

  it('renders a breadcrumb for the review page', async () => {
    mockedList.mockResolvedValue(apiList([]))

    renderPage()

    await waitFor(() => expect(mockedList).toHaveBeenCalled())
    expect(await screen.findByText('Không có khóa học nào đang chờ duyệt.')).toBeInTheDocument()
    const nav = document.querySelector('nav[aria-label="breadcrumb"]')
    expect(nav).not.toBeNull()
    expect(within(nav as HTMLElement).getByText('Kiểm duyệt nội dung')).toBeInTheDocument()
  })

  it('renders pending courses with sticky header and badges, and loads detail on click', async () => {
    const first = makeSummary({ id: 1, name: 'Khoa hoc mot', pricingType: 'FREE' })
    const second = makeSummary({
      id: 2,
      name: 'Khoa hoc hai',
      pricingType: 'PAID',
      proposedPriceAmountVnd: 199000,
    })
    mockedList.mockResolvedValue(apiList([first, second]))
    mockedDetail.mockResolvedValue(apiDetail(makeDetail({ id: 1, name: 'Khoa hoc mot' })))

    renderPage()

    expect(await screen.findByRole('button', { name: /Khoa hoc mot/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Khoa hoc hai/ })).toBeInTheDocument()

    // sticky header for the pending list
    expect(document.querySelector('.sticky')).not.toBeNull()
    expect(screen.getByText('Khóa học chờ duyệt')).toBeInTheDocument()

    // badges for pricing
    expect(document.querySelector('[data-slot="badge"]')).not.toBeNull()
    expect(screen.getByText('Miễn phí')).toBeInTheDocument()
    expect(screen.getAllByText('Trả phí').length).toBeGreaterThanOrEqual(1)

    // click second course loads its detail
    mockedDetail.mockResolvedValue(apiDetail(makeDetail({ id: 2, name: 'Khoa hoc hai' })))
    fireEvent.click(screen.getByRole('button', { name: /Khoa hoc hai/ }))

    await waitFor(() => expect(mockedDetail).toHaveBeenCalledWith(2))
    expect(await screen.findByRole('heading', { name: 'Khoa hoc hai' })).toBeInTheDocument()
  })

  it('keeps the pricing block visible in the detail view', async () => {
    mockedList.mockResolvedValue(apiList([makeSummary()]))
    mockedDetail.mockResolvedValue(
      apiDetail(
        makeDetail({
          pricingType: 'PAID',
          priceAmountVnd: 100000,
          proposedPriceAmountVnd: 199000,
        }),
      ),
    )

    renderPage()

    expect(await screen.findByText('Thông tin giá')).toBeInTheDocument()
    expect(screen.getByText('Giá hiện tại')).toBeInTheDocument()
    expect(screen.getByText('Giá đề xuất')).toBeInTheDocument()
    expect(screen.getByText('Trạng thái giá')).toBeInTheDocument()
  })

  it('opens an AlertDialog naming the course for approve and confirms via approve API without window.confirm', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm')
    mockedList.mockResolvedValue(apiList([makeSummary({ id: 1, name: 'Khoa hoc A1 co ban' })]))
    mockedDetail.mockResolvedValue(apiDetail(makeDetail({ id: 1, name: 'Khoa hoc A1 co ban' })))

    renderPage()

    await screen.findByRole('heading', { name: 'Khoa hoc A1 co ban' })
    fireEvent.click(screen.getByRole('button', { name: 'Duyệt khóa học' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText('Khoa hoc A1 co ban')).toBeInTheDocument()
    expect(confirmSpy).not.toHaveBeenCalled()

    fireEvent.click(within(dialog).getByRole('button', { name: /^Duyệt$/ }))

    expect(mockedApprove).toHaveBeenCalledTimes(1)
    expect(mockedApprove).toHaveBeenCalledWith(1)
    await waitFor(() => expect(mockedList.mock.calls.length).toBeGreaterThanOrEqual(2))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    confirmSpy.mockRestore()
  })

  it('keeps the approve dialog open with loading state and shows the error inside the dialog on failure', async () => {
    let reject!: (reason?: unknown) => void
    const pending = new Promise<never>((_, rej) => {
      reject = rej
    })
    mockedList.mockResolvedValue(apiList([makeSummary({ id: 1, name: 'Khoa hoc A1 co ban' })]))
    mockedDetail.mockResolvedValue(apiDetail(makeDetail({ id: 1, name: 'Khoa hoc A1 co ban' })))
    mockedApprove.mockReturnValue(pending as never)

    renderPage()

    await screen.findByRole('heading', { name: 'Khoa hoc A1 co ban' })
    fireEvent.click(screen.getByRole('button', { name: 'Duyệt khóa học' }))

    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /^Duyệt$/ }))

    await waitFor(() => expect(mockedApprove).toHaveBeenCalledWith(1))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()

    reject({ isAxiosError: true, response: { data: { message: 'duyet that bai' } } })
    const alert = await within(screen.getByRole('alertdialog')).findByRole('alert')
    expect(within(alert).getByText('duyet that bai')).toBeInTheDocument()
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  it('keeps the reject form working with validation and calls reject API', async () => {
    mockedList.mockResolvedValue(apiList([makeSummary({ id: 1, name: 'Khoa hoc A1 co ban' })]))
    mockedDetail.mockResolvedValue(apiDetail(makeDetail({ id: 1, name: 'Khoa hoc A1 co ban' })))

    renderPage()

    await screen.findByRole('heading', { name: 'Khoa hoc A1 co ban' })

    const reasonInput = screen.getByLabelText(/Lý do từ chối/)
    expect(reasonInput).toBeInTheDocument()

    // empty reason shows validation and does not call API
    fireEvent.click(screen.getByRole('button', { name: 'Từ chối khóa học' }))
    expect(await screen.findByText('Vui lòng nhập lý do từ chối.')).toBeInTheDocument()
    expect(mockedReject).not.toHaveBeenCalled()

    fireEvent.change(reasonInput, { target: { value: 'Noi dung chua dat' } })
    fireEvent.click(screen.getByRole('button', { name: 'Từ chối khóa học' }))

    await waitFor(() => expect(mockedReject).toHaveBeenCalledWith(1, { reason: 'Noi dung chua dat' }))
    await waitFor(() => expect(mockedList.mock.calls.length).toBeGreaterThanOrEqual(2))
  })
})
