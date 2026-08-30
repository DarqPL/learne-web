import type { StudentCourseDetail, StudentEnrollmentProgress, StudentLessonProgress } from '../../../lib/api/types'

export function formatStudentLearningDate(value: string | null) {
  if (!value) return 'Chưa có'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Chưa có'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export function countStudentLessons(course: StudentCourseDetail) {
  return course.topics.reduce((total, topic) => total + topic.lessons.length, 0)
}

export function countStudentQuestions(course: StudentCourseDetail) {
  return course.topics.reduce(
    (total, topic) => total + topic.lessons.reduce((lessonTotal, lesson) => lessonTotal + lesson.questionCount, 0),
    0,
  )
}

export function flattenProgressLessons(enrollment: StudentEnrollmentProgress) {
  return enrollment.topics.flatMap((topic) => topic.lessons)
}

export function findFirstAvailableLesson(enrollment: StudentEnrollmentProgress): StudentLessonProgress | null {
  return flattenProgressLessons(enrollment).find((lesson) => lesson.status !== 'COMPLETED') ?? null
}
