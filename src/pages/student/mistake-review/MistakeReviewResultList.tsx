import type { MistakeReviewAnswerResult, MistakeReviewQuestion } from '../../../lib/api/types'
import { Badge } from '../../../components/shadcn/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/shadcn/ui/card'

type MistakeReviewResultListProps = {
  questions: MistakeReviewQuestion[]
  answers: MistakeReviewAnswerResult[]
}

export function MistakeReviewResultList({ questions, answers }: MistakeReviewResultListProps) {
  const questionById = new Map(questions.map((question) => [question.questionId, question]))

  return (
    <div className="space-y-4">
      {answers.map((answer, index) => {
        const question = questionById.get(answer.questionId)
        return (
          <Card key={`${answer.questionId}-${index}`} className="border-slate-200 bg-white">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={answer.correct ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}>
                  {answer.correct ? 'Đúng' : 'Chưa đúng'}
                </Badge>
                <span className="text-sm text-slate-500">Câu {index + 1}</span>
              </div>
              <CardTitle className="whitespace-pre-wrap text-lg leading-7 text-slate-950">
                {question?.questionText ?? `Câu hỏi #${answer.questionId}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Đáp án đúng</p>
                <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-slate-900">
                  {answer.correctAnswer?.trim() || 'Không có đáp án hiển thị'}
                </p>
              </div>
              {answer.feedback ? (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Phản hồi</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-indigo-900">{answer.feedback}</p>
                </div>
              ) : null}
              {answer.explanation ? (
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Giải thích</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-900">{answer.explanation}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
