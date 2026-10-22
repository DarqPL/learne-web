import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react'
import { confirmPasswordReset } from '../../lib/api/authApi'
import { getApiErrorMessage } from '../../lib/api/client'
import { readRateLimit, type RateLimitInfo } from '../../lib/api/rateLimit'
import { useCountdown } from '../../lib/hooks/useCountdown'
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
import { confirmPassword, email as emailValidator, otp, passwordPolicy, required } from '../../lib/validation/validators'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const resetState = location.state as { email?: string; message?: string } | null
  const lockedEmail = resetState?.email?.trim() || null
  const [email, setEmail] = useState(lockedEmail ?? '')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const rateLimit = useCountdown()
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null)
  const effectiveEmail = lockedEmail ?? email

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const errors = validateForm(
      { email: effectiveEmail, token, newPassword, confirmNewPassword },
      {
        email: [required(), emailValidator()],
        token: [otp()],
        newPassword: [passwordPolicy()],
        confirmNewPassword: [confirmPassword('newPassword')],
      },
    )
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setError(null)
    setRateLimitInfo(null)
    setSubmitting(true)
    try {
      await confirmPasswordReset({ email: effectiveEmail, token, newPassword, confirmNewPassword })
      navigate('/login', { replace: true, state: { message: 'Đặt lại mật khẩu thành công, vui lòng đăng nhập.' } })
    } catch (err) {
      const info = readRateLimit(err)
      if (info) {
        setRateLimitInfo(info)
        if (info.kind === 'limited') rateLimit.start(info.retryAfterSeconds)
      } else {
        setError(getApiErrorMessage(err, 'Không thể đặt lại mật khẩu.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-md">
      <Card className="border-white/70 bg-white/90 shadow-2xl shadow-indigo-200/40 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <KeyRound className="h-7 w-7" />
          </div>
          <Badge variant="outline" className="mx-auto border-indigo-200 bg-indigo-50 text-indigo-700">
            Mã xác thực trong email
          </Badge>
          <CardTitle className="text-2xl font-bold text-gray-950">Đặt lại mật khẩu</CardTitle>
          <CardDescription>Nhập mã OTP và mật khẩu mới để bảo vệ tài khoản của bạn.</CardDescription>
        </CardHeader>
        <CardContent>
          {resetState?.message ? (
            <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription className="text-green-800">{resetState.message}</AlertDescription>
            </Alert>
          ) : null}
          {rateLimitInfo ? <RateLimitAlert info={rateLimitInfo} secondsLeft={rateLimit.secondsLeft} /> : null}
          {error ? (
            <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          ) : null}
          <form onSubmit={handleSubmit} className="space-y-5">
            {lockedEmail ? (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Email nhận mã</p>
                <p className="mt-1 font-medium">{lockedEmail}</p>
              </div>
            ) : (
              <Field label="Email" error={fieldErrors.email}>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  placeholder="ban@example.com"
                  className="h-11 rounded-xl bg-white/90"
                />
              </Field>
            )}
            <Field label="Mã OTP" error={fieldErrors.token}>
              <Input
                inputMode="numeric"
                maxLength={6}
                value={token}
                onChange={(event) => setToken(event.target.value)}
                required
                placeholder="123456"
                className="h-11 rounded-xl bg-white/90 text-center tracking-[0.45em]"
              />
            </Field>
            <Field label="Mật khẩu mới" error={fieldErrors.newPassword}>
              <PasswordInput value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required autoComplete="new-password" />
            </Field>
            <Field label="Xác nhận mật khẩu mới" error={fieldErrors.confirmNewPassword}>
              <PasswordInput
                value={confirmNewPassword}
                onChange={(event) => setConfirmNewPassword(event.target.value)}
                required
                autoComplete="new-password"
              />
            </Field>
            <Button type="submit" loading={submitting} disabled={rateLimit.secondsLeft > 0} className="h-11 w-full rounded-xl">
              Cập nhật mật khẩu
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Separator />
          <div className="flex w-full items-center justify-between text-sm">
            <Link to="/login" className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Đăng nhập
            </Link>
            <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
              Gửi mã mới
            </Link>
          </div>
        </CardFooter>
      </Card>
    </main>
  )
}
