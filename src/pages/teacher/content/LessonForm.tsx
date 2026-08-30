import { useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import type { TeacherLessonRequest } from '../../../lib/api/types'
import { skillTypeLabels, skillTypes } from './contentLabels'

interface LessonFormProps {
  initialValue?: TeacherLessonRequest
  loading?: boolean
  disabled?: boolean
  submitLabel: string
  onSubmit: (payload: TeacherLessonRequest) => void
}

const defaultLesson: TeacherLessonRequest = {
  title: '',
  description: '',
  content: '',
  skillType: 'GRAMMAR',
  orderIndex: 0,
  xpReward: 0,
  placementTest: false,
}

const fieldClassName =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

export function LessonForm({ initialValue, loading = false, disabled = false, submitLabel, onSubmit }: LessonFormProps) {
  const initialForm = initialValue ?? defaultLesson
  const [previousInitialValue, setPreviousInitialValue] = useState(initialValue)
  const [form, setForm] = useState<TeacherLessonRequest>(initialForm)
  const [orderIndexInput, setOrderIndexInput] = useState(String(initialForm.orderIndex))
  const [xpRewardInput, setXpRewardInput] = useState(String(initialForm.xpReward))
  const [validationMessage, setValidationMessage] = useState('')

  if (initialValue !== previousInitialValue) {
    const nextForm = initialValue ?? defaultLesson
    setPreviousInitialValue(initialValue)
    setForm(nextForm)
    setOrderIndexInput(String(nextForm.orderIndex))
    setXpRewardInput(String(nextForm.xpReward))
    setValidationMessage('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled) return

    const orderIndex = Number(orderIndexInput)
    const xpReward = Number(xpRewardInput)

    if (!form.title.trim()) {
      setValidationMessage('Vui lòng nhập tiêu đề bài học.')
      return
    }

    if (!orderIndexInput.trim() || !Number.isFinite(orderIndex)) {
      setValidationMessage('Vui lòng nhập thứ tự hợp lệ.')
      return
    }

    if (!xpRewardInput.trim() || !Number.isFinite(xpReward)) {
      setValidationMessage('Vui lòng nhập XP hợp lệ.')
      return
    }

    if (xpReward < 0) {
      setValidationMessage('XP không được nhỏ hơn 0.')
      return
    }

    setValidationMessage('')
    onSubmit({ ...form, orderIndex, xpReward })
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-gray-700">
        Tiêu đề bài học
        <input
          className={fieldClassName}
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
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

      <label className="block text-sm font-medium text-gray-700">
        Nội dung
        <textarea
          className={fieldClassName}
          value={form.content}
          onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
        />
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Kỹ năng
        <select
          className={fieldClassName}
          value={form.skillType}
          onChange={(event) => setForm((current) => ({ ...current, skillType: event.target.value as TeacherLessonRequest['skillType'] }))}
        >
          {skillTypes.map((skillType) => (
            <option key={skillType} value={skillType}>
              {skillTypeLabels[skillType]}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-gray-700">
        XP
        <input
          className={fieldClassName}
          type="number"
          value={xpRewardInput}
          onChange={(event) => setXpRewardInput(event.target.value)}
        />
      </label>

      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          checked={form.placementTest}
          onChange={(event) => setForm((current) => ({ ...current, placementTest: event.target.checked }))}
        />
        Bài kiểm tra đầu vào
      </label>

      {validationMessage ? <p className="text-sm text-red-600">{validationMessage}</p> : null}

      <Button type="submit" loading={loading} disabled={disabled}>
        {submitLabel}
      </Button>
    </form>
  )
}
