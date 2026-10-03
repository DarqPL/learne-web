import { useState, type FormEvent } from 'react'
import { Button } from '@/components/shadcn/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/shadcn/ui/field'
import { Textarea } from '@/components/shadcn/ui/textarea'

export interface RejectCourseFormProps {
  loading?: boolean
  disabled?: boolean
  onSubmit: (reason: string) => void
}

export function RejectCourseForm({ loading = false, disabled = false, onSubmit }: RejectCourseFormProps) {
  const [reason, setReason] = useState('')
  const [validation, setValidation] = useState<string | null>(null)
  const validationId = 'reject-course-reason-error'

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
    <form onSubmit={handleSubmit}>
      <Field data-invalid={validation ? true : undefined} data-disabled={disabled || loading ? true : undefined}>
        <FieldLabel htmlFor="reject-course-reason">Lý do từ chối</FieldLabel>
        <Textarea
          id="reject-course-reason"
          value={reason}
          maxLength={2000}
          aria-invalid={validation ? true : undefined}
          aria-describedby={validation ? validationId : undefined}
          disabled={disabled || loading}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Nhập nội dung cần giảng viên chỉnh sửa trước khi gửi duyệt lại."
        />
        {validation ? <FieldError id={validationId}>{validation}</FieldError> : null}
      </Field>
      <div className="mt-3">
        <Button type="submit" variant="destructive" loading={loading} disabled={disabled}>
          Từ chối khóa học
        </Button>
      </div>
    </form>
  )
}
