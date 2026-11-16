import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { confirmPasswordReset } from '../../lib/api/authApi'
import { ResetPasswordPage } from './ResetPasswordPage'

vi.mock('../../lib/api/authApi', () => ({ confirmPasswordReset: vi.fn() }))

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

function renderAndSubmit() {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/reset-password', state: { email: 'student@example.com' } }]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </MemoryRouter>,
  )
  fireEvent.change(screen.getByLabelText('Mã OTP'), { target: { value: '123456' } })
  fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: 'Password123' } })
  fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu mới'), { target: { value: 'Password123' } })
  fireEvent.click(screen.getByRole('button', { name: 'Cập nhật mật khẩu' }))
}

beforeEach(() => {
  vi.resetAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('ResetPasswordPage rate limits', () => {
  it('locks the confirm button for Retry-After seconds', async () => {
    vi.useFakeTimers()
    vi.mocked(confirmPasswordReset).mockRejectedValue(limitedError(20))
    renderAndSubmit()

    await flush()

    expect(screen.getByText(/Quá nhiều lần thử/)).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('00:20')
    const submit = screen.getByRole('button', { name: 'Cập nhật mật khẩu' })
    expect(submit).toBeDisabled()

    act(() => {
      vi.advanceTimersByTime(20_000)
    })

    expect(submit).toBeEnabled()
  })

  it('shows the unavailable message without locking the form', async () => {
    vi.mocked(confirmPasswordReset).mockRejectedValue(
      Object.assign(new Error('503'), {
        isAxiosError: true,
        response: { status: 503, data: { code: 'ABUSE_PROTECTION_UNAVAILABLE', message: 'Unavailable.' } },
      }),
    )
    renderAndSubmit()

    await flush()

    expect(screen.getByText(/Tạm thời không thể xác thực/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cập nhật mật khẩu' })).toBeEnabled()
  })
})
