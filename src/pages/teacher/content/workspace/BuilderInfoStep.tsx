import type { ReactNode } from 'react'
import type { ContentEditingState } from '../contentUtils'
import { Send, TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/ui/alert'
import { Badge } from '@/components/shadcn/ui/badge'
import { Button } from '@/components/shadcn/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/ui/card'
import type { TeacherCourse, TeacherCourseRequest } from '../../../../lib/api/types'
import { CourseForm } from '../CourseForm'
import { TeacherContentStatusBadge } from '../TeacherContentStatusBadge'
import { cardSoftClassName } from './builderModel'

interface BuilderInfoStepProps {
  course: TeacherCourse
  courseInitialValue: TeacherCourseRequest
  action: string | null
  editingState: ContentEditingState
  lessonCount: number
  questionCount: number
  submitDisabled: boolean
  submitReason: string | null
  importExportPanel: ReactNode
  onUpdateCourse: (payload: TeacherCourseRequest) => Promise<void>
  onOpenSubmit: () => void
  onGoReview: () => void
}

export function BuilderInfoStep({
  course,
  courseInitialValue,
  action,
  editingState,
  lessonCount,
  questionCount,
  submitDisabled,
  submitReason,
  importExportPanel,
  onUpdateCourse,
  onOpenSubmit,
  onGoReview,
}: BuilderInfoStepProps) {
  const editable = editingState.kind === 'editable'
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className={cardSoftClassName}>
          <CardHeader>
            <CardTitle>Thông tin khóa học</CardTitle>
            <CardDescription>Cập nhật thông tin khóa học trước khi gửi duyệt.</CardDescription>
          </CardHeader>
          <CardContent>
            {editable ? (
              <div className="rounded-xl border border-border bg-muted p-4">
                <CourseForm
                  initialValue={courseInitialValue}
                  loading={action === 'update-course'}
                  disabled={action !== null && action !== 'update-course'}
                  submitLabel="Lưu khóa học"
                  onSubmit={(payload) => void onUpdateCourse(payload)}
                />
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                Khóa học đang ở trạng thái chỉ đọc. Bạn không thể chỉnh sửa nội dung khi khóa học đang chờ duyệt, đã duyệt hoặc đã ẩn.
              </p>
            )}
          </CardContent>
        </Card>
        <Card className={cardSoftClassName}>
          <CardHeader>
            <CardTitle>Trạng thái &amp; gửi duyệt</CardTitle>
            <CardDescription>Theo dõi tiến độ hoàn thiện khóa học.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <TeacherContentStatusBadge status={course.status} />
              <Badge variant="taxonomy1">
                {course.topics.length} chủ đề
              </Badge>
              <Badge variant="taxonomy2">
                {lessonCount} bài học
              </Badge>
              <Badge variant="taxonomy3">
                {questionCount} câu hỏi
              </Badge>
            </div>
            {course.rejectionReason ? (
              <Alert variant="destructive">
                <TriangleAlert aria-hidden="true" />
                <AlertTitle>Lý do từ chối</AlertTitle>
                <AlertDescription>{course.rejectionReason}</AlertDescription>
              </Alert>
            ) : null}
            {submitReason ? (
              <p className="rounded-xl border border-warning/40 bg-warning-background px-3 py-2 text-sm text-warning-foreground">{submitReason}</p>
            ) : (
              <p className="rounded-xl border border-success/40 bg-success-background px-3 py-2 text-sm text-success-foreground">
                Khóa học đã sẵn sàng. Bạn có thể gửi duyệt ngay.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button disabled={submitDisabled} loading={action === 'submit-course'} onClick={onOpenSubmit}>
                <Send data-icon="inline-start" aria-hidden="true" />
                Gửi duyệt
              </Button>
              <Button variant="outline" onClick={onGoReview}>
                Kiểm tra lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      {importExportPanel}
    </div>
  )
}
