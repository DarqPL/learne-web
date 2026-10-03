import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StudentSubscriptionPlansPage } from './StudentSubscriptionPlansPage'
import { checkoutPlan, getStudentSubscription } from '../../../lib/api/studentMonetizationApi'
import type { OrderResponse, SubscriptionSummaryResponse } from '../../../lib/api/types'

vi.mock('../../../lib/api/studentMonetizationApi', () => ({
  checkoutPlan: vi.fn(),
  getStudentSubscription: vi.fn(),
}))

const mockedCheckoutPlan = vi.mocked(checkoutPlan)
const mockedGetStudentSubscription = vi.mocked(getStudentSubscription)

function checkoutApiResponse(data: OrderResponse): Awaited<ReturnType<typeof checkoutPlan>> {
  return { data } as Awaited<ReturnType<typeof checkoutPlan>>
}

function makeOrder(overrides: Partial<OrderResponse> = {}): OrderResponse {
  return {
    id: 77,
    orderType: 'PLAN_SUBSCRIPTION',
    status: 'PENDING_PAYMENT',
    originalAmountVnd: 500000,
    discountAmountVnd: 0,
    finalAmountVnd: 500000,
    couponId: null,
    paymentProvider: 'SEPAY',
    paymentReference: 'LEPLAN77',
    paidAt: null,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    items: [],
    paymentInstructions: null,
    ...overrides,
  }
}

function subscriptionApiResponse(data: SubscriptionSummaryResponse): Awaited<ReturnType<typeof getStudentSubscription>> {
  return { data } as Awaited<ReturnType<typeof getStudentSubscription>>
}

function makeSubscription(overrides: Partial<SubscriptionSummaryResponse> = {}): SubscriptionSummaryResponse {
  return {
    planCode: null,
    aiDailyLimit: 50,
    aiUsedToday: 0,
    startsAt: null,
    endsAt: null,
    ...overrides,
  }
}

function renderPlansPage() {
  return render(
    <MemoryRouter initialEntries={['/student/subscription']}>
      <Routes>
        <Route path="/student/subscription" element={<StudentSubscriptionPlansPage />} />
        <Route path="/student/payment/orders/:orderId" element={<div>Payment order route</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('StudentSubscriptionPlansPage', () => {
  beforeEach(() => {
    mockedCheckoutPlan.mockReset()
    mockedGetStudentSubscription.mockReset()
    mockedGetStudentSubscription.mockResolvedValue(subscriptionApiResponse(makeSubscription()))
  })

  it('redirects pending SEPAY plan checkout orders to the payment page', async () => {
    mockedCheckoutPlan.mockResolvedValue(checkoutApiResponse(makeOrder()))

    renderPlansPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Chọn gói PRO' }))

    await waitFor(() => expect(mockedCheckoutPlan).toHaveBeenCalledWith('PRO', {}))
    expect(await screen.findByText('Payment order route')).toBeInTheDocument()
  })

  it('shows activated state when plan checkout is already paid', async () => {
    mockedCheckoutPlan.mockResolvedValue(checkoutApiResponse(makeOrder({ status: 'PAID', paidAt: new Date().toISOString(), paymentInstructions: null })))

    renderPlansPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Chọn gói PRO' }))

    await waitFor(() => expect(mockedCheckoutPlan).toHaveBeenCalledWith('PRO', {}))
    expect(await screen.findByText('Gói học đã được kích hoạt.')).toBeInTheDocument()
  })

  it('shows the current active subscription and disables the active plan', async () => {
    mockedGetStudentSubscription.mockResolvedValue(
      subscriptionApiResponse(
        makeSubscription({
          planCode: 'PRO',
          aiDailyLimit: 100,
          aiUsedToday: 12,
          startsAt: new Date().toISOString(),
          endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      ),
    )

    renderPlansPage()

    expect(await screen.findByText(/gói hiện tại/i)).toBeInTheDocument()
    expect(screen.getAllByText('PRO').length).toBeGreaterThan(0)
    const activeButton = screen.getByRole('button', { name: /Đang dùng/i })
    expect(activeButton).toBeDisabled()
    expect(activeButton).toHaveTextContent('PRO')
  })

  it('sends coupon code when checking out a plan', async () => {
    mockedCheckoutPlan.mockResolvedValue(checkoutApiResponse(makeOrder()))

    renderPlansPage()

    fireEvent.change(await screen.findByLabelText(/mã giảm giá cho vip/i), { target: { value: ' vip10 ' } })
    fireEvent.click(screen.getByRole('button', { name: /chọn gói vip/i }))

    await waitFor(() => expect(mockedCheckoutPlan).toHaveBeenCalledWith('VIP', { couponCode: 'vip10' }))
  })
})
