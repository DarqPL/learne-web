import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StudentSubscriptionPlansPage } from './StudentSubscriptionPlansPage'
import { checkoutPlan } from '../../../lib/api/studentMonetizationApi'
import type { OrderResponse } from '../../../lib/api/types'

vi.mock('../../../lib/api/studentMonetizationApi', () => ({
  checkoutPlan: vi.fn(),
}))

const mockedCheckoutPlan = vi.mocked(checkoutPlan)

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
  })

  it('redirects pending SEPAY plan checkout orders to the payment page', async () => {
    mockedCheckoutPlan.mockResolvedValue(checkoutApiResponse(makeOrder()))

    renderPlansPage()

    fireEvent.click(screen.getByRole('button', { name: 'Chọn gói PRO' }))

    await waitFor(() => expect(mockedCheckoutPlan).toHaveBeenCalledWith('PRO'))
    expect(await screen.findByText('Payment order route')).toBeInTheDocument()
  })

  it('shows activated state when plan checkout is already paid', async () => {
    mockedCheckoutPlan.mockResolvedValue(checkoutApiResponse(makeOrder({ status: 'PAID', paidAt: new Date().toISOString(), paymentInstructions: null })))

    renderPlansPage()

    fireEvent.click(screen.getByRole('button', { name: 'Chọn gói PRO' }))

    await waitFor(() => expect(mockedCheckoutPlan).toHaveBeenCalledWith('PRO'))
    expect(await screen.findByText('Gói học đã được kích hoạt.')).toBeInTheDocument()
  })
})
