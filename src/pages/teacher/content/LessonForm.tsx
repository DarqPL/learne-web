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

interface LessonValidation {
  field: 'title' | 'xpReward'
  message: string
}

export function LessonForm({ initialValue, loading = false, disabled = false, submitLabel, onSubmit }: LessonFormProps) {
  const initialForm = initialValue ?? defaultLesson
  const [previousInitialValue, setPreviousInitialValue] = useState(initialValue)
  const [form, setForm] = useState<TeacherLessonRequest>(initialForm)
  const [xpRewardInput, setXpRewardInput] = useState(String(initialForm.xpReward))
  const [validation, setValidation] = useState<LessonValidation | null>(null)
  const fieldPrefix = useId()

  if (initialValue !== previousInitialValue) {
    const nextForm = initialValue ?? defaultLesson
    setPreviousInitialValue(initialValue)
    setForm(nextForm)
    setXpRewardInput(String(nextForm.xpReward))
    setValidation(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled) return

    const xpReward = Number(xpRewardInput)

    if (!form.title.trim()) {
      setValidation({ field: 'title', message: 'Vui lòng nhập tiêu đề bài học.' })
      return
    }

    if (!xpRewardInput.trim() || !Number.isFinite(xpReward)) {
      setValidation({ field: 'xpReward', message: 'Vui lòng nhập XP hợp lệ.' })
      return
    }

    if (xpReward < 0) {
      setValidation({ field: 'xpReward', message: 'XP không được nhỏ hơn 0.' })
      return
    }

    setValidation(null)
    onSubmit({ ...form, xpReward })
  }

  const titleError = validation?.field === 'title' ? validation.message : undefined
  const xpRewardError = validation?.field === 'xpReward' ? validation.message : undefined
  const titleErrorId = `${fieldPrefix}-title-error`
  const xpRewardErrorId = `${fieldPrefix}-xp-error`

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

        <div className="grid gap-3 sm:grid-cols-2">
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

          <Field data-invalid={xpRewardError ? true : undefined}>
            <FieldLabel htmlFor={`${fieldPrefix}-xp`}>XP</FieldLabel>
            <Input
              id={`${fieldPrefix}-xp`}
              type="number"
              value={xpRewardInput}
              disabled={disabled}
              aria-invalid={xpRewardError ? true : undefined}
              aria-describedby={xpRewardError ? xpRewardErrorId : undefined}
              onChange={(event) => setXpRewardInput(event.target.value)}
            />
            {xpRewardError ? <FieldError id={xpRewardErrorId}>{xpRewardError}</FieldError> : null}
          </Field>
        </div>

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
