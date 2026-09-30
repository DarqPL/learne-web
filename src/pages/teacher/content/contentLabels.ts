import type { ContentStatus, CoursePriceStatus, CoursePricingType, CourseType, QuestionType, SkillType } from '../../../lib/api/types'

export const contentStatusLabels: Record<ContentStatus, string> = {
  DRAFT: 'Bản nháp',
  PENDING_REVIEW: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
  HIDDEN: 'Đã ẩn',
}

export const contentStatusStyles: Record<ContentStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_REVIEW: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-700',
  HIDDEN: 'bg-slate-100 text-slate-700',
}

export const courseTypeLabels: Record<CourseType, string> = {
  COMPREHENSIVE: 'Tổng hợp',
  GRAMMAR: 'Ngữ pháp',
  LISTENING: 'Nghe',
  SPEAKING: 'Nói',
  READING: 'Đọc',
  WRITING: 'Viết',
  VOCABULARY: 'Từ vựng',
  PRONUNCIATION: 'Phát âm',
}

export const skillTypeLabels: Record<SkillType, string> = {
  GRAMMAR: 'Ngữ pháp',
  LISTENING: 'Nghe',
  SPEAKING: 'Nói',
  READING: 'Đọc',
  WRITING: 'Viết',
  VOCABULARY: 'Từ vựng',
  PRONUNCIATION: 'Phát âm',
}

export const questionTypeLabels: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm một đáp án',
  FILL_BLANK: 'Điền vào chỗ trống',
  WORD_ORDER: 'Sắp xếp từ',
  TRANSLATION: 'Dịch câu',
  TRUE_FALSE: 'Đúng / Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
  PRONUNCIATION: 'Phát âm',
}

export const courseTypes = Object.keys(courseTypeLabels) as CourseType[]
export const skillTypes = Object.keys(skillTypeLabels) as SkillType[]
export const questionTypes = Object.keys(questionTypeLabels) as QuestionType[]

export const coursePricingTypeLabels: Record<CoursePricingType, string> = { FREE: 'Miễn phí', PAID: 'Trả phí' }
export const coursePriceStatusLabels: Record<CoursePriceStatus, string> = {
  NONE: 'Không áp dụng',
  PENDING_REVIEW: 'Chờ duyệt giá',
  APPROVED: 'Giá đã duyệt',
  REJECTED: 'Giá bị từ chối',
}
