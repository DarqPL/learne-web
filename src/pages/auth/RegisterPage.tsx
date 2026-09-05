import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MailCheck, ShieldCheck, UserPlus } from 'lucide-react'
import { requestRegistrationOtp, resendRegistrationOtp, verifyRegistrationOtp } from '../../lib/api/authApi'
import { getApiErrorMessage } from '../../lib/api/client'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { Alert, AlertDescription } from '../../components/shadcn/ui/alert'
import { Badge } from '../../components/shadcn/ui/badge'
import { Button } from '../../components/shadcn/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/shadcn/ui/card'
import { Separator } from '../../components/shadcn/ui/separator'
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
      <main className="mx-auto w-full max-w-md">
        <Card className="border-white/70 bg-white/90 shadow-2xl shadow-indigo-200/40 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <MailCheck className="h-7 w-7" />
            </div>
            <Badge variant="outline" className="mx-auto border-indigo-200 bg-indigo-50 text-indigo-700">
              Xác thực email
            </Badge>
            <CardTitle className="text-2xl font-bold text-gray-950">Nhập mã OTP</CardTitle>
            <CardDescription>
              Mã xác thực đã được gửi đến <span className="font-medium text-gray-800">{form.email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {info ? (
              <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription className="text-green-800">{info}</AlertDescription>
              </Alert>
            ) : null}
            {error ? (
              <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            ) : null}
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <Field label="Mã OTP (6 chữ số)" error={fieldErrors.otp}>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="123456"
                  required
                  className="h-11 rounded-xl bg-white/90 text-center tracking-[0.45em]"
                />
              </Field>
              <Button type="submit" loading={submitting} className="h-11 w-full rounded-xl">
                Xác nhận tài khoản
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Separator />
            <div className="flex w-full justify-between text-sm">
              <button type="button" onClick={handleResendOtp} disabled={submitting} className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline disabled:opacity-60">
                Gửi lại mã OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(1)
                  setOtp('')
                }}
                className="font-medium text-gray-600 hover:text-gray-800 hover:underline"
              >
                Sửa thông tin
              </button>
            </div>
          </CardFooter>
        </Card>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-md">
      <Card className="border-white/70 bg-white/90 shadow-2xl shadow-indigo-200/40 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <UserPlus className="h-7 w-7" />
          </div>
          <Badge variant="outline" className="mx-auto border-indigo-200 bg-indigo-50 text-indigo-700">
            Bắt đầu hành trình LearnE
          </Badge>
          <CardTitle className="text-2xl font-bold text-gray-950">Tạo tài khoản học viên</CardTitle>
          <CardDescription>Hoàn tất thông tin cơ bản, sau đó xác thực email bằng OTP.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          ) : null}
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <Field label="Họ và tên" error={fieldErrors.fullName}>
              <Input value={form.fullName} onChange={(event) => setField('fullName', event.target.value)} required autoComplete="name" className="h-11 rounded-xl bg-white/90" />
            </Field>
            <Field label="Email" error={fieldErrors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => setField('email', event.target.value)}
                required
                autoComplete="email"
                placeholder="ban@example.com"
                className="h-11 rounded-xl bg-white/90"
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
            <p className="rounded-xl bg-indigo-50 px-3 py-2 text-xs text-indigo-700">Mật khẩu phải có ít nhất 8 ký tự, gồm cả chữ và số.</p>
            <Button type="submit" loading={submitting} className="h-11 w-full rounded-xl">
              Gửi mã xác thực
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Separator />
          <p className="text-center text-sm text-gray-600">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
              Đăng nhập
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  )
}
