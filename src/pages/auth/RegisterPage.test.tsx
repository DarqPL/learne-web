import { StrictMode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { requestRegistrationOtp, resendRegistrationOtp, verifyRegistrationOtp } from '../../lib/api/authApi'
import { RegisterPage } from './RegisterPage'

vi.mock('../../lib/api/authApi', () => ({
  requestRegistrationOtp: vi.fn(),
  resendRegistrationOtp: vi.fn(),
  verifyRegistrationOtp: vi.fn(),
}))

const acceptedMessage = 'Yêu cầu gửi mã xác thực đã được tiếp nhận. Vui lòng kiểm tra hộp thư.'
const registration = {
  fullName: 'Nguyen Van A',
  email: 'student@example.com',
  password: 'Password123',
  confirmPassword: 'Password123',
}
const OTP_STORAGE_KEY = 'learne.auth.registration-otp:v1'
const OTP_TTL_SECONDS = 300

async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginLocation />} />
      </Routes>
    </MemoryRouter>,
  )
}

function LoginLocation() {
  const location = useLocation()
  return <p>{(location.state as { message: string }).message}</p>
}

function submitRegistration() {
  renderRegister()
  fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: registration.fullName } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: registration.email } })
  fireEvent.change(screen.getByLabelText(/^Mật khẩu/), { target: { value: registration.password } })
  fireEvent.change(screen.getByLabelText(/^Xác nhận mật khẩu/), { target: { value: registration.confirmPassword } })
  fireEvent.click(screen.getByRole('button', { name: 'Gửi mã xác thực' }))
}

beforeEach(() => {
  vi.resetAllMocks()
  window.sessionStorage.clear()
  vi.mocked(requestRegistrationOtp).mockResolvedValue({ data: {} } as never)
  vi.mocked(resendRegistrationOtp).mockResolvedValue({ data: {} } as never)
  vi.mocked(verifyRegistrationOtp).mockResolvedValue({ data: {} } as never)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('RegisterPage request acceptance', () => {
  it('shows acceptance and the email without claiming delivery after requesting a code', async () => {
    submitRegistration()

    expect(await screen.findByText(acceptedMessage)).toBeInTheDocument()
    expect(screen.getByText(registration.email)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Xác nhận tài khoản' })).toBeInTheDocument()
    expect(screen.queryByText(/đã (được )?gửi/i)).not.toBeInTheDocument()
    expect(requestRegistrationOtp).toHaveBeenCalledWith(registration)
  })

  it('keeps resend disabled until the code expires, then accepts a resend', async () => {
    vi.useFakeTimers()
    try {
      submitRegistration()
      await flush()

      const resend = screen.getByRole('button', { name: 'Gửi lại mã OTP' })
      expect(resend).toBeDisabled()

      act(() => {
        vi.advanceTimersByTime(OTP_TTL_SECONDS * 1000)
      })

      expect(screen.getByRole('status')).toHaveTextContent('Mã OTP đã hết hạn.')
      expect(screen.getAllByText('Mã OTP đã hết hạn.')).toHaveLength(2)
      expect(resend).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Xác nhận tài khoản' })).toBeDisabled()

      fireEvent.click(resend)
      await flush()

      expect(resendRegistrationOtp).toHaveBeenCalledWith({ email: registration.email })
      expect(screen.getByText(acceptedMessage)).toBeInTheDocument()
      expect(screen.queryByText(/đã (được )?gửi/i)).not.toBeInTheDocument()
      expect(screen.getByRole('timer')).toHaveTextContent('05:00')
      expect(resend).toBeDisabled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('keeps a failed request on the registration form without acceptance', async () => {
    vi.mocked(requestRegistrationOtp).mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'Không thể tiếp nhận yêu cầu.' } },
    })
    submitRegistration()

    expect(await screen.findByText('Không thể tiếp nhận yêu cầu.')).toBeInTheDocument()
    expect(screen.queryByText(acceptedMessage)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gửi mã xác thực' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Xác nhận tài khoản' })).not.toBeInTheDocument()
  })

  it('shows a resend error without leaving stale acceptance for that attempt', async () => {
    vi.useFakeTimers()
    try {
      vi.mocked(resendRegistrationOtp).mockRejectedValue(new Error('Request failed'))
      submitRegistration()
      await flush()

      act(() => {
        vi.advanceTimersByTime(OTP_TTL_SECONDS * 1000)
      })
      fireEvent.click(screen.getByRole('button', { name: 'Gửi lại mã OTP' }))
      await flush()

      expect(screen.getByText('Không thể gửi lại mã OTP. Vui lòng thử lại.')).toBeInTheDocument()
      expect(screen.getAllByRole('alert')).toHaveLength(1)
      expect(screen.queryByText(acceptedMessage)).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Gửi lại mã OTP' })).toBeEnabled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('still reports successful registration only after verifying the code', async () => {
    submitRegistration()
    fireEvent.change(await screen.findByPlaceholderText('123456'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận tài khoản' }))

    expect(await screen.findByText('Đăng ký thành công, vui lòng đăng nhập.')).toBeInTheDocument()
    expect(verifyRegistrationOtp).toHaveBeenCalledWith({ email: registration.email, otp: '123456' })
  })
})

describe('RegisterPage OTP lifetime', () => {
  it('starts a five-minute countdown and disables verify at zero', async () => {
    vi.useFakeTimers()
    try {
      submitRegistration()
      await flush()

      expect(screen.getByText(/Mã có hiệu lực trong/)).toBeInTheDocument()
      expect(screen.getByRole('timer')).toHaveTextContent('05:00')
      expect(screen.getByRole('button', { name: 'Xác nhận tài khoản' })).toBeEnabled()

      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(screen.getByRole('timer')).toHaveTextContent('04:59')

      act(() => {
        vi.advanceTimersByTime(OTP_TTL_SECONDS * 1000)
      })

      expect(screen.getByRole('status')).toHaveTextContent('Mã OTP đã hết hạn.')
      expect(screen.getAllByText('Mã OTP đã hết hạn.')).toHaveLength(2)
      expect(screen.getByRole('button', { name: 'Xác nhận tài khoản' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Gửi lại mã OTP' })).toBeEnabled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('writes the deadline to sessionStorage after requesting a code', async () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-10-22T10:00:00Z'))
      submitRegistration()
      await flush()

      const stored = JSON.parse(window.sessionStorage.getItem(OTP_STORAGE_KEY) ?? 'null') as {
        email: string
        expiresAt: number
      }
      expect(stored).toEqual({ email: registration.email, expiresAt: Date.now() + OTP_TTL_SECONDS * 1000 })
    } finally {
      vi.useRealTimers()
    }
  })

  it('disables editing while a resend is in flight', async () => {
    vi.useFakeTimers()
    try {
      submitRegistration()
      await flush()

      act(() => {
        vi.advanceTimersByTime(OTP_TTL_SECONDS * 1000)
      })

      let resolveResend: (value: unknown) => void = () => {}
      vi.mocked(resendRegistrationOtp).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveResend = resolve
          }) as never,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Gửi lại mã OTP' }))
      await flush()

      expect(screen.getByRole('button', { name: 'Sửa thông tin' })).toBeDisabled()

      resolveResend({ data: {} })
      await flush()

      expect(screen.getByRole('button', { name: 'Sửa thông tin' })).toBeEnabled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('restores the verify step and remaining time from sessionStorage', async () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-10-22T10:00:00Z'))
      window.sessionStorage.setItem(
        OTP_STORAGE_KEY,
        JSON.stringify({ email: registration.email, expiresAt: Date.now() + 120_000 }),
      )

      renderRegister()
      await flush()

      expect(screen.getByText(registration.email)).toBeInTheDocument()
      expect(screen.getByText(/Mã có hiệu lực trong/)).toBeInTheDocument()
      expect(screen.getByText(acceptedMessage)).toBeInTheDocument()
      expect(screen.getByRole('timer')).toHaveTextContent('02:00')
      expect(screen.getByRole('button', { name: 'Xác nhận tài khoản' })).toBeEnabled()
      expect(screen.queryByRole('button', { name: 'Gửi mã xác thực' })).not.toBeInTheDocument()
      expect(window.sessionStorage.getItem(OTP_STORAGE_KEY)).not.toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('restores an expired code as expired and clears storage', async () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-10-22T10:00:00Z'))
      window.sessionStorage.setItem(
        OTP_STORAGE_KEY,
        JSON.stringify({ email: registration.email, expiresAt: Date.now() - 1000 }),
      )

      renderRegister()
      await flush()

      expect(screen.getByText(registration.email)).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent('Mã OTP đã hết hạn.')
      expect(screen.getAllByText('Mã OTP đã hết hạn.')).toHaveLength(2)
      expect(screen.queryAllByRole('alert')).toHaveLength(0)
      expect(screen.getByRole('button', { name: 'Xác nhận tài khoản' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Gửi lại mã OTP' })).toBeEnabled()
      expect(window.sessionStorage.getItem(OTP_STORAGE_KEY)).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('ignores and clears corrupt storage and stays on the registration form', async () => {
    window.sessionStorage.setItem(OTP_STORAGE_KEY, '{not-json')

    renderRegister()
    await flush()

    expect(screen.getByRole('button', { name: 'Gửi mã xác thực' })).toBeInTheDocument()
    expect(window.sessionStorage.getItem(OTP_STORAGE_KEY)).toBeNull()
  })

  it('clears storage when editing the form', async () => {
    submitRegistration()
    await flush()
    expect(window.sessionStorage.getItem(OTP_STORAGE_KEY)).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Sửa thông tin' }))

    expect(window.sessionStorage.getItem(OTP_STORAGE_KEY)).toBeNull()
    expect(screen.getByRole('button', { name: 'Gửi mã xác thực' })).toBeInTheDocument()
  })

  it('clears storage after a successful verify', async () => {
    submitRegistration()
    await flush()
    fireEvent.change(screen.getByPlaceholderText('123456'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận tài khoản' }))

    await flush()

    expect(window.sessionStorage.getItem(OTP_STORAGE_KEY)).toBeNull()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
  })

  it.each([
    ['null', 'null'],
    ['number', '42'],
    ['string', '"x"'],
    ['array', '[]'],
    ['object without keys', '{}'],
    ['empty email', `{"email":"","expiresAt":${Date.now() + 60_000}}`],
    ['non-numeric expiry', '{"email":"a@b.com","expiresAt":"123"}'],
    ['null expiry', '{"email":"a@b.com","expiresAt":null}'],
    ['empty string', ''],
  ])('clears an invalid stored record: %s', async (_label, raw) => {
    window.sessionStorage.setItem(OTP_STORAGE_KEY, raw)

    renderRegister()
    await flush()

    expect(screen.getByRole('button', { name: 'Gửi mã xác thực' })).toBeInTheDocument()
    expect(window.sessionStorage.getItem(OTP_STORAGE_KEY)).toBeNull()
  })

  it('ignores a storage read failure and stays on the form', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    try {
      renderRegister()
      await flush()

      expect(screen.getByRole('button', { name: 'Gửi mã xác thực' })).toBeInTheDocument()
    } finally {
      getItem.mockRestore()
    }
  })

  it('ignores a storage removal failure while clearing corrupt data', async () => {
    window.sessionStorage.setItem(OTP_STORAGE_KEY, '{not-json')
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    try {
      renderRegister()
      await flush()

      expect(screen.getByRole('button', { name: 'Gửi mã xác thực' })).toBeInTheDocument()
    } finally {
      removeItem.mockRestore()
      window.sessionStorage.clear()
    }
  })

  it('restores an active deadline once under StrictMode', async () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-10-22T10:00:00Z'))
      window.sessionStorage.setItem(
        OTP_STORAGE_KEY,
        JSON.stringify({ email: registration.email, expiresAt: Date.now() + 120_000 }),
      )

      render(
        <StrictMode>
          <MemoryRouter initialEntries={['/register']}>
            <Routes>
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginLocation />} />
            </Routes>
          </MemoryRouter>
        </StrictMode>,
      )
      await flush()

      expect(screen.getByRole('timer')).toHaveTextContent('02:00')
      expect(screen.getByRole('button', { name: 'Xác nhận tài khoản' })).toBeEnabled()

      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(screen.getByRole('timer')).toHaveTextContent('01:59')

      act(() => {
        vi.advanceTimersByTime(119_000)
      })
      expect(screen.getAllByText('Mã OTP đã hết hạn.')).toHaveLength(2)
      expect(screen.getByRole('button', { name: 'Xác nhận tài khoản' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Gửi lại mã OTP' })).toBeEnabled()
    } finally {
      vi.useRealTimers()
    }
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

describe('RegisterPage rate limits', () => {
  it('locks the request button for Retry-After seconds', async () => {
    vi.useFakeTimers()
    try {
      vi.mocked(requestRegistrationOtp).mockRejectedValue(limitedError(30))
      submitRegistration()
      await flush()

      expect(screen.getByText(/Quá nhiều lần thử/)).toBeInTheDocument()
      expect(screen.getByRole('timer')).toHaveTextContent('00:30')
      const submit = screen.getByRole('button', { name: 'Gửi mã xác thực' })
      expect(submit).toBeDisabled()

      act(() => {
        vi.advanceTimersByTime(30_000)
      })

      expect(submit).toBeEnabled()
      expect(screen.getByText('Bạn có thể thử lại.')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows the unavailable message without locking the request form', async () => {
    vi.mocked(requestRegistrationOtp).mockRejectedValue(
      Object.assign(new Error('503'), {
        isAxiosError: true,
        response: {
          status: 503,
          data: { code: 'ABUSE_PROTECTION_UNAVAILABLE', message: 'Service temporarily unavailable.' },
        },
      }),
    )
    submitRegistration()
    await flush()

    expect(screen.getByText(/Tạm thời không thể xác thực/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gửi mã xác thực' })).toBeEnabled()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
  })

  it('locks resend for Retry-After seconds after the code expires', async () => {
    vi.useFakeTimers()
    try {
      submitRegistration()
      await flush()

      act(() => {
        vi.advanceTimersByTime(OTP_TTL_SECONDS * 1000)
      })

      vi.mocked(resendRegistrationOtp).mockRejectedValue(limitedError(20))
      const resend = screen.getByRole('button', { name: 'Gửi lại mã OTP' })
      fireEvent.click(resend)
      await flush()

      expect(screen.getByText(/Quá nhiều lần thử/)).toBeInTheDocument()
      expect(screen.getByRole('timer')).toHaveTextContent('00:20')
      expect(resend).toBeDisabled()

      act(() => {
        vi.advanceTimersByTime(20_000)
      })

      expect(resend).toBeEnabled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows the unavailable message without locking resend', async () => {
    vi.useFakeTimers()
    try {
      submitRegistration()
      await flush()

      act(() => {
        vi.advanceTimersByTime(OTP_TTL_SECONDS * 1000)
      })

      vi.mocked(resendRegistrationOtp).mockRejectedValue(
        Object.assign(new Error('503'), {
          isAxiosError: true,
          response: {
            status: 503,
            data: { code: 'ABUSE_PROTECTION_UNAVAILABLE', message: 'Service temporarily unavailable.' },
          },
        }),
      )
      const resend = screen.getByRole('button', { name: 'Gửi lại mã OTP' })
      fireEvent.click(resend)
      await flush()

      expect(screen.getByText(/Tạm thời không thể xác thực/)).toBeInTheDocument()
      expect(resend).toBeEnabled()
      expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
