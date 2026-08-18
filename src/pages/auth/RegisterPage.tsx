import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { requestRegistrationOtp, resendRegistrationOtp, verifyRegistrationOtp } from '../../lib/api/authApi'
import { getApiErrorMessage } from '../../lib/api/client'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { validateForm } from '../../lib/validation/validateForm'
import { confirmPassword, email, fullName, otp as otpValidator, passwordPolicy, required } from '../../lib/validation/validators'

interface RegistrationForm {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

const initialForm: RegistrationForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
}

const emptyFieldErrors = {}

export function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState<RegistrationForm>(initialForm)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>(emptyFieldErrors)

  const setField = (name: keyof RegistrationForm, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleRequestOtp = async (event: FormEvent) => {
    event.preventDefault()
    const errors = validateForm(
      { fullName: form.fullName, email: form.email, password: form.password, confirmPassword: form.confirmPassword },
      {
        fullName: [fullName()],
        email: [required(), email()],
        password: [passwordPolicy()],
        confirmPassword: [confirmPassword('password')],
      },
    )
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors(emptyFieldErrors)
    setError(null)
    setInfo(null)
    setSubmitting(true)
    try {
      await requestRegistrationOtp(form)
      setInfo('Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (kể cả thư rác).')
      setStep(2)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể gửi mã OTP. Vui lòng thử lại.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    setError(null)
    setSubmitting(true)
    try {
      await resendRegistrationOtp({ email: form.email })
      setInfo('Mã OTP mới đã được gửi đến email của bạn.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể gửi lại mã OTP. Vui lòng thử lại.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault()
    const errors = validateForm({ otp }, { otp: [otpValidator()] })
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors(emptyFieldErrors)
    setError(null)
    setSubmitting(true)
    try {
      await verifyRegistrationOtp({ email: form.email, otp })
      navigate('/login', { replace: true, state: { message: 'Đăng ký thành công, vui lòng đăng nhập.' } })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Mã OTP không hợp lệ.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 2) {
    return (
      <Card>
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">Xác nhận OTP</h1>
        <p className="mb-4 text-sm text-gray-600">
          Mã OTP đã được gửi đến <span className="font-medium">{form.email}</span>
        </p>
        {info ? (
          <div className="mb-4">
            <Alert variant="success">{info}</Alert>
          </div>
        ) : null}
        {error ? (
          <div className="mb-4">
            <Alert>{error}</Alert>
          </div>
        ) : null}
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <Field label="Mã OTP (6 chữ số)" error={fieldErrors.otp}>
            <Input
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="123456"
              required
            />
          </Field>
          <Button type="submit" loading={submitting} className="w-full">
            Xác nhận
          </Button>
        </form>
        <div className="mt-4 flex justify-between text-sm">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={submitting}
            className="text-indigo-600 hover:underline disabled:opacity-60"
          >
            Gửi lại mã OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setStep(1)
              setOtp('')
            }}
            className="text-gray-600 hover:underline"
          >
            Sửa thông tin
          </button>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">Đăng ký tài khoản</h1>
      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}
      <form onSubmit={handleRequestOtp} className="space-y-4">
        <Field label="Họ và tên" error={fieldErrors.fullName}>
          <Input value={form.fullName} onChange={(event) => setField('fullName', event.target.value)} required autoComplete="name" />
        </Field>
        <Field label="Email" error={fieldErrors.email}>
          <Input
            type="email"
            value={form.email}
            onChange={(event) => setField('email', event.target.value)}
            required
            autoComplete="email"
            placeholder="ban@example.com"
          />
        </Field>
        <Field label="Mật khẩu" error={fieldErrors.password}>
          <PasswordInput value={form.password} onChange={(event) => setField('password', event.target.value)} required autoComplete="new-password" />
        </Field>
        <Field label="Xác nhận mật khẩu" error={fieldErrors.confirmPassword}>
          <PasswordInput
            value={form.confirmPassword}
            onChange={(event) => setField('confirmPassword', event.target.value)}
            required
            autoComplete="new-password"
          />
        </Field>
        <p className="text-xs text-gray-500">Mật khẩu phải có ít nhất 8 ký tự, gồm cả chữ và số.</p>
        <Button type="submit" loading={submitting} className="w-full">
          Tiếp tục
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-indigo-600 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </Card>
  )
}