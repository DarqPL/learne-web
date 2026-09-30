import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Plus, Save, TriangleAlert, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/ui/alert'
import { Button } from '@/components/shadcn/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/shadcn/ui/field'
import { Input } from '@/components/shadcn/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn/ui/select'
import { Textarea } from '@/components/shadcn/ui/textarea'
import type { TeacherQuestionOptionRequest, TeacherQuestionRequest } from '../../../lib/api/types'
import { questionTypeLabels, questionTypes } from './contentLabels'

export interface QuestionFormProps {
  initialValue?: TeacherQuestionRequest
  loading?: boolean
  disabled?: boolean
  submitLabel: string
  onSubmit: (payload: TeacherQuestionRequest) => void
}

const defaultQuestion: TeacherQuestionRequest = {
  type: 'MULTIPLE_CHOICE',
  questionText: '',
  explanation: '',
  correctAnswer: '',
  knowledgePoint: '',
  orderIndex: 0,
  difficulty: 'A1',
  xpReward: 0,
  options: [
    { optionText: '', correct: true, orderIndex: 0 },
    { optionText: '', correct: false, orderIndex: 1 },
  ],
}

const validationId = 'teacher-question-form-errors'

const nonNegativeIntegerPattern = /^\d+$/

const textAnswerQuestionTypes: TeacherQuestionRequest['type'][] = ['FILL_BLANK', 'WORD_ORDER', 'TRANSLATION', 'SHORT_ANSWER']

const difficultyOptions = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function usesTextAnswer(type: TeacherQuestionRequest['type']) {
  return textAnswerQuestionTypes.includes(type) || type === 'PRONUNCIATION'
}

function getCorrectAnswerLabel(type: TeacherQuestionRequest['type']) {
  return type === 'PRONUNCIATION' ? 'Mẫu phát âm / target text' : 'Đáp án đúng'
}

type QuestionOptionForm = TeacherQuestionOptionRequest

type QuestionFormState = Omit<TeacherQuestionRequest, 'xpReward' | 'options'> & {
  options: QuestionOptionForm[]
}

interface QuestionFieldErrors {
  questionText?: string
  correctAnswer?: string
  explanation?: string
  xpReward?: string
  options?: string
}

function toOptionForm(option: TeacherQuestionOptionRequest): QuestionOptionForm {
  return { optionText: option.optionText, correct: option.correct, orderIndex: option.orderIndex }
}

function toFormState(question: TeacherQuestionRequest): QuestionFormState {
  return { ...question, options: question.options.map(toOptionForm) }
}

function getTrueFalseAnswer(question: TeacherQuestionRequest) {
  const correctOption = question.options.find((option) => option.correct && (option.optionText === 'Đúng' || option.optionText === 'Sai'))

  if (correctOption) {
    return correctOption.optionText
  }

  return question.correctAnswer === 'Sai' ? 'Sai' : 'Đúng'
}

function isNonNegativeIntegerInput(value: string) {
  return nonNegativeIntegerPattern.test(value.trim())
}

function getNextOptionOrderIndex(options: QuestionOptionForm[]) {
  let maxOrderIndex = -1

  for (const option of options) {
    if (Number.isInteger(option.orderIndex) && option.orderIndex >= 0) {
      maxOrderIndex = Math.max(maxOrderIndex, option.orderIndex)
    }
  }

  return maxOrderIndex + 1
}

export function QuestionForm({ initialValue, loading = false, disabled = false, submitLabel, onSubmit }: QuestionFormProps) {
  const initialForm = initialValue ?? defaultQuestion
  const previousInitialValue = useRef(initialValue)
  const [form, setForm] = useState<QuestionFormState>(toFormState(initialForm))
  const [xpRewardInput, setXpRewardInput] = useState(String(initialForm.xpReward))
  const [trueFalseAnswer, setTrueFalseAnswer] = useState(getTrueFalseAnswer(initialForm))
  const [validationMessages, setValidationMessages] = useState<string[]>([])
  const [fieldErrors, setFieldErrors] = useState<QuestionFieldErrors>({})
  const fieldPrefix = useId()

  useEffect(() => {
    if (initialValue === previousInitialValue.current) return

    previousInitialValue.current = initialValue

    const nextForm = initialValue ?? defaultQuestion
    let cancelled = false

    queueMicrotask(() => {
      if (cancelled) return
      setForm(toFormState(nextForm))
      setXpRewardInput(String(nextForm.xpReward))
      setTrueFalseAnswer(getTrueFalseAnswer(nextForm))
      setValidationMessages([])
      setFieldErrors({})
    })

    return () => {
      cancelled = true
    }
  }, [initialValue])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled) return

    const nextValidationMessages: string[] = []
    const nextFieldErrors: QuestionFieldErrors = {}
    const trimmedXpRewardInput = xpRewardInput.trim()
    const xpReward = Number(trimmedXpRewardInput)

    if (!form.questionText.trim()) {
      const message = 'Vui lòng nhập câu hỏi.'
      nextValidationMessages.push(message)
      nextFieldErrors.questionText = message
    }

    if (!isNonNegativeIntegerInput(trimmedXpRewardInput)) {
      const message = 'Vui lòng nhập XP hợp lệ.'
      nextValidationMessages.push(message)
      nextFieldErrors.xpReward = message
    }

    if (usesTextAnswer(form.type) && !form.correctAnswer.trim()) {
      const message = form.type === 'PRONUNCIATION' ? 'Vui lòng nhập mẫu phát âm.' : 'Vui lòng nhập đáp án đúng.'
      nextValidationMessages.push(message)
      nextFieldErrors.correctAnswer = message
    }

    let options: TeacherQuestionOptionRequest[] = []
    let correctAnswer = form.correctAnswer

    if (form.type === 'MULTIPLE_CHOICE') {
      correctAnswer = ''

      const nonEmptyOptions = form.options.filter((option) => option.optionText.trim() !== '')

      if (nonEmptyOptions.length < 2) {
        const message = 'Vui lòng nhập ít nhất 2 lựa chọn.'
        nextValidationMessages.push(message)
        if (!nextFieldErrors.options) nextFieldErrors.options = message
      }

      const correctOptions = nonEmptyOptions.filter((option) => option.correct)

      if (correctOptions.length !== 1) {
        const message = 'Vui lòng chọn đúng 1 lựa chọn đúng.'
        nextValidationMessages.push(message)
        if (!nextFieldErrors.options) nextFieldErrors.options = message
      }

      options = nonEmptyOptions.map((option) => ({
        optionText: option.optionText.trim(),
        correct: option.correct,
        orderIndex: option.orderIndex,
      }))
    } else if (form.type === 'TRUE_FALSE') {
      correctAnswer = trueFalseAnswer
      options = [
        { optionText: 'Đúng', correct: trueFalseAnswer === 'Đúng', orderIndex: 0 },
        { optionText: 'Sai', correct: trueFalseAnswer === 'Sai', orderIndex: 1 },
      ]
    }

    if (nextValidationMessages.length > 0) {
      setValidationMessages(nextValidationMessages)
      setFieldErrors(nextFieldErrors)
      return
    }

    setValidationMessages([])
    setFieldErrors({})
    onSubmit({ ...form, correctAnswer, orderIndex: form.orderIndex, xpReward, options })
  }

  const questionTextError = fieldErrors.questionText
  const correctAnswerError = fieldErrors.correctAnswer
  const explanationError = fieldErrors.explanation
  const xpRewardError = fieldErrors.xpReward
  const optionsError = fieldErrors.options
  const questionTextErrorId = `${fieldPrefix}-question-text-error`
  const correctAnswerErrorId = `${fieldPrefix}-correct-answer-error`
  const explanationErrorId = `${fieldPrefix}-explanation-error`
  const xpRewardErrorId = `${fieldPrefix}-xp-error`
  const optionsErrorId = `${fieldPrefix}-options-error`

  return (
    <form aria-describedby={validationMessages.length > 0 ? validationId : undefined} onSubmit={handleSubmit}>
      <FieldGroup className="gap-3">
        <Field>
          <FieldLabel htmlFor={`${fieldPrefix}-type`}>Loại câu hỏi</FieldLabel>
          <Select
            value={form.type}
            disabled={disabled}
            onValueChange={(value) => {
              const nextType = value as TeacherQuestionRequest['type']
              setForm((current) => ({
                ...current,
                type: nextType,
                correctAnswer: usesTextAnswer(nextType) ? current.correctAnswer : '',
              }))
            }}
          >
            <SelectTrigger id={`${fieldPrefix}-type`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {questionTypes.map((questionType) => (
                <SelectItem key={questionType} value={questionType}>
                  {questionTypeLabels[questionType]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field data-invalid={questionTextError ? true : undefined}>
          <FieldLabel htmlFor={`${fieldPrefix}-question-text`}>Câu hỏi</FieldLabel>
          <Textarea
            id={`${fieldPrefix}-question-text`}
            value={form.questionText}
            disabled={disabled}
            aria-invalid={questionTextError ? true : undefined}
            aria-describedby={questionTextError ? questionTextErrorId : undefined}
            onChange={(event) => setForm((current) => ({ ...current, questionText: event.target.value }))}
          />
          {questionTextError ? <FieldError id={questionTextErrorId}>{questionTextError}</FieldError> : null}
        </Field>

        {usesTextAnswer(form.type) ? (
          <Field data-invalid={correctAnswerError ? true : undefined}>
            <FieldLabel htmlFor={`${fieldPrefix}-correct-answer`}>{getCorrectAnswerLabel(form.type)}</FieldLabel>
            <Input
              id={`${fieldPrefix}-correct-answer`}
              value={form.correctAnswer}
              disabled={disabled}
              aria-invalid={correctAnswerError ? true : undefined}
              aria-describedby={correctAnswerError ? correctAnswerErrorId : undefined}
              onChange={(event) => setForm((current) => ({ ...current, correctAnswer: event.target.value }))}
            />
            {correctAnswerError ? <FieldError id={correctAnswerErrorId}>{correctAnswerError}</FieldError> : null}
          </Field>
        ) : null}

        <Field data-invalid={explanationError ? true : undefined}>
          <FieldLabel htmlFor={`${fieldPrefix}-explanation`}>Giải thích</FieldLabel>
          <Textarea
            id={`${fieldPrefix}-explanation`}
            value={form.explanation}
            disabled={disabled}
            aria-invalid={explanationError ? true : undefined}
            aria-describedby={explanationError ? explanationErrorId : undefined}
            onChange={(event) => setForm((current) => ({ ...current, explanation: event.target.value }))}
          />
          {explanationError ? <FieldError id={explanationErrorId}>{explanationError}</FieldError> : null}
        </Field>

        <div className="grid gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor={`${fieldPrefix}-knowledge-point`}>Điểm kiến thức</FieldLabel>
            <Input
              id={`${fieldPrefix}-knowledge-point`}
              className="bg-white"
              value={form.knowledgePoint}
              disabled={disabled}
              onChange={(event) => setForm((current) => ({ ...current, knowledgePoint: event.target.value }))}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor={`${fieldPrefix}-difficulty`}>Độ khó</FieldLabel>
            <Select value={form.difficulty} disabled={disabled} onValueChange={(value) => setForm((current) => ({ ...current, difficulty: value }))}>
              <SelectTrigger id={`${fieldPrefix}-difficulty`} className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {difficultyOptions.map((difficulty) => (
                  <SelectItem key={difficulty} value={difficulty}>
                    {difficulty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field data-invalid={xpRewardError ? true : undefined}>
            <FieldLabel htmlFor={`${fieldPrefix}-xp`}>XP</FieldLabel>
            <Input
              id={`${fieldPrefix}-xp`}
              className="bg-white"
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

        {form.type === 'MULTIPLE_CHOICE' ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-indigo-900/70">
              Trắc nghiệm nhiều lựa chọn, hiện chỉ hỗ trợ một đáp án đúng. Tích vào ô tròn để chọn đáp án đúng.
            </p>
            {form.options.map((option, optionIndex) => (
              <div className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-white px-2 py-1.5" key={optionIndex}>
                <input
                  type="radio"
                  name={`${fieldPrefix}-multiple-choice-correct-option`}
                  checked={option.correct}
                  onChange={() =>
                    setForm((current) => ({
                      ...current,
                      options: current.options.map((currentOption, currentIndex) =>
                        currentIndex === optionIndex
                          ? { ...currentOption, correct: true }
                          : { ...currentOption, correct: false },
                      ),
                    }))
                  }
                  aria-label={`Đánh dấu lựa chọn ${optionIndex + 1} là đáp án đúng`}
                  title="Đáp án đúng"
                  className="size-4 shrink-0 accent-indigo-600"
                />
                <Input
                  aria-label={`Nội dung lựa chọn ${optionIndex + 1}`}
                  className="min-w-0 flex-1 border-indigo-100 py-1.5"
                  value={option.optionText}
                  disabled={disabled}
                  placeholder={`Lựa chọn ${optionIndex + 1}`}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      options: current.options.map((currentOption, currentIndex) =>
                        currentIndex === optionIndex ? { ...currentOption, optionText: event.target.value } : currentOption,
                      ),
                    }))
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8 shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  aria-label={`Xóa lựa chọn ${optionIndex + 1}`}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      options: current.options.filter((_, currentIndex) => currentIndex !== optionIndex),
                    }))
                  }
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
            ))}

            <div>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    options: [...current.options, { optionText: '', correct: false, orderIndex: getNextOptionOrderIndex(current.options) }],
                  }))
                }
              >
                <Plus data-icon="inline-start" aria-hidden="true" />
                Thêm lựa chọn
              </Button>
            </div>
            {optionsError ? <FieldError id={optionsErrorId}>{optionsError}</FieldError> : null}
          </div>
        ) : null}

        {form.type === 'TRUE_FALSE' ? (
          <FieldGroup className="gap-2">
            <Field orientation="horizontal">
              <input
                type="radio"
                id={`${fieldPrefix}-true`}
                name={`${fieldPrefix}-true-false-answer`}
                value="Đúng"
                checked={trueFalseAnswer === 'Đúng'}
                onChange={() => setTrueFalseAnswer('Đúng')}
                className="size-4 shrink-0 accent-emerald-600"
              />
              <FieldLabel htmlFor={`${fieldPrefix}-true`}>Đúng</FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <input
                type="radio"
                id={`${fieldPrefix}-false`}
                name={`${fieldPrefix}-true-false-answer`}
                value="Sai"
                checked={trueFalseAnswer === 'Sai'}
                onChange={() => setTrueFalseAnswer('Sai')}
                className="size-4 shrink-0 accent-red-500"
              />
              <FieldLabel htmlFor={`${fieldPrefix}-false`}>Sai</FieldLabel>
            </Field>
          </FieldGroup>
        ) : null}

        {validationMessages.length > 0 ? (
          <Alert id={validationId} variant="destructive">
            <TriangleAlert aria-hidden="true" />
            <AlertTitle>Không thể lưu câu hỏi</AlertTitle>
            <AlertDescription>
              <ul className="list-disc space-y-1 pl-4">
                {validationMessages.map((validationMessage) => (
                  <li key={validationMessage}>{validationMessage}</li>
                ))}
              </ul>
            </AlertDescription>
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
