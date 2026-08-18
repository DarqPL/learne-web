import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../../lib/api/authApi'
import { getApiErrorMessage } from '../../lib/api/client'
import { useAuth } from '../../lib/auth/auth-context'
import { homePathFor } from '../../lib/auth/routes'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { PasswordInput } from '../../components/ui/PasswordInput'

export function LoginPage() {
  const { login: setAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const message = (location.state as { message?: string } | null)?.message ?? null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
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
    <Card>
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">Đăng nhập</h1>
      {message ? (
        <div className="mb-4">
          <Alert variant="success">{message}</Alert>
        </div>
      ) : null}
      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email">
          <Input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ban@example.com"
            autoComplete="email"
          />
        </Field>
        <Field label="Mật khẩu">
          <PasswordInput
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </Field>
        <Button type="submit" loading={submitting} className="w-full">
          Đăng nhập
        </Button>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <Link to="/forgot-password" className="text-indigo-600 hover:underline">
          Quên mật khẩu?
        </Link>
        <Link to="/register" className="text-indigo-600 hover:underline">
          Đăng ký
        </Link>
      </div>
    </Card>
  )
}
