import { useId, useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/shadcn/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/shadcn/ui/field'
import { Input } from '@/components/shadcn/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn/ui/select'
import { Textarea } from '@/components/shadcn/ui/textarea'
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

function sameLessonValue(current: TeacherLessonRequest | undefined, next: TeacherLessonRequest | undefined) {
  const a = current ?? defaultLesson
  const b = next ?? defaultLesson
  return (
    a.title === b.title &&
    a.description === b.description &&
    a.content === b.content &&
    a.skillType === b.skillType &&
    a.orderIndex === b.orderIndex &&
    a.xpReward === b.xpReward &&
    a.placementTest === b.placementTest
  )
}

interface LessonValidation {
  field: 'title'
  message: string
}

export function LessonForm({ initialValue, loading = false, disabled = false, submitLabel, onSubmit }: LessonFormProps) {
  const initialForm = initialValue ?? defaultLesson
  const [previousInitialValue, setPreviousInitialValue] = useState(initialValue)
  const [form, setForm] = useState<TeacherLessonRequest>(initialForm)
  const [validation, setValidation] = useState<LessonValidation | null>(null)
  const fieldPrefix = useId()

  if (!sameLessonValue(initialValue, previousInitialValue)) {
    const nextForm = initialValue ?? defaultLesson
    setPreviousInitialValue(initialValue)
    setForm(nextForm)
    setValidation(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled) return

    if (!form.title.trim()) {
      setValidation({ field: 'title', message: 'Vui lòng nhập tiêu đề bài học.' })
      return
    }

    setValidation(null)
    onSubmit({ ...form })
  }

  const titleError = validation?.field === 'title' ? validation.message : undefined
  const titleErrorId = `${fieldPrefix}-title-error`

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup className="gap-3">
        <Field data-invalid={titleError ? true : undefined}>
          <FieldLabel htmlFor={`${fieldPrefix}-title`}>Tiêu đề bài học</FieldLabel>
          <Input
            id={`${fieldPrefix}-title`}
            value={form.title}
            disabled={disabled}
            aria-invalid={titleError ? true : undefined}
            aria-describedby={titleError ? titleErrorId : undefined}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
          {titleError ? <FieldError id={titleErrorId}>{titleError}</FieldError> : null}
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

        <Field>
          <FieldLabel htmlFor={`${fieldPrefix}-content`}>Nội dung</FieldLabel>
          <Textarea
            id={`${fieldPrefix}-content`}
            value={form.content}
            disabled={disabled}
            onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${fieldPrefix}-skill-type`}>Kỹ năng</FieldLabel>
          <Select
            value={form.skillType}
            disabled={disabled}
            onValueChange={(value) => setForm((current) => ({ ...current, skillType: value as TeacherLessonRequest['skillType'] }))}
          >
            <SelectTrigger id={`${fieldPrefix}-skill-type`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {skillTypes.map((skillType) => (
                <SelectItem key={skillType} value={skillType}>
                  {skillTypeLabels[skillType]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field orientation="horizontal">
          <input
            id={`${fieldPrefix}-placement-test`}
            type="checkbox"
            className="size-4 shrink-0 accent-indigo-600"
            checked={form.placementTest}
            disabled={disabled}
            onChange={(event) => setForm((current) => ({ ...current, placementTest: event.target.checked }))}
          />
          <FieldLabel htmlFor={`${fieldPrefix}-placement-test`}>Bài kiểm tra đầu vào</FieldLabel>
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
