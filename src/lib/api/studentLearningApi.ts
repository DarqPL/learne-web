import { http } from './client'
import type {
  CourseRecommendationPath,
  GenerateLearningPathRequest,
  NextLessonRecommendation,
  PlacementAttempt,
  PlacementStatus,
  StudentCourseDetail,
  StudentCourseSummary,
  StudentEnrollment,
  StudentEnrollmentProgress,
  StudentLearningPath,
  StudentDashboard,
  StudentQuiz,
  StudentQuizAttemptResult,
  StudentStats,
  SubmitPlacementRequest,
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

export function getStudentDashboard() {
  return http.get<StudentDashboard>(`${base}/dashboard`)
}

export function generateStudentLearningPath(request: GenerateLearningPathRequest = { maxItems: 8 }) {
  return http.post<StudentLearningPath>(`${base}/learning-path/generate`, request)
}

export function getCurrentStudentLearningPath() {
  return http.get<StudentLearningPath>(`${base}/learning-path/current`)
}

export function getNextLessonRecommendation() {
  return http.get<NextLessonRecommendation>(`${base}/recommendations/next-lesson`)
}

export function getPlacementStatus() {
  return http.get<PlacementStatus>(`${base}/placement/status`)
}

export function skipPlacement() {
  return http.post<PlacementStatus>(`${base}/placement/skip`, {})
}

export function startPlacement() {
  return http.post<PlacementAttempt>(`${base}/placement/start`, {})
}

export function getPlacementAttempt(attemptId: number) {
  return http.get<PlacementAttempt>(`${base}/placement/attempts/${attemptId}`)
}

export function submitPlacementAttempt(attemptId: number, request: SubmitPlacementRequest) {
  return http.post(`${base}/placement/attempts/${attemptId}/submit`, request)
}

export function generateCourseRecommendations(request = { maxItems: 8 }) {
  return http.post<CourseRecommendationPath>(`${base}/course-recommendations/generate`, request)
}

export function getCurrentCourseRecommendations() {
  return http.get<CourseRecommendationPath>(`${base}/course-recommendations/current`)
}
