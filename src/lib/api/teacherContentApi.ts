import { http } from './client'
import type {
  ApiMessageResponse,
  CourseSubmission,
  CourseImportResponse,
  TeacherCourse,
  TeacherCourseRequest,
  TeacherLesson,
  TeacherLessonRequest,
  TeacherQuestion,
  TeacherQuestionRequest,
  TeacherTopic,
  TeacherTopicRequest,
  CursorPage,
} from './types'

const base = '/api/teacher/content'

export function listTeacherCourses(params?: { status?: string; q?: string; size?: number; cursor?: string }) {
  return http.get<CursorPage<TeacherCourse>>(`${base}/courses`, { params })
}

export function createTeacherCourse(payload: TeacherCourseRequest) {
  return http.post<TeacherCourse>(`${base}/courses`, payload)
}

export function getTeacherCourse(courseId: number) {
  return http.get<TeacherCourse>(`${base}/courses/${courseId}`)
}

export function updateTeacherCourse(courseId: number, payload: TeacherCourseRequest) {
  return http.put<TeacherCourse>(`${base}/courses/${courseId}`, payload)
}

export function deleteTeacherCourse(courseId: number) {
  return http.delete<ApiMessageResponse>(`${base}/courses/${courseId}`)
}

export function createTeacherTopic(courseId: number, payload: TeacherTopicRequest) {
  return http.post<TeacherTopic>(`${base}/courses/${courseId}/topics`, payload)
}

export function updateTeacherTopic(topicId: number, payload: TeacherTopicRequest) {
  return http.put<TeacherTopic>(`${base}/topics/${topicId}`, payload)
}

export function deleteTeacherTopic(topicId: number) {
  return http.delete<ApiMessageResponse>(`${base}/topics/${topicId}`)
}

export function createTeacherLesson(topicId: number, payload: TeacherLessonRequest) {
  return http.post<TeacherLesson>(`${base}/topics/${topicId}/lessons`, payload)
}

export function updateTeacherLesson(lessonId: number, payload: TeacherLessonRequest) {
  return http.put<TeacherLesson>(`${base}/lessons/${lessonId}`, payload)
}

export function deleteTeacherLesson(lessonId: number) {
  return http.delete<ApiMessageResponse>(`${base}/lessons/${lessonId}`)
}

export function createTeacherQuestion(lessonId: number, payload: TeacherQuestionRequest) {
  return http.post<TeacherQuestion>(`${base}/lessons/${lessonId}/questions`, payload)
}

export function updateTeacherQuestion(questionId: number, payload: TeacherQuestionRequest) {
  return http.put<TeacherQuestion>(`${base}/questions/${questionId}`, payload)
}

export function deleteTeacherQuestion(questionId: number) {
  return http.delete<ApiMessageResponse>(`${base}/questions/${questionId}`)
}

export function submitTeacherCourse(courseId: number) {
  return http.post<CourseSubmission>(`${base}/courses/${courseId}/submit`, {})
}

export function getCourseSubmission(courseId: number, submissionId: string, signal?: AbortSignal) {
  return http.get<CourseSubmission>(`${base}/courses/${courseId}/submissions/${submissionId}`, { signal })
}

export function getLatestCourseSubmission(courseId: number, signal?: AbortSignal) {
  return http.get<CourseSubmission>(`${base}/courses/${courseId}/submission`, { signal })
}

export function createEditRevision(courseId: number) {
  return http.post<TeacherCourse>(`${base}/courses/${courseId}/edit-revision`)
}

export function downloadCourseTemplate() {
  return http.get<Blob>(`${base}/course-template`, { responseType: 'blob' })
}

export function exportTeacherCourse(courseId: number) {
  return http.get<Blob>(`${base}/courses/${courseId}/export`, { responseType: 'blob' })
}

export function importTeacherCourse(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return http.post<CourseImportResponse>(`${base}/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
