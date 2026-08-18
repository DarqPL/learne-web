import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { confirmPasswordReset } from '../../lib/api/authApi'
import { getApiErrorMessage } from '../../lib/api/client'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { PasswordInput } from '../../components/ui/PasswordInput'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await confirmPasswordReset({ email, token, newPassword, confirmNewPassword })
      navigate('/login', { replace: true, state: { message: 'Đặt lại mật khẩu thành công, vui lòng đăng nhập.' } })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể đặt lại mật khẩu.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">Đặt lại mật khẩu</h1>
      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            placeholder="ban@example.com"
          />
        </Field>
        <Field label="Mã đặt lại mật khẩu">
          <Input value={token} onChange={(event) => setToken(event.target.value)} required placeholder="Mã trong email" />
        </Field>
        <Field label="Mật khẩu mới">
          <PasswordInput value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required autoComplete="new-password" />
        </Field>
        <Field label="Xác nhận mật khẩu mới">
          <PasswordInput
            value={confirmNewPassword}
            onChange={(event) => setConfirmNewPassword(event.target.value)}
            required
            autoComplete="new-password"
          />
        </Field>
        <Button type="submit" loading={submitting} className="w-full">
          Đặt lại mật khẩu
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        <Link to="/forgot-password" className="text-indigo-600 hover:underline">
          Yêu cầu mã mới
        </Link>
      </p>
    </Card>
  )
}