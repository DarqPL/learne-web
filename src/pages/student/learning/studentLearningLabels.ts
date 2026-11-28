import type { CourseType, EnrollmentStatus, LessonProgressStatus, QuestionType, SkillType } from '../../../lib/api/types'

export const studentCourseTypeLabels: Record<CourseType, string> = {
  COMPREHENSIVE: 'Tổng hợp',
  GRAMMAR: 'Ngữ pháp',
  LISTENING: 'Nghe',
  SPEAKING: 'Nói',
  READING: 'Đọc',
  WRITING: 'Viết',
  VOCABULARY: 'Từ vựng',
  PRONUNCIATION: 'Phát âm',
}

export const studentSkillTypeLabels: Record<SkillType, string> = {
  GRAMMAR: 'Ngữ pháp',
  LISTENING: 'Nghe',
  SPEAKING: 'Nói',
  READING: 'Đọc',
  WRITING: 'Viết',
  VOCABULARY: 'Từ vựng',
  PRONUNCIATION: 'Phát âm',
}

export const studentQuestionTypeLabels: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  FILL_BLANK: 'Điền vào chỗ trống',
  WORD_ORDER: 'Sắp xếp từ',
  TRANSLATION: 'Dịch câu',
  TRUE_FALSE: 'Đúng / Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
  PRONUNCIATION: 'Phát âm',
}

export const enrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  ACTIVE: 'Đang học',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
}

export const enrollmentStatusStyles: Record<EnrollmentStatus, string> = {
  ACTIVE: 'bg-info-background text-info-foreground',
  COMPLETED: 'bg-success-background text-success-foreground',
  CANCELLED: 'bg-muted text-muted-foreground',
}

export const lessonProgressStatusLabels: Record<LessonProgressStatus, string> = {
  LOCKED: 'Chưa mở khóa',
  UNLOCKED: 'Chưa bắt đầu',
  IN_PROGRESS: 'Đang học',
  COMPLETED: 'Đã hoàn thành',
}

export const lessonProgressStatusStyles: Record<LessonProgressStatus, string> = {
  LOCKED: 'bg-muted text-muted-foreground',
  UNLOCKED: 'bg-secondary text-secondary-foreground',
  IN_PROGRESS: 'bg-warning-background text-warning-foreground',
  COMPLETED: 'bg-success-background text-success-foreground',
}
