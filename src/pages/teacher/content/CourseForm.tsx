import { useId, useState, type FormEvent } from 'react'
import { Save, TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/ui/alert'
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
  field: 'name' | 'orderIndex'
  message: string
}

export function CourseForm({ initialValue, loading = false, disabled = false, submitLabel, onSubmit }: CourseFormProps) {
  const initialForm = initialValue ?? defaultCourse
  const [previousInitialValue, setPreviousInitialValue] = useState(initialValue)
  const [form, setForm] = useState<TeacherCourseRequest>(initialForm)
  const [orderIndexInput, setOrderIndexInput] = useState(String(initialForm.orderIndex))
  const [validation, setValidation] = useState<CourseValidation | null>(null)
  const fieldPrefix = useId()

  if (initialValue !== previousInitialValue) {
    const nextForm = initialValue ?? defaultCourse
    setPreviousInitialValue(initialValue)
    setForm(nextForm)
    setOrderIndexInput(String(nextForm.orderIndex))
    setValidation(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled) return

    const orderIndex = Number(orderIndexInput)

    if (!form.name.trim() || !form.level.trim()) {
      setValidation({ field: 'name', message: 'Vui lòng nhập tên khóa học và cấp độ.' })
      return
    }

    if (!orderIndexInput.trim() || !Number.isFinite(orderIndex)) {
      setValidation({ field: 'orderIndex', message: 'Vui lòng nhập thứ tự hợp lệ.' })
      return
    }

    setValidation(null)
    onSubmit({ ...form, orderIndex })
  }

  const nameError = validation?.field === 'name' ? validation.message : undefined
  const orderIndexError = validation?.field === 'orderIndex' ? validation.message : undefined

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup className="gap-3">
        <Field data-invalid={nameError ? true : undefined}>
          <FieldLabel htmlFor={`${fieldPrefix}-name`}>Tên khóa học</FieldLabel>
          <Input
            id={`${fieldPrefix}-name`}
            value={form.name}
            aria-invalid={nameError ? true : undefined}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          {nameError ? <FieldError>{nameError}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor={`${fieldPrefix}-description`}>Mô tả</FieldLabel>
          <Textarea
            id={`${fieldPrefix}-description`}
            value={form.description}
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

          <Field data-invalid={nameError ? true : undefined}>
            <FieldLabel htmlFor={`${fieldPrefix}-level`}>Cấp độ</FieldLabel>
            <Select value={form.level} disabled={disabled} onValueChange={(value) => setForm((current) => ({ ...current, level: value }))}>
              <SelectTrigger id={`${fieldPrefix}-level`} className="w-full" aria-invalid={nameError ? true : undefined}>
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
          </Field>
        </div>

        {orderIndexError ? (
          <Alert variant="destructive">
            <TriangleAlert aria-hidden="true" />
            <AlertTitle>Không thể lưu</AlertTitle>
            <AlertDescription>{orderIndexError}</AlertDescription>
          </Alert>
        ) : null}

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
