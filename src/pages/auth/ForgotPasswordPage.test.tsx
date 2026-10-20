import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
