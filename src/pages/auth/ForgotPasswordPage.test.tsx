import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { requestPasswordReset } from '../../lib/api/authApi'
import { ForgotPasswordPage } from './ForgotPasswordPage'

vi.mock('../../lib/api/authApi', () => ({ requestPasswordReset: vi.fn() }))

const acceptedMessage = 'Nếu email hợp lệ, yêu cầu đặt lại mật khẩu đã được tiếp nhận. Vui lòng kiểm tra hộp thư và nhập mã bên dưới.'

function ResetLocation() {
  const location = useLocation()
  const state = location.state as { email: string; message: string }
  return (
    <main>
      <h1>{location.pathname}</h1>
      <p>{state.email}</p>
      <p>{state.message}</p>
    </main>
  )
}

function submitReset(email: string) {
  render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetLocation />} />
      </Routes>
    </MemoryRouter>,
  )
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } })
  fireEvent.click(screen.getByRole('button', { name: 'Gửi mã đặt lại mật khẩu' }))
}

describe('ForgotPasswordPage request acceptance', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it.each(['known@example.com', 'unknown@example.com'])(
    'navigates with the same generic acceptance and submitted email for %s',
    async (email) => {
      // Account existence is deliberately unavailable to the frontend.
      vi.mocked(requestPasswordReset).mockResolvedValue({ data: {} } as never)
      submitReset(email)

      expect(await screen.findByRole('heading', { name: '/reset-password' })).toBeInTheDocument()
      expect(screen.getByText(email)).toBeInTheDocument()
      expect(screen.getByText(acceptedMessage)).toBeInTheDocument()
      expect(screen.queryByText(/đã (được )?gửi|email tồn tại/i)).not.toBeInTheDocument()
      expect(requestPasswordReset).toHaveBeenCalledWith({ email })
    },
  )

  it('shows an API error without navigating or showing acceptance', async () => {
    vi.mocked(requestPasswordReset).mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'Không thể tiếp nhận yêu cầu.' } },
    })
    submitReset('student@example.com')

    expect(await screen.findByText('Không thể tiếp nhận yêu cầu.')).toBeInTheDocument()
    expect(screen.queryByText(acceptedMessage)).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '/reset-password' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gửi mã đặt lại mật khẩu' })).toBeEnabled()
  })
})

function limitedError(seconds: number) {
  return Object.assign(new Error('429'), {
    isAxiosError: true,
    response: {
      status: 429,
      headers: { 'retry-after': String(seconds) },
      data: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
    },
  })
}

async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

afterEach(() => {
  vi.useRealTimers()
})

describe('ForgotPasswordPage rate limits', () => {
  it('locks the request button for Retry-After seconds', async () => {
    vi.useFakeTimers()
    vi.mocked(requestPasswordReset).mockRejectedValue(limitedError(30))
    submitReset('student@example.com')

    await flush()

    expect(screen.getByText(/Quá nhiều lần thử/)).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('00:30')
    const submit = screen.getByRole('button', { name: 'Gửi mã đặt lại mật khẩu' })
    expect(submit).toBeDisabled()

    act(() => {
      vi.advanceTimersByTime(30_000)
    })

    expect(submit).toBeEnabled()
    expect(screen.getByText('Bạn có thể thử lại.')).toBeInTheDocument()
  })

  it('shows the unavailable message without locking the form', async () => {
    vi.mocked(requestPasswordReset).mockRejectedValue(
      Object.assign(new Error('503'), {
        isAxiosError: true,
        response: { status: 503, data: { code: 'ABUSE_PROTECTION_UNAVAILABLE', message: 'Unavailable.' } },
      }),
    )
    submitReset('student@example.com')

    await flush()

    expect(screen.getByText(/Tạm thời không thể xác thực/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gửi mã đặt lại mật khẩu' })).toBeEnabled()
  })
})
