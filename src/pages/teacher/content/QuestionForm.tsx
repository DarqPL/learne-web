import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
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

const fieldClassName =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

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

type QuestionOptionForm = Omit<TeacherQuestionOptionRequest, 'orderIndex'> & {
  orderIndexInput: string
}

type QuestionFormState = Omit<TeacherQuestionRequest, 'orderIndex' | 'xpReward' | 'options'> & {
  options: QuestionOptionForm[]
}

function toOptionForm(option: TeacherQuestionOptionRequest): QuestionOptionForm {
  return { optionText: option.optionText, correct: option.correct, orderIndexInput: String(option.orderIndex) }
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
    const orderIndexInput = option.orderIndexInput.trim()

    if (isNonNegativeIntegerInput(orderIndexInput)) {
      maxOrderIndex = Math.max(maxOrderIndex, Number(orderIndexInput))
    }
  }

  return String(maxOrderIndex + 1)
}

export function QuestionForm({ initialValue, loading = false, disabled = false, submitLabel, onSubmit }: QuestionFormProps) {
  const initialForm = initialValue ?? defaultQuestion
  const previousInitialValue = useRef(initialValue)
  const [form, setForm] = useState<QuestionFormState>(toFormState(initialForm))
  const [orderIndexInput, setOrderIndexInput] = useState(String(initialForm.orderIndex))
  const [xpRewardInput, setXpRewardInput] = useState(String(initialForm.xpReward))
  const [trueFalseAnswer, setTrueFalseAnswer] = useState(getTrueFalseAnswer(initialForm))
  const [validationMessages, setValidationMessages] = useState<string[]>([])

  useEffect(() => {
    if (initialValue === previousInitialValue.current) return

    previousInitialValue.current = initialValue

    const nextForm = initialValue ?? defaultQuestion
    let cancelled = false

    queueMicrotask(() => {
      if (cancelled) return
      setForm(toFormState(nextForm))
      setOrderIndexInput(String(nextForm.orderIndex))
      setXpRewardInput(String(nextForm.xpReward))
      setTrueFalseAnswer(getTrueFalseAnswer(nextForm))
      setValidationMessages([])
    })

    return () => {
      cancelled = true
    }
  }, [initialValue])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled) return

    const nextValidationMessages: string[] = []
    const trimmedOrderIndexInput = orderIndexInput.trim()
    const trimmedXpRewardInput = xpRewardInput.trim()
    const orderIndex = Number(trimmedOrderIndexInput)
    const xpReward = Number(trimmedXpRewardInput)

    if (!form.questionText.trim()) {
      nextValidationMessages.push('Vui lòng nhập câu hỏi.')
    }

    if (!isNonNegativeIntegerInput(trimmedOrderIndexInput)) {
      nextValidationMessages.push('Vui lòng nhập thứ tự hợp lệ.')
    }

    if (!isNonNegativeIntegerInput(trimmedXpRewardInput)) {
      nextValidationMessages.push('Vui lòng nhập XP hợp lệ.')
    }

    if (usesTextAnswer(form.type) && !form.correctAnswer.trim()) {
      nextValidationMessages.push(
        form.type === 'PRONUNCIATION' ? 'Vui lòng nhập mẫu phát âm.' : 'Vui lòng nhập đáp án đúng.',
      )
    }

    let options: TeacherQuestionOptionRequest[] = []
    let correctAnswer = form.correctAnswer

    if (form.type === 'MULTIPLE_CHOICE') {
      correctAnswer = ''

      const nonEmptyOptions = form.options.filter((option) => option.optionText.trim() !== '')

      if (nonEmptyOptions.length < 2) {
        nextValidationMessages.push('Vui lòng nhập ít nhất 2 lựa chọn.')
      }

      const correctOptions = nonEmptyOptions.filter((option) => option.correct)

      if (correctOptions.length !== 1) {
        nextValidationMessages.push('Vui lòng chọn đúng 1 lựa chọn đúng.')
      }

      const hasInvalidOptionOrderIndex = nonEmptyOptions.some((option) => !isNonNegativeIntegerInput(option.orderIndexInput))

      if (hasInvalidOptionOrderIndex) {
        nextValidationMessages.push('Vui lòng nhập thứ tự lựa chọn hợp lệ.')
      }

      options = nonEmptyOptions.map((option) => ({
        optionText: option.optionText.trim(),
        correct: option.correct,
        orderIndex: Number(option.orderIndexInput.trim()),
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
      return
    }

    setValidationMessages([])
    onSubmit({ ...form, correctAnswer, orderIndex, xpReward, options })
  }

  return (
    <form className="space-y-3" aria-describedby={validationMessages.length > 0 ? validationId : undefined} onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-gray-700">
        Loại câu hỏi
        <select
          className={fieldClassName}
          value={form.type}
          onChange={(event) => {
            const nextType = event.target.value as TeacherQuestionRequest['type']
            setForm((current) => ({
              ...current,
              type: nextType,
              correctAnswer: usesTextAnswer(nextType) ? current.correctAnswer : '',
            }))
          }}
        >
          {questionTypes.map((questionType) => (
            <option key={questionType} value={questionType}>
              {questionTypeLabels[questionType]}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Câu hỏi
        <textarea
          className={fieldClassName}
          value={form.questionText}
          onChange={(event) => setForm((current) => ({ ...current, questionText: event.target.value }))}
        />
      </label>

      {usesTextAnswer(form.type) ? (
        <label className="block text-sm font-medium text-gray-700">
          {getCorrectAnswerLabel(form.type)}
          <input
            className={fieldClassName}
            value={form.correctAnswer}
            onChange={(event) => setForm((current) => ({ ...current, correctAnswer: event.target.value }))}
          />
        </label>
      ) : null}

      <label className="block text-sm font-medium text-gray-700">
        Giải thích
        <textarea
          className={fieldClassName}
          value={form.explanation}
          onChange={(event) => setForm((current) => ({ ...current, explanation: event.target.value }))}
        />
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Điểm kiến thức
        <input
          className={fieldClassName}
          value={form.knowledgePoint}
          onChange={(event) => setForm((current) => ({ ...current, knowledgePoint: event.target.value }))}
        />
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Độ khó
        <select
          className={fieldClassName}
          value={form.difficulty}
          onChange={(event) => setForm((current) => ({ ...current, difficulty: event.target.value }))}
        >
          {difficultyOptions.map((difficulty) => (
            <option key={difficulty} value={difficulty}>
              {difficulty}
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

      {form.type === 'MULTIPLE_CHOICE' ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Trắc nghiệm nhiều lựa chọn, hiện chỉ hỗ trợ một đáp án đúng.</p>
          {form.options.map((option, optionIndex) => (
            <div className="grid gap-2 rounded-lg border border-gray-200 p-3 md:grid-cols-[1fr_auto]" key={optionIndex}>
              <input
                aria-label={`Nội dung lựa chọn ${optionIndex + 1}`}
                className={fieldClassName}
                value={option.optionText}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    options: current.options.map((currentOption, currentIndex) =>
                      currentIndex === optionIndex ? { ...currentOption, optionText: event.target.value } : currentOption,
                    ),
                  }))
                }
              />
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="radio"
                  name="multipleChoiceCorrectOption"
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
                />
                Đúng
              </label>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    options: current.options.filter((_, currentIndex) => currentIndex !== optionIndex),
                  }))
                }
              >
                Xóa
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setForm((current) => ({
                ...current,
                options: [...current.options, { optionText: '', correct: false, orderIndexInput: getNextOptionOrderIndex(current.options) }],
              }))
            }
          >
            Thêm lựa chọn
          </Button>
        </div>
      ) : null}

      {form.type === 'TRUE_FALSE' ? (
        <div className="space-y-2 text-sm font-medium text-gray-700">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="trueFalseAnswer"
              value="Đúng"
              checked={trueFalseAnswer === 'Đúng'}
              onChange={() => setTrueFalseAnswer('Đúng')}
            />
            Đúng
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="trueFalseAnswer"
              value="Sai"
              checked={trueFalseAnswer === 'Sai'}
              onChange={() => setTrueFalseAnswer('Sai')}
            />
            Sai
          </label>
        </div>
      ) : null}

      {validationMessages.length > 0 ? (
        <div id={validationId} className="space-y-1 text-sm text-red-600" role="alert">
          {validationMessages.map((validationMessage) => (
            <p key={validationMessage}>{validationMessage}</p>
          ))}
        </div>
      ) : null}

      <Button type="submit" loading={loading} disabled={disabled}>
        {submitLabel}
      </Button>
    </form>
  )
}
