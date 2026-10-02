import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminCouponPage } from './AdminCouponPage'
import { createAdminCoupon, listAdminCoupons, updateAdminCoupon } from '../../../lib/api/adminCouponApi'
import type { AdminCoupon } from '../../../lib/api/types'
import { formatStudentLearningDate } from '../../student/learning/studentLearningUtils'
import { fromDatetimeLocalValue, toDatetimeLocalValue } from './adminCouponUtils'

vi.mock('../../../lib/api/adminCouponApi', () => ({
  listAdminCoupons: vi.fn(),
  createAdminCoupon: vi.fn(),
  updateAdminCoupon: vi.fn(),
}))

const mockedListAdminCoupons = vi.mocked(listAdminCoupons)
const mockedCreateAdminCoupon = vi.mocked(createAdminCoupon)
const mockedUpdateAdminCoupon = vi.mocked(updateAdminCoupon)

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

function couponAxiosError(status: number, message: string) {
  return { isAxiosError: true, response: { status, data: { message } } }
}

async function openCreateDialog() {
  fireEvent.click(await screen.findByRole('button', { name: /Tạo mã giảm giá/i }))
  const dialog = await screen.findByRole('dialog')
  return { dialog, form: within(dialog) as ReturnType<typeof within> }
}

interface CouponFormValues {
  code?: string
  discountType?: 'PERCENT' | 'FIXED_AMOUNT'
  discountValue?: string
  validFrom?: string
  validUntil?: string
}

function fillCouponForm(form: ReturnType<typeof within>, values: CouponFormValues) {
  if (values.code !== undefined) {
    fireEvent.change(form.getByLabelText('Mã giảm giá'), { target: { value: values.code } })
  }
  if (values.discountType !== undefined) {
    fireEvent.click(form.getByRole('radio', { name: values.discountType === 'PERCENT' ? 'Theo %' : 'Số tiền' }))
  }
  if (values.discountValue !== undefined) {
    fireEvent.change(form.getByLabelText('Mức giảm'), { target: { value: values.discountValue } })
  }
  if (values.validFrom !== undefined) {
    fireEvent.change(form.getByLabelText('Bắt đầu'), { target: { value: values.validFrom } })
  }
  if (values.validUntil !== undefined) {
    fireEvent.change(form.getByLabelText('Kết thúc'), { target: { value: values.validUntil } })
  }
}

describe('AdminCouponPage create dialog', () => {
  beforeEach(() => {
    mockedListAdminCoupons.mockReset()
    mockedCreateAdminCoupon.mockReset()
    mockedUpdateAdminCoupon.mockReset()
    mockedListAdminCoupons.mockResolvedValue(couponsApiResponse(eightCoupons))
    mockedCreateAdminCoupon.mockResolvedValue({ data: makeCoupon({ id: 9, code: 'SALE20' }) } as never)
  })

  it('creates a coupon with a trimmed uppercase code, ISO dates and the chosen scopes', async () => {
    render(<AdminCouponPage />)
    await screen.findByRole('table')

    const { dialog, form } = await openCreateDialog()
    expect(within(dialog).getByRole('heading', { name: 'Tạo mã giảm giá' })).toBeInTheDocument()

    fillCouponForm(form, { code: ' sale20 ', discountType: 'PERCENT', discountValue: '20' })
    fireEvent.click(form.getByRole('checkbox', { name: 'VIP' }))
    fillCouponForm(form, { validFrom: '2026-03-01T08:00', validUntil: '2026-04-01T23:59' })
    fireEvent.click(form.getByRole('button', { name: 'Tạo mã giảm giá' }))

    expect(mockedCreateAdminCoupon).toHaveBeenCalledTimes(1)
    expect(mockedCreateAdminCoupon).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'SALE20',
        discountType: 'PERCENT',
        discountValue: 20,
        productScopes: ['VIP'],
        validFrom: fromDatetimeLocalValue('2026-03-01T08:00'),
        validUntil: fromDatetimeLocalValue('2026-04-01T23:59'),
        active: true,
      }),
    )
    await waitFor(() => expect(mockedListAdminCoupons.mock.calls.length).toBeGreaterThanOrEqual(2))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('blocks submit when no product scope is selected', async () => {
    render(<AdminCouponPage />)
    await screen.findByRole('table')

    const { form } = await openCreateDialog()
    fillCouponForm(form, { code: 'SALE20', discountType: 'PERCENT', discountValue: '20' })
    fillCouponForm(form, { validFrom: '2026-03-01T08:00', validUntil: '2026-04-01T23:59' })
    fireEvent.click(form.getByRole('button', { name: 'Tạo mã giảm giá' }))

    expect(form.getByText('Chọn ít nhất một phạm vi áp dụng.')).toBeInTheDocument()
    expect(mockedCreateAdminCoupon).not.toHaveBeenCalled()
  })

  it('blocks submit when the end date is not after the start date', async () => {
    render(<AdminCouponPage />)
    await screen.findByRole('table')

    const { form } = await openCreateDialog()
    fillCouponForm(form, { code: 'SALE20', discountType: 'PERCENT', discountValue: '20' })
    fireEvent.click(form.getByRole('checkbox', { name: 'VIP' }))
    fillCouponForm(form, { validFrom: '2026-03-01T08:00', validUntil: '2026-03-01T08:00' })
    fireEvent.click(form.getByRole('button', { name: 'Tạo mã giảm giá' }))

    expect(form.getByText('Ngày hết hạn phải sau ngày bắt đầu.')).toBeInTheDocument()
    expect(mockedCreateAdminCoupon).not.toHaveBeenCalled()
  })

  it('shows a friendly message when the code already exists', async () => {
    mockedCreateAdminCoupon.mockRejectedValue(couponAxiosError(409, 'coupon code already exists'))

    render(<AdminCouponPage />)
    await screen.findByRole('table')

    const { dialog, form } = await openCreateDialog()
    fillCouponForm(form, { code: 'SALE20', discountType: 'PERCENT', discountValue: '20' })
    fireEvent.click(form.getByRole('checkbox', { name: 'VIP' }))
    fillCouponForm(form, { validFrom: '2026-03-01T08:00', validUntil: '2026-04-01T23:59' })
    fireEvent.click(form.getByRole('button', { name: 'Tạo mã giảm giá' }))

    expect(await within(dialog).findByText('Mã giảm giá đã tồn tại.')).toBeInTheDocument()
    expect(mockedListAdminCoupons.mock.calls.length).toBe(1)
  })
})

describe('AdminCouponPage edit dialog', () => {
  beforeEach(() => {
    mockedListAdminCoupons.mockReset()
    mockedCreateAdminCoupon.mockReset()
    mockedUpdateAdminCoupon.mockReset()
    mockedListAdminCoupons.mockResolvedValue(couponsApiResponse(eightCoupons))
    mockedUpdateAdminCoupon.mockResolvedValue({ data: eightCoupons[2] } as never)
  })

  it('prefills the form from the selected coupon and patches only the changed fields', async () => {
    render(<AdminCouponPage />)
    await screen.findByRole('table')

    const vipRow = screen.getByText('VIP15').closest('tr') as HTMLElement
    fireEvent.click(within(vipRow).getByRole('button', { name: 'Sửa' }))

    const dialog = await screen.findByRole('dialog')
    const form = within(dialog)

    expect(form.getByLabelText('Mã giảm giá')).toHaveValue('VIP15')
    expect(form.getByRole('radio', { name: 'Theo %' })).toHaveAttribute('aria-checked', 'true')
    expect(form.getByLabelText('Mức giảm')).toHaveValue('15')
    expect(form.getByRole('checkbox', { name: 'VIP' })).toHaveAttribute('data-state', 'checked')
    expect(form.getByLabelText('Bắt đầu')).toHaveValue(toDatetimeLocalValue(eightCoupons[2].validFrom))
    expect(form.getByLabelText('Kết thúc')).toHaveValue(toDatetimeLocalValue(eightCoupons[2].validUntil))

    fireEvent.change(form.getByLabelText('Mức giảm'), { target: { value: '30' } })
    fireEvent.click(form.getByRole('button', { name: 'Lưu thay đổi' }))

    expect(mockedUpdateAdminCoupon).toHaveBeenCalledTimes(1)
    expect(mockedUpdateAdminCoupon).toHaveBeenCalledWith(3, { discountValue: 30 })
    await waitFor(() => expect(mockedListAdminCoupons.mock.calls.length).toBeGreaterThanOrEqual(2))
  })
})