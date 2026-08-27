import type { AdminReviewCourseDetail } from '../../../lib/api/types'

export function countReviewLessons(course: AdminReviewCourseDetail) {
  return course.topics.reduce((total, topic) => total + topic.lessons.length, 0)
}

export function countReviewQuestions(course: AdminReviewCourseDetail) {
  return course.topics.reduce(
    (total, topic) => total + topic.lessons.reduce((lessonTotal, lesson) => lessonTotal + lesson.questions.length, 0),
    0,
  )
}

export function formatReviewDate(value: string | null) {
  if (!value) return 'Chưa có'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}
