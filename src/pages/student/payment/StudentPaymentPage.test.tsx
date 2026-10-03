import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StudentPaymentPage } from './StudentPaymentPage'
import { getStudentOrder } from '../../../lib/api/studentMonetizationApi'
import type { OrderResponse } from '../../../lib/api/types'

vi.mock('../../../lib/api/studentMonetizationApi', () => ({
  getStudentOrder: vi.fn(),
}))

const mockedGetStudentOrder = vi.mocked(getStudentOrder)

function apiOrder(data: OrderResponse): Awaited<ReturnType<typeof getStudentOrder>> {
  return { data } as Awaited<ReturnType<typeof getStudentOrder>>
}

function makeOrder(overrides: Partial<OrderResponse> = {}): OrderResponse {
  return {
    id: 42,
    orderType: 'COURSE_PURCHASE',
    status: 'PENDING_PAYMENT',
    originalAmountVnd: 250000,
    discountAmountVnd: 0,
    finalAmountVnd: 250000,
    couponId: null,
    paymentProvider: 'SEPAY',
    paymentReference: 'LEPAYMENT42',
    paidAt: null,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    items: [
      {
        id: 7,
        productType: 'COURSE',
        courseId: 99,
        planCode: null,
        itemNameSnapshot: 'Premium English',
        unitAmountVnd: 250000,
        quantity: 1,
        totalAmountVnd: 250000,
      },
    ],
    paymentInstructions: {
      bankCode: 'VCB',
      bankName: 'Vietcombank',
      accountNumber: '0010000000355',
      accountName: 'CONG TY LEARNE',
      amountVnd: 250000,
      paymentReference: 'LEPAYMENT42',
      qrUrl: 'https://vietqr.app/img?acc=0010000000355&bank=VCB&amount=250000&des=LEPAYMENT42',
    },
    ...overrides,
  }
}

function renderPaymentPage(orderId = 42) {
  return render(
    <MemoryRouter initialEntries={[`/student/payment/orders/${orderId}`]}>
      <Routes>
        <Route path="/student/payment/orders/:orderId" element={<StudentPaymentPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function deferredOrder() {
  let resolve!: (value: Awaited<ReturnType<typeof getStudentOrder>>) => void
  const promise = new Promise<Awaited<ReturnType<typeof getStudentOrder>>>((promiseResolve) => {
    resolve = promiseResolve
  })
  return { promise, resolve }
}

describe('StudentPaymentPage', () => {
  beforeEach(() => {
    mockedGetStudentOrder.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows SEPAY QR and transfer fields for a pending order', async () => {
    mockedGetStudentOrder.mockResolvedValue(apiOrder(makeOrder()))

    renderPaymentPage()

    expect(await screen.findByAltText('Mã QR thanh toán SEPAY')).toHaveAttribute('src', expect.stringContaining('vietqr.app'))
    expect(screen.getByText('Vietcombank')).toBeInTheDocument()
    expect(screen.getByText('CONG TY LEARNE')).toBeInTheDocument()
    expect(screen.getByText('0010000000355')).toBeInTheDocument()
    expect(screen.getByText('LEPAYMENT42')).toBeInTheDocument()
    expect(screen.getAllByText('250.000 ₫').length).toBeGreaterThan(0)
  })

  it('polls a pending order and shows paid success when status changes', async () => {
    mockedGetStudentOrder
      .mockResolvedValueOnce(apiOrder(makeOrder()))
      .mockResolvedValueOnce(apiOrder(makeOrder({ status: 'PAID', paidAt: new Date().toISOString(), paymentInstructions: null })))

    renderPaymentPage()

    expect(await screen.findByText('Chờ chuyển khoản')).toBeInTheDocument()

    await waitFor(() => expect(screen.getByText('Thanh toán thành công')).toBeInTheDocument(), { timeout: 4500 })
    expect(mockedGetStudentOrder).toHaveBeenCalledTimes(2)
  })

  it('refreshes manually when the user clicks the status check button', async () => {
    mockedGetStudentOrder
      .mockResolvedValueOnce(apiOrder(makeOrder()))
      .mockResolvedValueOnce(apiOrder(makeOrder({ status: 'PAID', paidAt: new Date().toISOString(), paymentInstructions: null })))

    renderPaymentPage()

    expect(await screen.findByText('Chờ chuyển khoản')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra lại' }))

    expect(await screen.findByText('Thanh toán thành công')).toBeInTheDocument()
    expect(mockedGetStudentOrder).toHaveBeenCalledTimes(2)
  })

  it('shows an expired terminal state without payment instructions', async () => {
    mockedGetStudentOrder.mockResolvedValue(
      apiOrder(makeOrder({ status: 'EXPIRED', paymentInstructions: null, expiresAt: new Date(Date.now() - 1000).toISOString() })),
    )

    renderPaymentPage()

    expect(await screen.findByText('Đơn thanh toán không còn hiệu lực')).toBeInTheDocument()
    expect(screen.queryByAltText('Mã QR thanh toán SEPAY')).not.toBeInTheDocument()
  })

  it('does a final status refresh before rendering local expiry', async () => {
    const finalRefresh = deferredOrder()
    mockedGetStudentOrder
      .mockResolvedValueOnce(apiOrder(makeOrder({ expiresAt: new Date(Date.now() + 100).toISOString() })))
      .mockReturnValueOnce(finalRefresh.promise)

    renderPaymentPage()

    expect(await screen.findByText('Chờ chuyển khoản')).toBeInTheDocument()
    await waitFor(() => expect(mockedGetStudentOrder).toHaveBeenCalledTimes(2), { timeout: 2500 })
    expect(screen.queryByText('Đơn thanh toán không còn hiệu lực')).not.toBeInTheDocument()
    expect(screen.getByAltText('Mã QR thanh toán SEPAY')).toBeInTheDocument()

    finalRefresh.resolve(apiOrder(makeOrder({ status: 'EXPIRED', paymentInstructions: null, expiresAt: new Date(Date.now() - 1000).toISOString() })))

    expect(await screen.findByText('Đơn thanh toán không còn hiệu lực')).toBeInTheDocument()
    expect(mockedGetStudentOrder).toHaveBeenCalledTimes(2)
  })

  it('shows the order amount breakdown with discount', async () => {
    mockedGetStudentOrder.mockResolvedValue(
      apiOrder(makeOrder({ originalAmountVnd: 500000, discountAmountVnd: 100000, finalAmountVnd: 400000 })),
    )

    renderPaymentPage()

    expect(await screen.findByText(/giá gốc/i)).toBeInTheDocument()
    expect(screen.getAllByText(/giảm giá/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/cần chuyển khoản/i)).toBeInTheDocument()
  })

  it("navigates plan orders to the subscription page on 'Tiếp tục'", async () => {
    const planOrder = makeOrder({
      status: 'PAID',
      paidAt: new Date().toISOString(),
      paymentInstructions: null,
      items: [
        {
          id: 8,
          productType: 'PLAN',
          courseId: null,
          planCode: 'PRO',
          itemNameSnapshot: 'Gói Pro tháng',
          unitAmountVnd: 400000,
          quantity: 1,
          totalAmountVnd: 400000,
        },
      ],
    })
    mockedGetStudentOrder.mockResolvedValue(apiOrder(planOrder))

    render(
      <MemoryRouter initialEntries={['/student/payment/orders/42']}>
        <Routes>
          <Route path="/student/payment/orders/:orderId" element={<StudentPaymentPage />} />
          <Route path="/student/subscription" element={<p>Subscription page</p>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Thanh toán thành công')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }))

    expect(await screen.findByText('Subscription page')).toBeInTheDocument()
  })
})
