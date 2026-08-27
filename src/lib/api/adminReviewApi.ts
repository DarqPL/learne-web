import { http } from './client'
import type { AdminReviewCourseDetail, AdminReviewCourseSummary, RejectContentRequest } from './types'

const base = '/api/admin/content'

export async function getPendingCourses(): Promise<AdminReviewCourseSummary[]> {
  const response = await http.get<AdminReviewCourseSummary[]>(`${base}/courses/pending`)
  return response.data
}

export async function getCourseReviewDetail(courseId: number): Promise<AdminReviewCourseDetail> {
  const response = await http.get<AdminReviewCourseDetail>(`${base}/courses/${courseId}`)
  return response.data
}

export async function approveCourse(courseId: number): Promise<AdminReviewCourseDetail> {
  const response = await http.post<AdminReviewCourseDetail>(`${base}/courses/${courseId}/approve`)
  return response.data
}

export async function rejectCourse(
  courseId: number,
  payload: RejectContentRequest,
): Promise<AdminReviewCourseDetail> {
  const response = await http.post<AdminReviewCourseDetail>(`${base}/courses/${courseId}/reject`, payload)
  return response.data
}
