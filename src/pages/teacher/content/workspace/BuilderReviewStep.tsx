import { Check, Send } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/ui/alert'
import { Button } from '@/components/shadcn/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/ui/card'
import type { TeacherCourse } from '../../../../lib/api/types'
import { cardSoftClassName, type ReviewIssue } from './builderModel'

interface BuilderReviewStepProps {
  course: TeacherCourse
  action: string | null
  lessonCount: number
  questionCount: number
  issues: ReviewIssue[]
  submitDisabled: boolean
  submitReason: string | null
  onJump: (issue: ReviewIssue) => void
  onOpenSubmit: () => void
}

export function BuilderReviewStep({
  course,
  action,
  lessonCount,
  questionCount,
  issues,
  submitDisabled,
  submitReason,
  onJump,
  onOpenSubmit,
}: BuilderReviewStepProps) {
  const reviewClean = issues.length === 0

  return (
    <Card className={cardSoftClassName}>
      <CardHeader>
        <CardTitle>Kiểm tra trước khi gửi duyệt</CardTitle>
        <CardDescription>Khắc phục tất cả vấn đề bên dưới để mở khóa nút gửi duyệt.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {reviewClean ? (
          <Alert className="border-emerald-200 bg-emerald-50/70">
            <Check aria-hidden="true" className="text-emerald-600" />
            <AlertTitle>Sẵn sàng gửi duyệt</AlertTitle>
            <AlertDescription>
              Khóa học có {course.topics.length} chủ đề · {lessonCount} bài học · {questionCount} câu hỏi và không còn vấn đề chặn nào.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex flex-col gap-2">
            {issues.map((issue) => (
              <div key={issue.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2.5">
                <p className="min-w-0 flex-1 text-sm text-amber-900">{issue.message}</p>
                <Button size="sm" variant="outline" className="border-amber-300 bg-white/80" onClick={() => onJump(issue)}>
                  Đi tới
                </Button>
              </div>
            ))}
          </div>
        )}
        {submitReason && !reviewClean ? <p className="text-sm text-muted-foreground">{submitReason}</p> : null}
        <div className="flex flex-wrap items-center gap-2">
          <Button disabled={submitDisabled} loading={action === 'submit-course'} onClick={onOpenSubmit}>
            <Send data-icon="inline-start" aria-hidden="true" />
            Gửi duyệt
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
