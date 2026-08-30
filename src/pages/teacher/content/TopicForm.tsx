import { useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import type { TeacherTopicRequest } from '../../../lib/api/types'

interface TopicFormProps {
  initialValue?: TeacherTopicRequest
  loading?: boolean
  disabled?: boolean
  submitLabel: string
  onSubmit: (payload: TeacherTopicRequest) => void
}

const defaultTopic: TeacherTopicRequest = {
  name: '',
  description: '',
  orderIndex: 0,
}

const fieldClassName =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

export function TopicForm({ initialValue, loading = false, disabled = false, submitLabel, onSubmit }: TopicFormProps) {
  const initialForm = initialValue ?? defaultTopic
  const [previousInitialValue, setPreviousInitialValue] = useState(initialValue)
  const [form, setForm] = useState<TeacherTopicRequest>(initialForm)
  const [orderIndexInput, setOrderIndexInput] = useState(String(initialForm.orderIndex))
  const [validationMessage, setValidationMessage] = useState('')

  if (initialValue !== previousInitialValue) {
    const nextForm = initialValue ?? defaultTopic
    setPreviousInitialValue(initialValue)
    setForm(nextForm)
    setOrderIndexInput(String(nextForm.orderIndex))
    setValidationMessage('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled) return

    const orderIndex = Number(orderIndexInput)

    if (!form.name.trim()) {
      setValidationMessage('Vui lòng nhập tên chủ đề.')
      return
    }

    if (!orderIndexInput.trim() || !Number.isFinite(orderIndex)) {
      setValidationMessage('Vui lòng nhập thứ tự hợp lệ.')
      return
    }

    setValidationMessage('')
    onSubmit({ ...form, orderIndex })
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-gray-700">
        Tên chủ đề
        <input
          className={fieldClassName}
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Mô tả
        <textarea
          className={fieldClassName}
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
        />
      </label>

      {validationMessage ? <p className="text-sm text-red-600">{validationMessage}</p> : null}

      <Button type="submit" loading={loading} disabled={disabled}>
        {submitLabel}
      </Button>
    </form>
  )
}
