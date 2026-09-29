import { useId, useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/shadcn/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/shadcn/ui/field'
import { Input } from '@/components/shadcn/ui/input'
import { Textarea } from '@/components/shadcn/ui/textarea'
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

interface TopicValidation {
  field: 'name'
  message: string
}

export function TopicForm({ initialValue, loading = false, disabled = false, submitLabel, onSubmit }: TopicFormProps) {
  const initialForm = initialValue ?? defaultTopic
  const [previousInitialValue, setPreviousInitialValue] = useState(initialValue)
  const [form, setForm] = useState<TeacherTopicRequest>(initialForm)
  const [validation, setValidation] = useState<TopicValidation | null>(null)
  const fieldPrefix = useId()

  if (initialValue !== previousInitialValue) {
    const nextForm = initialValue ?? defaultTopic
    setPreviousInitialValue(initialValue)
    setForm(nextForm)
    setValidation(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled) return

    if (!form.name.trim()) {
      setValidation({ field: 'name', message: 'Vui lòng nhập tên chủ đề.' })
      return
    }

    setValidation(null)
    onSubmit({ ...form })
  }

  const nameError = validation?.field === 'name' ? validation.message : undefined
  const nameErrorId = `${fieldPrefix}-name-error`

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup className="gap-3">
        <Field data-invalid={nameError ? true : undefined}>
          <FieldLabel htmlFor={`${fieldPrefix}-name`}>Tên chủ đề</FieldLabel>
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
