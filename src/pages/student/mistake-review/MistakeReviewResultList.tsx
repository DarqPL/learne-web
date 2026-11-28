import type { MistakeReviewAnswerResult, MistakeReviewQuestion } from '../../../lib/api/types'
import { Badge } from '../../../components/shadcn/ui/badge'
import { Card, CardContent, CardHeader } from '../../../components/shadcn/ui/card'

type MistakeReviewResultListProps = {
  questions: MistakeReviewQuestion[]
  answers: MistakeReviewAnswerResult[]
}

export function MistakeReviewResultList({ questions, answers }: MistakeReviewResultListProps) {
  const questionById = new Map(questions.map((question) => [question.questionId, question]))

  return (
    <div className="space-y-4">
      {answers.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có câu trả lời nào để hiển thị.</p>
      ) : null}
      {answers.map((answer, index) => {
        const question = questionById.get(answer.questionId)
        const feedback = answer.feedback?.trim()
        const explanation = answer.explanation?.trim()
        return (
          <Card key={answer.questionId} className="border-border bg-card">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={answer.correct ? 'success' : 'destructive'}>
                  {answer.correct ? 'Đúng' : 'Chưa đúng'}
                </Badge>
                <span className="text-sm text-muted-foreground">Câu {index + 1}</span>
              </div>
              <h3 className="whitespace-pre-wrap text-lg font-semibold leading-7 text-foreground">
                {question?.questionText ?? `Câu hỏi #${answer.questionId}`}
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl bg-muted p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Đáp án đúng</p>
                <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-foreground">
                  {answer.correctAnswer?.trim() || 'Không có đáp án hiển thị'}
                </p>
              </div>
              {feedback ? (
                <div className="rounded-xl border border-info/30 bg-info-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-info-foreground">Phản hồi</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-info-foreground">{feedback}</p>
                </div>
              ) : null}
              {explanation ? (
                <div className="rounded-xl border border-warning/30 bg-warning-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-warning-foreground">Giải thích</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-warning-foreground">{explanation}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
