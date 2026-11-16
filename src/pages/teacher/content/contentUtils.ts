import type { ContentStatus, LessonAudioFields, TeacherCourse } from '../../../lib/api/types'

export function canEditContent(status: ContentStatus) {
  return status === 'DRAFT' || status === 'REJECTED'
}

export function canEditCourseContent(course: TeacherCourse) {
  if (course.editingLocked) return false
  if (canEditContent(course.status)) return true
  return course.hasEditableRevision || course.latestRevisionStatus === 'DRAFT' || course.latestRevisionStatus === 'REJECTED'
}

export function isPendingRevision(course: TeacherCourse) {
  return course.latestRevisionStatus === 'PENDING_REVIEW'
}

export function isRevisionBackedCourse(course: TeacherCourse) {
  if (course.status !== 'APPROVED') return false
  return (
    course.hasEditableRevision ||
    course.latestRevisionStatus === 'DRAFT' ||
    course.latestRevisionStatus === 'REJECTED' ||
    course.latestRevisionStatus === 'PENDING_REVIEW'
  )
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
  if (course.editingLocked) return false
  const hasSubmittableRevision = course.hasEditableRevision || course.latestRevisionStatus === 'DRAFT' || course.latestRevisionStatus === 'REJECTED'
  return (canEditContent(course.status) || hasSubmittableRevision) && course.topics.length > 0 && countLessons(course) > 0 && countQuestions(course) > 0
}

export type ContentEditingState = { kind: 'editable' } | { kind: 'locked'; reason: string } | { kind: 'read-only'; reason: string }

export type LessonIdNamespace = 'live' | 'revision'

export function getAudioLockedHint(course: TeacherCourse, editingState: ContentEditingState): string {
  if (editingState.kind === 'locked') return editingState.reason
  if (isPendingRevision(course)) {
    return 'Bản nháp đang chờ duyệt. Bạn có thể thay audio sau khi bản nháp được duyệt.'
  }
  return 'Tạo bản nháp chỉnh sửa để thay audio.'
}

export function getContentEditingState(course: TeacherCourse): ContentEditingState {
  if (course.editingLocked) return { kind: 'locked', reason: 'Khóa học đang được xử lý để gửi duyệt. Tạm khóa chỉnh sửa nội dung.' }
  return canEditCourseContent(course) ? { kind: 'editable' } : { kind: 'read-only', reason: 'Khóa học đang ở trạng thái chỉ đọc.' }
}

export function findTeacherCourse(courses: TeacherCourse[], courseId: number | null) {
  return courses.find((course) => course.id === courseId) ?? null
}

export function findTeacherLesson(course: TeacherCourse, lessonId: number) {
  return course.topics.flatMap((topic) => topic.lessons).find((lesson) => lesson.id === lessonId) ?? null
}

export function mergeLessonAudio(course: TeacherCourse, lessonId: number, audio: LessonAudioFields): TeacherCourse {
  return {
    ...course,
    topics: course.topics.map((topic) => {
      if (!topic.lessons.some((item) => item.id === lessonId)) return topic
      return {
        ...topic,
        lessons: topic.lessons.map((item) =>
          item.id === lessonId
            ? { ...item, audioUrl: audio.audioUrl, audioPublicId: audio.audioPublicId }
            : item,
        ),
      }
    }),
  }
}
