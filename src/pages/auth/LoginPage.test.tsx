import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { login } from '../../lib/api/authApi'
import { LoginPage } from './LoginPage'

vi.mock('../../lib/api/authApi', () => ({ login: vi.fn() }))
vi.mock('../../lib/auth/auth-context', () => ({ useAuth: () => ({ login: vi.fn() }) }))

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

function unavailableError() {
  return Object.assign(new Error('503'), {
    isAxiosError: true,
    response: {
      status: 503,
      data: { code: 'ABUSE_PROTECTION_UNAVAILABLE', message: 'Service temporarily unavailable.' },
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
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>,
  )
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'student01@learne.local' } })
  fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'Admin123' } })
  fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
}

beforeEach(() => {
  vi.resetAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('LoginPage rate limits', () => {
  it('locks the form for Retry-After seconds and unlocks at zero', async () => {
    vi.useFakeTimers()
    vi.mocked(login).mockRejectedValue(limitedError(42))
    renderAndSubmit()

    await flush()

    expect(screen.getByText(/Quá nhiều lần thử/)).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('00:42')
    const submit = screen.getByRole('button', { name: 'Đăng nhập' })
    expect(submit).toBeDisabled()

    act(() => {
      vi.advanceTimersByTime(42_000)
    })

    expect(screen.getByText('Bạn có thể thử lại.')).toBeInTheDocument()
    expect(submit).toBeEnabled()
  })

  it('shows the unavailable message without locking the form', async () => {
    vi.mocked(login).mockRejectedValue(unavailableError())
    renderAndSubmit()

    await flush()

    expect(screen.getByText(/Tạm thời không thể xác thực/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeEnabled()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
  })
})
