import type { ReactNode } from 'react'
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
  editable: boolean
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
  editable,
  lessonCount,
  questionCount,
  submitDisabled,
  submitReason,
  importExportPanel,
  onUpdateCourse,
  onOpenSubmit,
  onGoReview,
}: BuilderInfoStepProps) {
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
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <CourseForm
                  initialValue={courseInitialValue}
                  loading={action === 'update-course'}
                  disabled={action !== null && action !== 'update-course'}
                  submitLabel="Lưu khóa học"
                  onSubmit={(payload) => void onUpdateCourse(payload)}
                />
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-indigo-200 p-4 text-sm text-muted-foreground">
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
              <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700">
                {course.topics.length} chủ đề
              </Badge>
              <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                {lessonCount} bài học
              </Badge>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
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
              <p className="rounded-xl border border-sky-200 bg-sky-50/70 px-3 py-2 text-sm text-sky-800">{submitReason}</p>
            ) : (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-800">
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
