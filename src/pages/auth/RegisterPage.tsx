import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MailCheck, ShieldCheck, UserPlus } from 'lucide-react'
import { requestRegistrationOtp, resendRegistrationOtp, verifyRegistrationOtp } from '../../lib/api/authApi'
import { formatCountdown } from '../../lib/api/rateLimit'
import {
  getRegistrationErrorMessage,
  isOtpAttemptsExhaustedError,
  isOtpExpiredError,
} from '../../lib/api/authErrorMessages'
import { useCountdown } from '../../lib/hooks/useCountdown'
import { useRateLimit } from '../../lib/hooks/useRateLimit'
import { RateLimitAlert } from '../../components/auth/RateLimitAlert'
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

const OTP_STORAGE_KEY = 'learne.auth.registration-otp:v1'
const OTP_TTL_SECONDS = 5 * 60
const ACCEPTED_MESSAGE = 'Yêu cầu gửi mã xác thực đã được tiếp nhận. Vui lòng kiểm tra hộp thư.'

type OtpLifecycle = 'active' | 'expired' | 'exhausted'

function writeStoredOtp(value: { email: string; expiresAt: number }) {
  try {
    window.sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(value))
  } catch {
    return
  }
}

function clearStoredOtp() {
  try {
    window.sessionStorage.removeItem(OTP_STORAGE_KEY)
  } catch {
    return
  }
}

function readStoredOtp(): { email: string; expiresAt: number } | null {
  let raw: string | null
  try {
    raw = window.sessionStorage.getItem(OTP_STORAGE_KEY)
  } catch {
    return null
  }
  if (raw === null) return null

  try {
    const parsed = JSON.parse(raw) as { email?: unknown; expiresAt?: unknown } | null
    if (
      parsed &&
      typeof parsed.email === 'string' &&
      parsed.email.length > 0 &&
      typeof parsed.expiresAt === 'number' &&
      Number.isFinite(parsed.expiresAt)
    ) {
      return { email: parsed.email, expiresAt: parsed.expiresAt }
    }
  } catch {
    clearStoredOtp()
    return null
  }

  clearStoredOtp()
  return null
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState<RegistrationForm>(initialForm)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>(emptyFieldErrors)
  const [otpState, setOtpState] = useState<OtpLifecycle>('active')
  const rateLimit = useRateLimit()
  const otpLifetime = useCountdown()
  const otpStartedRef = useRef(false)
  const otpSecondsLeftRef = useRef(otpLifetime.secondsLeft)
  const previousSecondsRef = useRef(otpLifetime.secondsLeft)
  const startOtpCountdown = otpLifetime.start
  const stopOtpCountdown = otpLifetime.stop

  const setField = (name: keyof RegistrationForm, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const applyRateLimit = (err: unknown) => {
    const captured = rateLimit.capture(err)
    if (captured) setError(null)
    return captured
  }

  const beginOtpLifetime = () => {
    writeStoredOtp({ email: form.email, expiresAt: Date.now() + OTP_TTL_SECONDS * 1000 })
    otpStartedRef.current = true
    setOtpState('active')
    startOtpCountdown(OTP_TTL_SECONDS)
  }

  const endOtpLifetime = () => {
    otpStartedRef.current = false
    stopOtpCountdown()
  }

  useEffect(() => {
    otpSecondsLeftRef.current = otpLifetime.secondsLeft
    const previous = previousSecondsRef.current
    previousSecondsRef.current = otpLifetime.secondsLeft
    if (!otpStartedRef.current || previous <= 0 || otpLifetime.secondsLeft > 0) return
    if (otpState === 'active' || otpState === 'exhausted') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOtpState('expired')
      setError(null)
    }
  }, [otpLifetime.secondsLeft, otpState])

  useLayoutEffect(() => {
    const stored = readStoredOtp()
    if (!stored) return

    const remaining = Math.ceil((stored.expiresAt - Date.now()) / 1000)
    /* eslint-disable react-hooks/set-state-in-effect */
    setForm((prev) => ({ ...prev, email: stored.email }))
    setStep(2)
    if (remaining > 0) {
      setInfo(ACCEPTED_MESSAGE)
      setOtpState('active')
      otpStartedRef.current = true
      startOtpCountdown(remaining)
    } else {
      clearStoredOtp()
      setOtpState('expired')
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [startOtpCountdown])

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
    rateLimit.reset()
    setSubmitting(true)
    try {
      await requestRegistrationOtp(form)
      beginOtpLifetime()
      setInfo(ACCEPTED_MESSAGE)
      setStep(2)
    } catch (err) {
      if (!applyRateLimit(err)) setError(getRegistrationErrorMessage(err, 'Không thể gửi mã OTP. Vui lòng thử lại.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    setError(null)
    setInfo(null)
    rateLimit.reset()
    setSubmitting(true)
    try {
      await resendRegistrationOtp({ email: form.email })
      beginOtpLifetime()
      setInfo(ACCEPTED_MESSAGE)
    } catch (err) {
      if (!applyRateLimit(err)) setError(getRegistrationErrorMessage(err, 'Không thể gửi lại mã OTP. Vui lòng thử lại.'))
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
    rateLimit.reset()
    setSubmitting(true)
    try {
      await verifyRegistrationOtp({ email: form.email, otp })
      clearStoredOtp()
      endOtpLifetime()
      navigate('/login', { replace: true, state: { message: 'Đăng ký thành công, vui lòng đăng nhập.' } })
    } catch (err) {
      if (applyRateLimit(err)) return
      if (isOtpAttemptsExhaustedError(err)) {
        if (otpSecondsLeftRef.current > 0) {
          setOtpState('exhausted')
          setError(getRegistrationErrorMessage(err, 'Mã OTP không hợp lệ.'))
        } else {
          clearStoredOtp()
          endOtpLifetime()
          setOtpState('expired')
        }
        return
      }
      if (isOtpExpiredError(err)) {
        clearStoredOtp()
        endOtpLifetime()
        setOtpState('expired')
      }
      setError(getRegistrationErrorMessage(err, 'Mã OTP không hợp lệ.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditInfo = () => {
    clearStoredOtp()
    endOtpLifetime()
    setOtpState('active')
    setOtp('')
    setInfo(null)
    setError(null)
    rateLimit.reset()
    setStep(1)
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
              Email xác thực: <span className="font-medium text-gray-800">{form.email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rateLimit.info ? <RateLimitAlert info={rateLimit.info} secondsLeft={rateLimit.secondsLeft} /> : null}
            <p className="mb-4 text-center text-sm text-gray-600">
              {otpState === 'expired' ? (
                'Mã OTP đã hết hạn.'
              ) : otpState === 'exhausted' ? (
                <>
                  Mã hiện tại sẽ hết hạn sau{' '}
                  <span role="timer" aria-live="off" className="font-medium tabular-nums">
                    {formatCountdown(otpLifetime.secondsLeft)}
                  </span>
                </>
              ) : (
                <>
                  Mã có hiệu lực trong{' '}
                  <span role="timer" aria-live="off" className="font-medium tabular-nums">
                    {formatCountdown(otpLifetime.secondsLeft)}
                  </span>
                </>
              )}
            </p>
            <p role="status" className="sr-only">
              {otpState === 'expired' ? 'Mã OTP đã hết hạn.' : otpState === 'exhausted' ? 'Bạn đã nhập sai quá 5 lần.' : ''}
            </p>
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
              <Button
                type="submit"
                loading={submitting}
                disabled={rateLimit.locked || otpLifetime.secondsLeft <= 0 || otpState !== 'active'}
                className="h-11 w-full rounded-xl"
              >
                Xác nhận tài khoản
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Separator />
            <div className="flex w-full justify-between text-sm">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={submitting || rateLimit.locked || otpLifetime.secondsLeft > 0}
                className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline disabled:opacity-60"
              >
                Gửi lại mã OTP
              </button>
              <button
                type="button"
                onClick={handleEditInfo}
                disabled={submitting}
                className="font-medium text-gray-600 hover:text-gray-800 hover:underline disabled:opacity-60"
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
          {rateLimit.info ? <RateLimitAlert info={rateLimit.info} secondsLeft={rateLimit.secondsLeft} /> : null}
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
            <Button type="submit" loading={submitting} disabled={rateLimit.locked} className="h-11 w-full rounded-xl">
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
