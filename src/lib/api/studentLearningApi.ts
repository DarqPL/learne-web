import { http } from './client'
import type {
  StudentCourseDetail,
  StudentCourseSummary,
  StudentEnrollment,
  StudentEnrollmentProgress,
  StudentQuiz,
  StudentQuizAttemptResult,
  StudentStats,
  SubmitQuizRequest,
  SubmitQuizResponse,
} from './types'

const base = '/api/student'

export interface StudentCourseFilters {
  level?: string
  teacherId?: number
}

export function listStudentCourses(params?: StudentCourseFilters) {
  return http.get<StudentCourseSummary[]>(`${base}/courses`, { params })
}

export function getStudentCourse(courseId: number) {
  return http.get<StudentCourseDetail>(`${base}/courses/${courseId}`)
}

export function enrollStudentCourse(courseId: number) {
  return http.post<StudentEnrollment>(`${base}/courses/${courseId}/enroll`, {})
}

export function listStudentEnrollments() {
  return http.get<StudentEnrollment[]>(`${base}/enrollments`)
}

export function getStudentEnrollment(enrollmentId: number) {
  return http.get<StudentEnrollmentProgress>(`${base}/enrollments/${enrollmentId}`)
}

export function getStudentEnrollmentProgress(enrollmentId: number) {
  return http.get<StudentEnrollmentProgress>(`${base}/enrollments/${enrollmentId}/progress`)
}

export function startStudentLesson(enrollmentId: number, lessonId: number) {
  return http.post<StudentEnrollmentProgress>(`${base}/enrollments/${enrollmentId}/lessons/${lessonId}/start`, {})
}

export function completeStudentLesson(enrollmentId: number, lessonId: number) {
  return http.post<StudentEnrollmentProgress>(`${base}/enrollments/${enrollmentId}/lessons/${lessonId}/complete`, {})
}

export function getStudentLessonQuiz(enrollmentId: number, lessonId: number) {
  return http.get<StudentQuiz>(`${base}/enrollments/${enrollmentId}/lessons/${lessonId}/quiz`)
}

export function submitStudentLessonQuiz(enrollmentId: number, lessonId: number, request: SubmitQuizRequest) {
  return http.post<SubmitQuizResponse>(`${base}/enrollments/${enrollmentId}/lessons/${lessonId}/quiz/submit`, request)
}

export function getStudentQuizAttempt(attemptId: number) {
  return http.get<StudentQuizAttemptResult>(`${base}/quiz-attempts/${attemptId}`)
}

export function getStudentStats() {
  return http.get<StudentStats>(`${base}/stats`)
}
