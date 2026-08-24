import { useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import type { TeacherCourseRequest } from '../../../lib/api/types'
import { courseTypeLabels, courseTypes } from './contentLabels'

interface CourseFormProps {
  initialValue?: TeacherCourseRequest
  loading?: boolean
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

export function CourseForm({ initialValue, loading = false, submitLabel, onSubmit }: CourseFormProps) {
  const [form, setForm] = useState<TeacherCourseRequest>(initialValue ?? defaultCourse)
  const [validationMessage, setValidationMessage] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.name.trim() || !form.level.trim()) {
      setValidationMessage('Vui lòng nhập tên khóa học và cấp độ.')
      return
    }

    setValidationMessage('')
    onSubmit(form)
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
        <input
          className={fieldClassName}
          value={form.level}
          onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))}
        />
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Thứ tự
        <input
          className={fieldClassName}
          type="number"
          value={form.orderIndex}
          onChange={(event) => setForm((current) => ({ ...current, orderIndex: Number(event.target.value) }))}
        />
      </label>

      {validationMessage ? <p className="text-sm text-red-600">{validationMessage}</p> : null}

      <Button type="submit" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  )
}
