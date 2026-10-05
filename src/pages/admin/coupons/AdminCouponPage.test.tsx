import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminCouponPage } from './AdminCouponPage'
import { createAdminCoupon, disableAdminCoupon, listAdminCoupons, updateAdminCoupon } from '../../../lib/api/adminCouponApi'
import type { AdminCoupon } from '../../../lib/api/types'
import { formatStudentLearningDate } from '../../student/learning/studentLearningUtils'
import { fromDatetimeLocalValue, toDatetimeLocalValue } from './adminCouponUtils'

vi.mock('../../../lib/api/adminCouponApi', () => ({
  listAdminCoupons: vi.fn(),
  createAdminCoupon: vi.fn(),
  updateAdminCoupon: vi.fn(),
  disableAdminCoupon: vi.fn(),
}))

const mockedListAdminCoupons = vi.mocked(listAdminCoupons)
const mockedCreateAdminCoupon = vi.mocked(createAdminCoupon)
const mockedUpdateAdminCoupon = vi.mocked(updateAdminCoupon)
const mockedDisableAdminCoupon = vi.mocked(disableAdminCoupon)

function couponsApiResponse(data: AdminCoupon[]): Awaited<ReturnType<typeof listAdminCoupons>> {
  return { data: { content: data, page: 0, size: data.length, totalElements: data.length, totalPages: 1 } } as Awaited<ReturnType<typeof listAdminCoupons>>
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

  it('renders backend page content with Vietnamese pagination labels', async () => {
    mockedListAdminCoupons.mockResolvedValue(couponsApiResponse(eightCoupons))

    render(<AdminCouponPage />)

    await screen.findByRole('table')

    expect(tableRows()).toHaveLength(8)
    expect(screen.getByText('CHAO20')).toBeInTheDocument()
    expect(screen.getByText('CHAO10')).toBeInTheDocument()
    expect(screen.getByText('CHAOCU')).toBeInTheDocument()

    expect(screen.queryByRole('link', { name: 'Trang trước' })).not.toBeInTheDocument()
    expect(screen.queryByText('Previous')).not.toBeInTheDocument()
    expect(screen.queryByText('Next')).not.toBeInTheDocument()
  })

  it('does not slice backend page content locally', async () => {
    mockedListAdminCoupons.mockResolvedValue(couponsApiResponse(eightCoupons))

    render(<AdminCouponPage />)

    await screen.findByRole('table')
    expect(tableRows()).toHaveLength(8)
    expect(screen.getByText('CHAO10')).toBeInTheDocument()
    expect(screen.getByText('CHAOCU')).toBeInTheDocument()
    expect(screen.getByText('CHAO20')).toBeInTheDocument()
  })

  it('hides pagination when every coupon fits on a single page', async () => {
    mockedListAdminCoupons.mockResolvedValue(couponsApiResponse(eightCoupons.slice(0, 4)))

    render(<AdminCouponPage />)

    await screen.findByRole('table')

    expect(tableRows()).toHaveLength(4)
    expect(screen.queryByText('Trang trước')).not.toBeInTheDocument()
    expect(screen.queryByText('Trang sau')).not.toBeInTheDocument()
  })

  it('renders teacher-style indigo table chrome', async () => {
    mockedListAdminCoupons.mockResolvedValue(couponsApiResponse(eightCoupons.slice(0, 1)))

    render(<AdminCouponPage />)

    const table = await screen.findByRole('table')
    expect(table.className).toContain('border-indigo-100/70')
    expect(document.querySelector('[data-slot="table-header"]')?.className).toContain('bg-indigo-50')
    expect(table.closest('[data-slot="table-container"]')?.parentElement?.className).toContain('border-indigo-100')
  })

  it('renders discount text, product scope badges, status badges and icon actions per row', async () => {
    mockedListAdminCoupons.mockResolvedValue(couponsApiResponse(eightCoupons))

    render(<AdminCouponPage />)

    await screen.findByRole('table')

    expect(screen.getByText('Giảm 20%')).toBeInTheDocument()
    expect(screen.getByText((_, element) => element?.textContent === 'Giảm 100.000\u00a0₫')).toBeInTheDocument()

    const vipRow = screen.getByText('VIP15').closest('tr') as HTMLElement
    expect(within(vipRow).getByText('VIP')).toBeInTheDocument()
    expect(within(vipRow).getByText('Giảm 15%')).toBeInTheDocument()
    expect(within(vipRow).getByText('Đang hoạt động')).toBeInTheDocument()
    expect(within(vipRow).getByRole('button', { name: 'Sửa mã giảm giá VIP15' })).toBeInTheDocument()
    expect(within(vipRow).getByRole('button', { name: 'Vô hiệu hóa mã giảm giá VIP15' })).toBeInTheDocument()

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
    fireEvent.click(within(vipRow).getByRole('button', { name: 'Sửa mã giảm giá VIP15' }))

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

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('AdminCouponPage disable confirmation', () => {
  beforeEach(() => {
    mockedListAdminCoupons.mockReset()
    mockedDisableAdminCoupon.mockReset()
    mockedListAdminCoupons.mockResolvedValue(couponsApiResponse(eightCoupons))
    mockedDisableAdminCoupon.mockResolvedValue({ data: makeCoupon({ id: 3, code: 'VIP15', active: false }) } as never)
  })

  it('does not offer the disable action on an already inactive coupon', async () => {
    render(<AdminCouponPage />)
    await screen.findByRole('table')

    const inactiveRow = screen.getByText('CHAO100K').closest('tr') as HTMLElement
    expect(within(inactiveRow).queryByRole('button', { name: 'Vô hiệu hóa mã giảm giá CHAO100K' })).not.toBeInTheDocument()

    const activeRow = screen.getByText('VIP15').closest('tr') as HTMLElement
    expect(within(activeRow).getByRole('button', { name: 'Vô hiệu hóa mã giảm giá VIP15' })).toBeEnabled()
  })

  it('opens a confirmation naming the coupon code and does nothing when cancelled', async () => {
    render(<AdminCouponPage />)
    await screen.findByRole('table')

    const activeRow = screen.getByText('VIP15').closest('tr') as HTMLElement
    fireEvent.click(within(activeRow).getByRole('button', { name: 'Vô hiệu hóa mã giảm giá VIP15' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByRole('heading', { name: 'Vô hiệu hóa mã giảm giá' })).toBeInTheDocument()
    expect(within(dialog).getByText('VIP15')).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Hủy' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(mockedDisableAdminCoupon).not.toHaveBeenCalled()
    expect(mockedListAdminCoupons.mock.calls.length).toBe(1)
  })

  it('disables the coupon and refreshes the list after confirming', async () => {
    render(<AdminCouponPage />)
    await screen.findByRole('table')

    const activeRow = screen.getByText('VIP15').closest('tr') as HTMLElement
    fireEvent.click(within(activeRow).getByRole('button', { name: 'Vô hiệu hóa mã giảm giá VIP15' }))

    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Vô hiệu hóa' }))

    expect(mockedDisableAdminCoupon).toHaveBeenCalledTimes(1)
    expect(mockedDisableAdminCoupon).toHaveBeenCalledWith(3)
    await waitFor(() => expect(mockedListAdminCoupons.mock.calls.length).toBeGreaterThanOrEqual(2))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })

  it('shows an error alert when disabling fails', async () => {
    mockedDisableAdminCoupon.mockRejectedValue(couponAxiosError(500, 'coupon cannot be disabled'))

    render(<AdminCouponPage />)
    await screen.findByRole('table')

    const activeRow = screen.getByText('VIP15').closest('tr') as HTMLElement
    fireEvent.click(within(activeRow).getByRole('button', { name: 'Vô hiệu hóa mã giảm giá VIP15' }))

    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Vô hiệu hóa' }))

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText('Không thể vô hiệu hóa mã giảm giá')).toBeInTheDocument()
    expect(within(alert).getByText('coupon cannot be disabled')).toBeInTheDocument()
    expect(mockedListAdminCoupons.mock.calls.length).toBe(1)
  })

  it('keeps the confirmation open and shows the loading state while the disable request is pending', async () => {
    const deferred = createDeferred<never>()
    mockedDisableAdminCoupon.mockReturnValue(deferred.promise as never)

    render(<AdminCouponPage />)
    await screen.findByRole('table')

    const activeRow = screen.getByText('VIP15').closest('tr') as HTMLElement
    fireEvent.click(within(activeRow).getByRole('button', { name: 'Vô hiệu hóa mã giảm giá VIP15' }))

    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Vô hiệu hóa' }))

    await waitFor(() => expect(mockedDisableAdminCoupon).toHaveBeenCalledWith(3))

    const stillOpen = screen.getByRole('alertdialog')
    const confirm = within(stillOpen).getByRole('button', { name: /Vô hiệu hóa/ })
    expect(confirm).toBeDisabled()
    expect(confirm.querySelector('.animate-spin')).not.toBeNull()
    expect(within(stillOpen).getByRole('button', { name: 'Hủy' })).toBeDisabled()

    deferred.reject(couponAxiosError(500, 'coupon cannot be disabled'))
    await waitFor(() => expect(within(screen.getByRole('alertdialog')).getByRole('alert')).toBeInTheDocument())
  })

  it('keeps the confirmation open and renders the failure inside the dialog', async () => {
    const deferred = createDeferred<never>()
    mockedDisableAdminCoupon.mockReturnValue(deferred.promise as never)

    render(<AdminCouponPage />)
    await screen.findByRole('table')

    const activeRow = screen.getByText('VIP15').closest('tr') as HTMLElement
    fireEvent.click(within(activeRow).getByRole('button', { name: 'Vô hiệu hóa mã giảm giá VIP15' }))

    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Vô hiệu hóa' }))
    await waitFor(() => expect(mockedDisableAdminCoupon).toHaveBeenCalledWith(3))

    deferred.reject(couponAxiosError(500, 'coupon cannot be disabled'))

    const stillOpen = await screen.findByRole('alertdialog')
    const alert = await within(stillOpen).findByRole('alert')
    expect(within(alert).getByText('Không thể vô hiệu hóa mã giảm giá')).toBeInTheDocument()
    expect(within(alert).getByText('coupon cannot be disabled')).toBeInTheDocument()
    expect(mockedListAdminCoupons.mock.calls.length).toBe(1)
    expect(within(stillOpen).getByRole('button', { name: /Vô hiệu hóa/ })).toBeEnabled()
  })
})