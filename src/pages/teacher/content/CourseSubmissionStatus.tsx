import type { CourseSubmission } from '../../../lib/api/types'

export function CourseSubmissionStatus({ submission }: { submission: CourseSubmission | null | undefined }) {
  if (!submission) return null
  const text = submission.status === 'QUEUED' ? 'Đã tiếp nhận yêu cầu. Đang chờ xử lý khóa học.'
    : submission.status === 'PROCESSING' ? `Đang xử lý khóa học: ${submission.processedQuestions}/${submission.totalQuestions} câu hỏi.`
      : submission.status === 'SUCCEEDED' ? 'Đã gửi khóa học để duyệt.'
        : `Không thể hoàn tất gửi duyệt. ${submission.message || 'Vui lòng kiểm tra nội dung và thử lại.'}`
  return <p role="status" aria-live="polite" className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm">{text}</p>
}
