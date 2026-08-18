import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { changePassword, logout } from '../../lib/api/authApi'
import { getApiErrorMessage } from '../../lib/api/client'
import { useAuth } from '../../lib/auth/auth-context'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field } from '../../components/ui/Field'
import { PasswordInput } from '../../components/ui/PasswordInput'

export function ChangePasswordPage() {
  const { logout: clearAuth } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const forced = searchParams.get('forced') === '1'
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await changePassword({ currentPassword, newPassword, confirmNewPassword })
      try {
        await logout()
      } catch {
        // refresh token đã bị thu hồi ở backend, bỏ qua lỗi
      }
      clearAuth()
      navigate('/login', { replace: true, state: { message: 'Đổi mật khẩu thành công, vui lòng đăng nhập lại.' } })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Đổi mật khẩu thất bại.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card>
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
          {forced ? 'Bắt buộc đổi mật khẩu' : 'Đổi mật khẩu'}
        </h1>
        {forced ? (
          <p className="mb-4 text-center text-sm text-gray-600">
            Bạn cần đổi mật khẩu trước khi sử dụng hệ thống.
          </p>
        ) : null}
        {error ? (
          <div className="mb-4">
            <Alert>{error}</Alert>
          </div>
        ) : null}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Mật khẩu hiện tại">
            <PasswordInput
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
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
          <p className="text-xs text-gray-500">Mật khẩu phải có ít nhất 8 ký tự, gồm cả chữ và số.</p>
          <Button type="submit" loading={submitting} className="w-full">
            {forced ? 'Đổi mật khẩu' : 'Cập nhật mật khẩu'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
