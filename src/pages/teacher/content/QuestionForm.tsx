import { useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import type { TeacherQuestionOptionRequest, TeacherQuestionRequest } from '../../../lib/api/types'
import { questionTypeLabels, questionTypes } from './contentLabels'

interface QuestionFormProps {
  initialValue?: TeacherQuestionRequest
  loading?: boolean
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

export function QuestionForm({ initialValue, loading = false, submitLabel, onSubmit }: QuestionFormProps) {
  const initialForm = initialValue ?? defaultQuestion
  const [previousInitialValue, setPreviousInitialValue] = useState(initialValue)
  const [form, setForm] = useState<QuestionFormState>(toFormState(initialForm))
  const [orderIndexInput, setOrderIndexInput] = useState(String(initialForm.orderIndex))
  const [xpRewardInput, setXpRewardInput] = useState(String(initialForm.xpReward))
  const [trueFalseAnswer, setTrueFalseAnswer] = useState(getTrueFalseAnswer(initialForm))
  const [validationMessages, setValidationMessages] = useState<string[]>([])

  if (initialValue !== previousInitialValue) {
    const nextForm = initialValue ?? defaultQuestion
    setPreviousInitialValue(initialValue)
    setForm(toFormState(nextForm))
    setOrderIndexInput(String(nextForm.orderIndex))
    setXpRewardInput(String(nextForm.xpReward))
    setTrueFalseAnswer(getTrueFalseAnswer(nextForm))
    setValidationMessages([])
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextValidationMessages: string[] = []
    const orderIndex = Number(orderIndexInput)
    const xpReward = Number(xpRewardInput)

    if (!form.questionText.trim()) {
      nextValidationMessages.push('Vui lòng nhập câu hỏi.')
    }

    if (!orderIndexInput.trim() || !Number.isFinite(orderIndex)) {
      nextValidationMessages.push('Vui lòng nhập thứ tự hợp lệ.')
    }

    if (!xpRewardInput.trim() || !Number.isFinite(xpReward)) {
      nextValidationMessages.push('Vui lòng nhập XP hợp lệ.')
    } else if (xpReward < 0) {
      nextValidationMessages.push('XP không được nhỏ hơn 0.')
    }

    let options: TeacherQuestionOptionRequest[] = []
    let correctAnswer = form.correctAnswer

    if (form.type === 'MULTIPLE_CHOICE') {
      const nonEmptyOptions = form.options.filter((option) => option.optionText.trim())

      if (nonEmptyOptions.length < 2) {
        nextValidationMessages.push('Vui lòng nhập ít nhất 2 lựa chọn.')
      }

      if (!nonEmptyOptions.some((option) => option.correct)) {
        nextValidationMessages.push('Vui lòng chọn ít nhất 1 lựa chọn đúng.')
      }

      const hasInvalidOptionOrderIndex = form.options.some(
        (option) => !option.orderIndexInput.trim() || !Number.isFinite(Number(option.orderIndexInput)),
      )

      if (hasInvalidOptionOrderIndex) {
        nextValidationMessages.push('Vui lòng nhập thứ tự lựa chọn hợp lệ.')
      }

      options = nonEmptyOptions.map((option) => ({
        optionText: option.optionText,
        correct: option.correct,
        orderIndex: Number(option.orderIndexInput),
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
    <form className="space-y-3" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-gray-700">
        Loại câu hỏi
        <select
          className={fieldClassName}
          value={form.type}
          onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as TeacherQuestionRequest['type'] }))}
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

      <label className="block text-sm font-medium text-gray-700">
        Đáp án đúng
        <input
          className={fieldClassName}
          value={form.correctAnswer}
          onChange={(event) => setForm((current) => ({ ...current, correctAnswer: event.target.value }))}
        />
      </label>

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
        <input
          className={fieldClassName}
          value={form.difficulty}
          onChange={(event) => setForm((current) => ({ ...current, difficulty: event.target.value }))}
        />
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
          {form.options.map((option, optionIndex) => (
            <div className="grid gap-2 rounded-lg border border-gray-200 p-3 md:grid-cols-[1fr_auto_auto]" key={optionIndex}>
              <input
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
                  type="checkbox"
                  checked={option.correct}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      options: current.options.map((currentOption, currentIndex) =>
                        currentIndex === optionIndex ? { ...currentOption, correct: event.target.checked } : currentOption,
                      ),
                    }))
                  }
                />
                Đúng
              </label>
              <input
                className={fieldClassName}
                type="number"
                value={option.orderIndexInput}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    options: current.options.map((currentOption, currentIndex) =>
                      currentIndex === optionIndex ? { ...currentOption, orderIndexInput: event.target.value } : currentOption,
                    ),
                  }))
                }
              />
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
                options: [...current.options, { optionText: '', correct: false, orderIndexInput: String(current.options.length) }],
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
        <div className="space-y-1 text-sm text-red-600">
          {validationMessages.map((validationMessage) => (
            <p key={validationMessage}>{validationMessage}</p>
          ))}
        </div>
      ) : null}

      <Button type="submit" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  )
}
