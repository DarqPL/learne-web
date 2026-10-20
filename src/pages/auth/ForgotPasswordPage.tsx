import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { requestPasswordReset } from '../../lib/api/authApi'
import { getApiErrorMessage } from '../../lib/api/client'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { Alert, AlertDescription } from '../../components/shadcn/ui/alert'
import { Badge } from '../../components/shadcn/ui/badge'
import { Button } from '../../components/shadcn/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/shadcn/ui/card'
import { Separator } from '../../components/shadcn/ui/separator'
import { validateForm } from '../../lib/validation/validateForm'
import { email as emailValidator, required } from '../../lib/validation/validators'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const errors = validateForm({ email }, { email: [required(), emailValidator()] })
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setError(null)
    setSubmitting(true)
    try {
      await requestPasswordReset({ email })
      navigate('/reset-password', {
        state: {
          email,
          message: 'Nếu email hợp lệ, yêu cầu đặt lại mật khẩu đã được tiếp nhận. Vui lòng kiểm tra hộp thư và nhập mã bên dưới.',
        },
      })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể gửi yêu cầu đặt lại mật khẩu.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-md">
      <Card className="border-white/70 bg-white/90 shadow-2xl shadow-indigo-200/40 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <MailCheck className="h-7 w-7" />
          </div>
          <Badge variant="outline" className="mx-auto border-indigo-200 bg-indigo-50 text-indigo-700">
            Khôi phục quyền truy cập
          </Badge>
          <CardTitle className="text-2xl font-bold text-gray-950">Quên mật khẩu</CardTitle>
          <CardDescription>Nhập email tài khoản để nhận mã đặt lại mật khẩu.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          ) : null}
          <form onSubmit={handleSubmit} className="space-y-5">
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
            <Button type="submit" loading={submitting} className="h-11 w-full rounded-xl">
              Gửi mã đặt lại mật khẩu
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
            <Link to="/reset-password" className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
              Đã có mã?
            </Link>
          </div>
        </CardFooter>
      </Card>
    </main>
  )
}
