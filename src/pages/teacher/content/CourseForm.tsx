import { useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import type { TeacherCourseRequest } from '../../../lib/api/types'
import { courseTypeLabels, courseTypes } from './contentLabels'

interface CourseFormProps {
  initialValue?: TeacherCourseRequest
  loading?: boolean
  disabled?: boolean
  submitLabel: string
  onSubmit: (payload: TeacherCourseRequest) => void
}

const defaultCourse: TeacherCourseRequest = {
  name: '',
  description: '',
  type: 'COMPREHENSIVE',
  level: 'A1',
  orderIndex: 0,
}

const fieldClassName =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

const levelOptions = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export function CourseForm({ initialValue, loading = false, disabled = false, submitLabel, onSubmit }: CourseFormProps) {
  const initialForm = initialValue ?? defaultCourse
  const [previousInitialValue, setPreviousInitialValue] = useState(initialValue)
  const [form, setForm] = useState<TeacherCourseRequest>(initialForm)
  const [orderIndexInput, setOrderIndexInput] = useState(String(initialForm.orderIndex))
  const [validationMessage, setValidationMessage] = useState('')

  if (initialValue !== previousInitialValue) {
    const nextForm = initialValue ?? defaultCourse
    setPreviousInitialValue(initialValue)
    setForm(nextForm)
    setOrderIndexInput(String(nextForm.orderIndex))
    setValidationMessage('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled) return

    const orderIndex = Number(orderIndexInput)

    if (!form.name.trim() || !form.level.trim()) {
      setValidationMessage('Vui lòng nhập tên khóa học và cấp độ.')
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
        Tên khóa học
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

      <label className="block text-sm font-medium text-gray-700">
        Loại khóa học
        <select
          className={fieldClassName}
          value={form.type}
          onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as TeacherCourseRequest['type'] }))}
        >
          {courseTypes.map((courseType) => (
            <option key={courseType} value={courseType}>
              {courseTypeLabels[courseType]}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Cấp độ
        <select
          className={fieldClassName}
          value={form.level}
          onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))}
        >
          {levelOptions.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Thứ tự
        <input
          className={fieldClassName}
          type="number"
          value={orderIndexInput}
          onChange={(event) => setOrderIndexInput(event.target.value)}
        />
      </label>

      {validationMessage ? <p className="text-sm text-red-600">{validationMessage}</p> : null}

      <Button type="submit" loading={loading} disabled={disabled}>
        {submitLabel}
      </Button>
    </form>
  )
}
