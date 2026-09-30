import type { TeacherCourse, TeacherQuestion } from '../../../../lib/api/types'

export type BuilderStep = 'thong-tin' | 'noi-dung' | 'cau-hoi' | 'kiem-tra'

export const cardSoftClassName = 'border-indigo-100 bg-white/95 shadow-sm shadow-indigo-100/60'

export const stepDefinitions: { id: BuilderStep; label: string }[] = [
  { id: 'thong-tin', label: 'Thông tin' },
  { id: 'noi-dung', label: 'Nội dung' },
  { id: 'cau-hoi', label: 'Câu hỏi' },
  { id: 'kiem-tra', label: 'Kiểm tra' },
]

const textAnswerQuestionTypes: TeacherQuestion['type'][] = ['FILL_BLANK', 'WORD_ORDER', 'TRANSLATION', 'SHORT_ANSWER', 'PRONUNCIATION']

export interface ReviewIssue {
  id: string
  message: string
  step: BuilderStep
  topicId?: number
  lessonId?: number
}

export type DeleteTarget = { kind: 'topic' | 'lesson' | 'question'; id: number; name: string }

export type QuestionDialogState = { mode: 'create'; lessonId: number } | { mode: 'edit'; questionId: number }

export function parsePositiveInteger(value: string | null) {
  if (value === null) return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function findTopic(course: TeacherCourse, topicId: number | null) {
  if (topicId === null) return null
  return course.topics.find((topic) => topic.id === topicId) ?? null
}

export function findLessonTopic(course: TeacherCourse, lessonId: number | null) {
  if (lessonId === null) return null
  return course.topics.find((topic) => topic.lessons.some((lesson) => lesson.id === lessonId)) ?? null
}

export function findLesson(course: TeacherCourse, lessonId: number | null) {
  const topic = findLessonTopic(course, lessonId)
  return topic?.lessons.find((lesson) => lesson.id === lessonId) ?? null
}

export function findQuestion(course: TeacherCourse, questionId: number) {
  for (const topic of course.topics) {
    for (const lesson of topic.lessons) {
      const question = lesson.questions.find((item) => item.id === questionId)
      if (question) return question
    }
  }
  return null
}

function getQuestionAnswerIssue(question: TeacherQuestion) {
  if (!question.questionText.trim()) return 'Câu hỏi đang trống nội dung.'
  if (textAnswerQuestionTypes.includes(question.type)) {
    if (!question.correctAnswer?.trim()) return 'Thiếu đáp án đúng.'
    return null
  }
  if (question.type === 'MULTIPLE_CHOICE') {
    const nonEmptyOptions = question.options.filter((option) => option.optionText.trim() !== '')
    if (nonEmptyOptions.length < 2) return 'Cần ít nhất 2 lựa chọn.'
    if (nonEmptyOptions.filter((option) => option.correct).length !== 1) return 'Cần đúng 1 lựa chọn đúng.'
    return null
  }
  if (question.type === 'TRUE_FALSE') {
    const hasCorrect = question.options.some((option) => option.correct) || question.correctAnswer === 'Đúng' || question.correctAnswer === 'Sai'
    if (!hasCorrect) return 'Thiếu đáp án Đúng / Sai.'
    return null
  }
  return null
}

export function computeReviewIssues(course: TeacherCourse): ReviewIssue[] {
  const issues: ReviewIssue[] = []
  if (!course.name.trim()) issues.push({ id: 'course-name', message: 'Tên khóa học đang trống.', step: 'thong-tin' })
  if (!course.level.trim()) issues.push({ id: 'course-level', message: 'Cấp độ khóa học đang trống.', step: 'thong-tin' })
  if (course.topics.length === 0) {
    issues.push({ id: 'no-topics', message: 'Chưa có chủ đề nào.', step: 'noi-dung' })
    return issues
  }
  const lessons = course.topics.flatMap((topic) => topic.lessons)
  if (lessons.length === 0) issues.push({ id: 'no-lessons', message: 'Chưa có bài học nào.', step: 'noi-dung' })
  const questions = lessons.flatMap((lesson) => lesson.questions)
  if (lessons.length > 0 && questions.length === 0) issues.push({ id: 'no-questions', message: 'Chưa có câu hỏi nào.', step: 'cau-hoi' })
  for (const topic of course.topics) {
    if (!topic.name.trim()) issues.push({ id: `topic-${topic.id}-name`, message: `Chủ đề #${topic.orderIndex} chưa có tên.`, step: 'noi-dung', topicId: topic.id })
  }
  for (const lesson of lessons) {
    if (!lesson.title.trim()) {
      issues.push({ id: `lesson-${lesson.id}-title`, message: 'Có bài học chưa có tiêu đề.', step: 'noi-dung', lessonId: lesson.id })
    } else if (lesson.questions.length === 0) {
      issues.push({ id: `lesson-${lesson.id}-questions`, message: `Bài học "${lesson.title}" chưa có câu hỏi.`, step: 'cau-hoi', lessonId: lesson.id })
    }
    for (const question of lesson.questions) {
      const answerIssue = getQuestionAnswerIssue(question)
      if (answerIssue) {
        issues.push({ id: `question-${question.id}`, message: `Câu hỏi #${question.orderIndex} trong "${lesson.title}": ${answerIssue}`, step: 'cau-hoi', lessonId: lesson.id })
      }
    }
  }
  return issues
}
