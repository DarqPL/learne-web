import { useState, type FormEvent } from 'react'
import { adminCreateTeacher } from '../../lib/api/authApi'
import { getApiErrorMessage } from '../../lib/api/client'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'

export function CreateTeacherPage() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)
    try {
      const response = await adminCreateTeacher({ email, fullName })
      setInfo(
        `Đã tạo tài khoản giảng viên ${response.data.fullName} (${response.data.email}). Mật khẩu tạm đã được gửi qua email.`,
      )
      setEmail('')
      setFullName('')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tạo tài khoản giảng viên.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Tạo tài khoản giảng viên</h1>
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
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <Field label="Họ và tên">
          <Input value={fullName} onChange={(event) => setFullName(event.target.value)} required autoComplete="off" />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="off"
            placeholder="giangvien@example.com"
          />
        </Field>
        <Button type="submit" loading={submitting} className="w-full">
          Tạo tài khoản
        </Button>
      </form>
    </div>
  )
}
