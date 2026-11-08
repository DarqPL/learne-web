import type { MistakeReviewQuestion } from '../../../lib/api/types'
import { Alert, AlertDescription } from '../../../components/shadcn/ui/alert'
import { Badge } from '../../../components/shadcn/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/shadcn/ui/card'
import { Textarea } from '../../../components/shadcn/ui/textarea'
import { studentQuestionTypeLabels } from '../learning/studentLearningLabels'
import {
  getQuestionTypePrompt,
  hasInvalidQuestionData,
  isOptionQuestion,
  type MistakeReviewAnswerState,
} from './mistakeReviewUtils'

type MistakeReviewQuestionCardProps = {
  question: MistakeReviewQuestion
  answer: MistakeReviewAnswerState[number]
  onChange: (answer: MistakeReviewAnswerState[number]) => void
}

export function MistakeReviewQuestionCard({ question, answer, onChange }: MistakeReviewQuestionCardProps) {
  const context = [question.courseName, question.lessonTitle].filter(Boolean).join(' · ')
  const optionQuestion = isOptionQuestion(question)
  const invalid = hasInvalidQuestionData(question)

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{studentQuestionTypeLabels[question.questionType] ?? question.questionType}</Badge>
          {context ? <span className="text-sm text-slate-500">{context}</span> : null}
        </div>
        <CardTitle className="whitespace-pre-wrap text-xl leading-8 text-slate-950">
          {question.questionText}
        </CardTitle>
        <p className="text-sm text-slate-600">{getQuestionTypePrompt(question.questionType, question.options.length)}</p>
      </CardHeader>

      <CardContent className="space-y-3">
        {invalid ? (
          <Alert variant="destructive">
            <AlertDescription>Câu hỏi này không có đáp án để chọn.</AlertDescription>
          </Alert>
        ) : optionQuestion ? (
          question.options.map((option) => {
            const inputId = `mistake-review-option-${question.questionId}-${option.id}`
            return (
              <label
                key={option.id}
                htmlFor={inputId}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
              >
                <input
                  id={inputId}
                  type="radio"
                  name={`mistake-review-question-${question.questionId}`}
                  checked={answer.selectedOptionId === option.id}
                  onChange={() => onChange({ answerText: '', selectedOptionId: option.id })}
                  className="mt-1 size-4 accent-indigo-600"
                />
                <span className="text-sm leading-6 text-slate-800">{option.text}</span>
              </label>
            )
          })
        ) : (
          <div className="space-y-2">
            <label htmlFor={`mistake-review-answer-${question.questionId}`} className="text-sm font-medium text-slate-700">
              Câu trả lời của bạn
            </label>
            <Textarea
              id={`mistake-review-answer-${question.questionId}`}
              value={answer.answerText}
              onChange={(event) => onChange({ answerText: event.target.value, selectedOptionId: null })}
              placeholder="Nhập câu trả lời..."
              rows={4}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
