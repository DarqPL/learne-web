import { http } from './client'
import type {
  AdminCourseCoverReviewDetail,
  AdminCourseCoverReviewSummary,
  AdminReviewCourseDetail,
  AdminReviewCourseSummary,
  CursorPage,
  RejectContentRequest,
} from './types'

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

export function listPendingCourseCoverReviews(params?: { size?: number; cursor?: string }) {
  return http.get<CursorPage<AdminCourseCoverReviewSummary>>(`${base}/course-covers/pending`, { params })
}

export function getCourseCoverReview(reviewId: number) {
  return http.get<AdminCourseCoverReviewDetail>(`${base}/course-covers/${reviewId}`)
}

export function approveCourseCoverReview(reviewId: number) {
  return http.post<AdminCourseCoverReviewDetail>(`${base}/course-covers/${reviewId}/approve`, {})
}

export function rejectCourseCoverReview(reviewId: number, payload: RejectContentRequest) {
  return http.post<AdminCourseCoverReviewDetail>(`${base}/course-covers/${reviewId}/reject`, payload)
}
