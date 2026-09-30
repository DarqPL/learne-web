import { useId, useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/shadcn/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/shadcn/ui/field'
import { Input } from '@/components/shadcn/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn/ui/select'
import { Textarea } from '@/components/shadcn/ui/textarea'
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

const levelOptions = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

interface CourseValidation {
  field: 'name' | 'level'
  message: string
}

export function CourseForm({ initialValue, loading = false, disabled = false, submitLabel, onSubmit }: CourseFormProps) {
  const initialForm = initialValue ?? defaultCourse
  const [previousInitialValue, setPreviousInitialValue] = useState(initialValue)
  const [form, setForm] = useState<TeacherCourseRequest>(initialForm)
  const [validation, setValidation] = useState<CourseValidation | null>(null)
  const fieldPrefix = useId()

  if (initialValue !== previousInitialValue) {
    const nextForm = initialValue ?? defaultCourse
    setPreviousInitialValue(initialValue)
    setForm(nextForm)
    setValidation(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled) return

    if (!form.name.trim()) {
      setValidation({ field: 'name', message: 'Vui lòng nhập tên khóa học.' })
      return
    }

    if (!form.level.trim()) {
      setValidation({ field: 'level', message: 'Vui lòng chọn cấp độ.' })
      return
    }

    setValidation(null)
    onSubmit({ ...form })
  }

  const nameError = validation?.field === 'name' ? validation.message : undefined
  const levelError = validation?.field === 'level' ? validation.message : undefined
  const nameErrorId = `${fieldPrefix}-name-error`
  const levelErrorId = `${fieldPrefix}-level-error`

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup className="gap-3">
        <Field data-invalid={nameError ? true : undefined}>
          <FieldLabel htmlFor={`${fieldPrefix}-name`}>Tên khóa học</FieldLabel>
          <Input
            id={`${fieldPrefix}-name`}
            value={form.name}
            disabled={disabled}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? nameErrorId : undefined}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          {nameError ? <FieldError id={nameErrorId}>{nameError}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor={`${fieldPrefix}-description`}>Mô tả</FieldLabel>
          <Textarea
            id={`${fieldPrefix}-description`}
            value={form.description}
            disabled={disabled}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${fieldPrefix}-type`}>Loại khóa học</FieldLabel>
            <Select
              value={form.type}
              disabled={disabled}
              onValueChange={(value) => setForm((current) => ({ ...current, type: value as TeacherCourseRequest['type'] }))}
            >
              <SelectTrigger id={`${fieldPrefix}-type`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {courseTypes.map((courseType) => (
                  <SelectItem key={courseType} value={courseType}>
                    {courseTypeLabels[courseType]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field data-invalid={levelError ? true : undefined}>
            <FieldLabel htmlFor={`${fieldPrefix}-level`}>Cấp độ</FieldLabel>
            <Select value={form.level} disabled={disabled} onValueChange={(value) => setForm((current) => ({ ...current, level: value }))}>
              <SelectTrigger
                id={`${fieldPrefix}-level`}
                className="w-full"
                aria-invalid={levelError ? true : undefined}
                aria-describedby={levelError ? levelErrorId : undefined}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {levelOptions.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {levelError ? <FieldError id={levelErrorId}>{levelError}</FieldError> : null}
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" loading={loading} disabled={disabled}>
            <Save data-icon="inline-start" aria-hidden="true" />
            {submitLabel}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
