import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../../lib/api/authApi'
import { getApiErrorMessage } from '../../lib/api/client'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await requestPasswordReset({ email })
      setInfo('Nếu email tồn tại, chúng tôi đã gửi mã đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể gửi yêu cầu đặt lại mật khẩu.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">Quên mật khẩu</h1>
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
        <Button type="submit" loading={submitting} className="w-full">
          Gửi yêu cầu
        </Button>
      </form>
      <div className="mt-4 flex items-center justify-between text-sm">
        <Link to="/login" className="text-indigo-600 hover:underline">
          Quay lại đăng nhập
        </Link>
        <Link to="/reset-password" className="text-indigo-600 hover:underline">
          Đã có mã? Đặt lại mật khẩu
        </Link>
      </div>
    </Card>
  )
}