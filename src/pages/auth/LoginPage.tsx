import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { login } from '../../lib/api/authApi'
import { getApiErrorMessage } from '../../lib/api/client'
import { useAuth } from '../../lib/auth/auth-context'
import { homePathFor } from '../../lib/auth/routes'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { Alert, AlertDescription } from '../../components/shadcn/ui/alert'
import { Badge } from '../../components/shadcn/ui/badge'
import { Button } from '../../components/shadcn/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/shadcn/ui/card'
import { Separator } from '../../components/shadcn/ui/separator'
import { validateForm } from '../../lib/validation/validateForm'
import { email as emailValidator, required } from '../../lib/validation/validators'

const loginHighlights = ['Lộ trình học cá nhân hóa', 'Quiz theo từng bài học', 'Gợi ý kỹ năng cần cải thiện']

export function LoginPage() {
  const { login: setAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const message = (location.state as { message?: string } | null)?.message ?? null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const errors = validateForm(
      { email, password },
      {
        email: [required(), emailValidator()],
        password: [required()],
      },
    )
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setError(null)
    setSubmitting(true)
    try {
      const response = await login({ email, password })
      const { accessToken, expiresInSeconds, user } = response.data
      setAuth(accessToken, expiresInSeconds, user)
      navigate(user.mustChangePassword ? '/change-password?forced=1' : homePathFor(user.role), { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Đăng nhập thất bại. Vui lòng thử lại.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-2xl shadow-indigo-200/40 backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-[620px] overflow-hidden bg-slate-950 p-10 text-white lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,_rgba(129,140,248,0.45),_transparent_30%),radial-gradient(circle_at_78%_10%,_rgba(168,85,247,0.34),_transparent_28%),linear-gradient(145deg,_#020617_0%,_#1e1b4b_58%,_#312e81_100%)]" />
        <div className="absolute left-10 top-28 h-[28rem] w-[28rem] rounded-full border border-white/10" />
        <div className="absolute left-24 top-[10.5rem] h-[20rem] w-[20rem] rounded-full border border-indigo-300/20" />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <div>
            <Badge className="border-white/15 bg-white/10 text-indigo-50 hover:bg-white/10">
              <Sparkles className="h-3.5 w-3.5" />
              LearnE AI Platform
            </Badge>
            <h1 className="mt-8 max-w-md text-5xl font-semibold leading-tight tracking-tight">Học tiếng Anh theo đúng điểm yếu của bạn.</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-indigo-100/80">
              Đăng nhập để tiếp tục bài học, xem tiến độ và nhận lộ trình cá nhân hóa từ dữ liệu quiz thực tế.
            </p>
          </div>
          <div className="space-y-3">
            {loginHighlights.map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-indigo-50">
                <CheckCircle2 className="h-4 w-4 text-indigo-200" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="p-5 sm:p-8 lg:p-10">
        <Card className="border-0 bg-transparent py-0 shadow-none">
          <CardHeader className="px-0 pb-6">
            <Badge variant="outline" className="mb-2 w-fit border-indigo-200 bg-indigo-50 text-indigo-700">
              Đăng nhập học viên, giáo viên, quản trị
            </Badge>
            <CardTitle className="text-3xl font-bold tracking-tight text-gray-950">Chào mừng trở lại</CardTitle>
            <CardDescription className="text-base text-gray-600">Tiếp tục lộ trình học và quản lý nội dung trên LearnE.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {message ? (
              <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="text-green-800">{message}</AlertDescription>
              </Alert>
            ) : null}
            {error ? (
              <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            ) : null}
            <form onSubmit={handleSubmit} className="space-y-5">
              <Field label="Email" error={fieldErrors.email}>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ban@example.com"
                  autoComplete="email"
                  className="h-11 rounded-xl bg-white/90"
                />
              </Field>
              <Field label="Mật khẩu" error={fieldErrors.password}>
                <PasswordInput
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </Field>
              <Button type="submit" loading={submitting} className="h-11 w-full rounded-xl text-base shadow-lg shadow-indigo-200">
                Đăng nhập
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4 px-0 pt-6">
            <Separator />
            <div className="flex justify-between text-sm">
              <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
                Quên mật khẩu?
              </Link>
              <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
                Đăng ký tài khoản
              </Link>
            </div>
          </CardFooter>
        </Card>
      </section>
    </main>
  )
}
