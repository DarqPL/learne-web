import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminCouponPage } from './AdminCouponPage'
import { listAdminCoupons } from '../../../lib/api/adminCouponApi'
import type { AdminCoupon } from '../../../lib/api/types'
import { formatStudentLearningDate } from '../../student/learning/studentLearningUtils'

vi.mock('../../../lib/api/adminCouponApi', () => ({
  listAdminCoupons: vi.fn(),
}))

const mockedListAdminCoupons = vi.mocked(listAdminCoupons)

function couponsApiResponse(data: AdminCoupon[]): Awaited<ReturnType<typeof listAdminCoupons>> {
  return { data } as Awaited<ReturnType<typeof listAdminCoupons>>
}

function makeCoupon(overrides: Partial<AdminCoupon> = {}): AdminCoupon {
  return {
    id: 1,
    code: 'CHAO30',
    discountType: 'PERCENT',
    discountValue: 20,
    minOrderAmountVnd: 0,
    maxDiscountAmountVnd: null,
    minimumFinalAmountVnd: 0,
    usageLimitTotal: null,
    usageLimitPerUser: null,
    validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: '2026-12-31T23:59:00.000Z',
    active: true,
    productScopes: ['COURSE_PURCHASE'],
    courseIds: [],
    teacherIds: [],
    ...overrides,
  }
}

const eightCoupons: AdminCoupon[] = [
  makeCoupon({ id: 1, code: 'CHAO20', discountType: 'PERCENT', discountValue: 20, active: true }),
  makeCoupon({ id: 2, code: 'CHAO100K', discountType: 'FIXED_AMOUNT', discountValue: 100000, active: false }),
  makeCoupon({ id: 3, code: 'VIP15', discountType: 'PERCENT', discountValue: 15, productScopes: ['VIP'], active: true }),
  makeCoupon({ id: 4, code: 'PRO25', discountType: 'PERCENT', discountValue: 25, productScopes: ['PRO'], active: false }),
  makeCoupon({ id: 5, code: 'PROPLUS30', discountType: 'PERCENT', discountValue: 30, productScopes: ['PRO_PLUS'], active: true }),
  makeCoupon({ id: 6, code: 'KHOAHOC50K', discountType: 'FIXED_AMOUNT', discountValue: 50000, active: true }),
  makeCoupon({ id: 7, code: 'CHAO10', discountType: 'PERCENT', discountValue: 10, active: true }),
  makeCoupon({ id: 8, code: 'CHAOCU', discountType: 'FIXED_AMOUNT', discountValue: 200000, active: false }),
]

function tableRows() {
  const body = document.querySelector('[data-slot="table-body"]')
  if (!body) return []
  return within(body as HTMLElement).queryAllByRole('row')
}

describe('AdminCouponPage list', () => {
  beforeEach(() => {
    mockedListAdminCoupons.mockReset()
  })

  it('renders the page heading and the create button', async () => {
    mockedListAdminCoupons.mockResolvedValue(couponsApiResponse(eightCoupons))

    render(<AdminCouponPage />)

    expect(await screen.findByRole('heading', { name: 'Mã giảm giá' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tạo mã giảm giá/i })).toBeInTheDocument()
  })

  it('shows a loading skeleton while the list request is pending', () => {
    mockedListAdminCoupons.mockReturnValue(new Promise(() => {}))

    render(<AdminCouponPage />)

    expect(document.querySelector('[data-slot="skeleton"]')).not.toBeNull()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('shows an error alert when the list request fails', async () => {
    mockedListAdminCoupons.mockRejectedValue(new Error('Mạng chết rồi'))

    render(<AdminCouponPage />)

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText('Không thể tải danh sách mã giảm giá.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('shows the empty state when there are no coupons', async () => {
    mockedListAdminCoupons.mockResolvedValue(couponsApiResponse([]))

    render(<AdminCouponPage />)

    expect(await screen.findByText('Chưa có mã giảm giá nào.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByText('Trang sau')).not.toBeInTheDocument()
  })

  it('renders six rows per page with Vietnamese pagination labels', async () => {
    mockedListAdminCoupons.mockResolvedValue(couponsApiResponse(eightCoupons))

    render(<AdminCouponPage />)

    await screen.findByRole('table')

    expect(tableRows()).toHaveLength(6)
    expect(screen.getByText('CHAO20')).toBeInTheDocument()
    expect(screen.queryByText('CHAO10')).not.toBeInTheDocument()
    expect(screen.queryByText('CHAOCU')).not.toBeInTheDocument()

    const prevLink = screen.getByRole('link', { name: 'Trang trước' })
    const nextLink = screen.getByRole('link', { name: 'Trang sau' })
    expect(prevLink).toHaveAttribute('aria-disabled', 'true')
    expect(prevLink).toHaveClass('aria-disabled:opacity-50')
    expect(nextLink).toHaveAttribute('aria-disabled', 'false')
    expect(screen.queryByText('Previous')).not.toBeInTheDocument()
    expect(screen.queryByText('Next')).not.toBeInTheDocument()
  })

  it('moves to the second page showing the remaining rows', async () => {
    mockedListAdminCoupons.mockResolvedValue(couponsApiResponse(eightCoupons))

    render(<AdminCouponPage />)

    await screen.findByRole('table')
    fireEvent.click(screen.getByRole('link', { name: '2' }))

    expect(tableRows()).toHaveLength(2)
    expect(screen.getByText('CHAO10')).toBeInTheDocument()
    expect(screen.getByText('CHAOCU')).toBeInTheDocument()
    expect(screen.queryByText('CHAO20')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Trang trước' })).toHaveAttribute('aria-disabled', 'false')
    expect(screen.getByRole('link', { name: 'Trang sau' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('hides pagination when every coupon fits on a single page', async () => {
    mockedListAdminCoupons.mockResolvedValue(couponsApiResponse(eightCoupons.slice(0, 4)))

    render(<AdminCouponPage />)

    await screen.findByRole('table')

    expect(tableRows()).toHaveLength(4)
    expect(screen.queryByText('Trang trước')).not.toBeInTheDocument()
    expect(screen.queryByText('Trang sau')).not.toBeInTheDocument()
  })

  it('renders discount text, product scope badges, status badges and actions per row', async () => {
    mockedListAdminCoupons.mockResolvedValue(couponsApiResponse(eightCoupons))

    render(<AdminCouponPage />)

    await screen.findByRole('table')

    expect(screen.getByText('Giảm 20%')).toBeInTheDocument()
    expect(screen.getByText((_, element) => element?.textContent === 'Giảm 100.000\u00a0₫')).toBeInTheDocument()

    const vipRow = screen.getByText('VIP15').closest('tr') as HTMLElement
    expect(within(vipRow).getByText('VIP')).toBeInTheDocument()
    expect(within(vipRow).getByText('Giảm 15%')).toBeInTheDocument()
    expect(within(vipRow).getByText('Đang hoạt động')).toBeInTheDocument()
    expect(within(vipRow).getByRole('button', { name: 'Sửa' })).toBeInTheDocument()
    expect(within(vipRow).getByRole('button', { name: 'Vô hiệu hóa' })).toBeInTheDocument()

    const inactiveRow = screen.getByText('CHAO100K').closest('tr') as HTMLElement
    expect(within(inactiveRow).getByText('Đã vô hiệu hóa')).toBeInTheDocument()
  })

  it('renders the validity window using the shared date formatter', async () => {
    mockedListAdminCoupons.mockResolvedValue(couponsApiResponse(eightCoupons.slice(0, 1)))

    render(<AdminCouponPage />)

    const row = await screen.findByRole('table')
    expect(within(row).getByText(formatStudentLearningDate('2026-01-01T00:00:00.000Z'))).toBeInTheDocument()
    expect(within(row).getByText(formatStudentLearningDate('2026-12-31T23:59:00.000Z'))).toBeInTheDocument()
  })
})