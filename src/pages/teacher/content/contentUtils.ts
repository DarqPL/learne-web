import type { ContentStatus, TeacherCourse } from '../../../lib/api/types'

export function canEditContent(status: ContentStatus) {
  return status === 'DRAFT' || status === 'REJECTED'
}

export function countLessons(course: TeacherCourse) {
  return course.topics.reduce((total, topic) => total + topic.lessons.length, 0)
}

export function countQuestions(course: TeacherCourse) {
  return course.topics.reduce(
    (total, topic) => total + topic.lessons.reduce((lessonTotal, lesson) => lessonTotal + lesson.questions.length, 0),
    0,
  )
}

export function canSubmitCourse(course: TeacherCourse) {
  return canEditContent(course.status) && course.topics.length > 0 && countLessons(course) > 0 && countQuestions(course) > 0
}
