import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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

function LoginLocation() {
  const location = useLocation()
  return <p>{(location.state as { message: string }).message}</p>
}

function submitRegistration() {
  render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginLocation />} />
      </Routes>
    </MemoryRouter>,
  )
  fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: registration.fullName } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: registration.email } })
  fireEvent.change(screen.getByLabelText(/^Mật khẩu/), { target: { value: registration.password } })
  fireEvent.change(screen.getByLabelText(/^Xác nhận mật khẩu/), { target: { value: registration.confirmPassword } })
  fireEvent.click(screen.getByRole('button', { name: 'Gửi mã xác thực' }))
}

describe('RegisterPage request acceptance', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(requestRegistrationOtp).mockResolvedValue({ data: {} } as never)
    vi.mocked(resendRegistrationOtp).mockResolvedValue({ data: {} } as never)
    vi.mocked(verifyRegistrationOtp).mockResolvedValue({ data: {} } as never)
  })

  it('shows acceptance and the email without claiming delivery after requesting a code', async () => {
    submitRegistration()

    expect(await screen.findByText(acceptedMessage)).toBeInTheDocument()
    expect(screen.getByText(registration.email)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Xác nhận tài khoản' })).toBeInTheDocument()
    expect(screen.queryByText(/đã (được )?gửi/i)).not.toBeInTheDocument()
    expect(requestRegistrationOtp).toHaveBeenCalledWith(registration)
  })

  it('shows acceptance without claiming delivery after resending a code', async () => {
    submitRegistration()
    const resend = await screen.findByRole('button', { name: 'Gửi lại mã OTP' })
    fireEvent.click(resend)

    await waitFor(() => expect(resendRegistrationOtp).toHaveBeenCalledWith({ email: registration.email }))
    await waitFor(() => expect(resend).toBeEnabled())
    expect(screen.getByText(acceptedMessage)).toBeInTheDocument()
    expect(screen.queryByText(/đã (được )?gửi/i)).not.toBeInTheDocument()
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
    vi.mocked(resendRegistrationOtp).mockRejectedValue(new Error('Request failed'))
    submitRegistration()
    fireEvent.click(await screen.findByRole('button', { name: 'Gửi lại mã OTP' }))

    expect(await screen.findByText('Không thể gửi lại mã OTP. Vui lòng thử lại.')).toBeInTheDocument()
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(screen.queryByText(acceptedMessage)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gửi lại mã OTP' })).toBeEnabled()
  })

  it('still reports successful registration only after verifying the code', async () => {
    submitRegistration()
    fireEvent.change(await screen.findByPlaceholderText('123456'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận tài khoản' }))

    expect(await screen.findByText('Đăng ký thành công, vui lòng đăng nhập.')).toBeInTheDocument()
    expect(verifyRegistrationOtp).toHaveBeenCalledWith({ email: registration.email, otp: '123456' })
  })
})
