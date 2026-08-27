import { useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'

export interface RejectCourseFormProps {
  loading?: boolean
  disabled?: boolean
  onSubmit: (reason: string) => void
}

export function RejectCourseForm({ loading = false, disabled = false, onSubmit }: RejectCourseFormProps) {
  const [reason, setReason] = useState('')
  const [validation, setValidation] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (disabled || loading) return

    const trimmed = reason.trim()
    if (!trimmed) {
      setValidation('Vui lòng nhập lý do từ chối.')
      return
    }
    if (trimmed.length > 2000) {
      setValidation('Lý do từ chối tối đa 2000 ký tự.')
      return
    }

    setValidation(null)
    onSubmit(trimmed)
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-gray-700">
        Lý do từ chối
        <textarea
          className="mt-1 min-h-28 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={reason}
          maxLength={2000}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Nhập nội dung cần giảng viên chỉnh sửa trước khi gửi duyệt lại."
        />
      </label>
      {validation ? <div className="text-sm text-red-600">{validation}</div> : null}
      <Button type="submit" variant="danger" loading={loading} disabled={disabled}>
        Từ chối khóa học
      </Button>
    </form>
  )
}
