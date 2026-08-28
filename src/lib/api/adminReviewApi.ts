import { http } from './client'
import type { AdminReviewCourseDetail, AdminReviewCourseSummary, RejectContentRequest } from './types'

const base = '/api/admin/content'

export function listPendingReviewCourses() {
  return http.get<AdminReviewCourseSummary[]>(`${base}/courses/pending`)
}

export function getReviewCourse(courseId: number) {
  return http.get<AdminReviewCourseDetail>(`${base}/courses/${courseId}`)
}

export function approveReviewCourse(courseId: number) {
  return http.post<AdminReviewCourseDetail>(`${base}/courses/${courseId}/approve`, {})
}

export function rejectReviewCourse(courseId: number, payload: RejectContentRequest) {
  return http.post<AdminReviewCourseDetail>(`${base}/courses/${courseId}/reject`, payload)
}
