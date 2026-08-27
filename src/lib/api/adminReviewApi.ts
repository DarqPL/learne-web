import { http } from './client'
import type { AdminReviewCourseDetail, AdminReviewCourseSummary, RejectContentRequest } from './types'

export async function getPendingCourses(): Promise<AdminReviewCourseSummary[]> {
  const response = await http.get<AdminReviewCourseSummary[]>('/admin/content/courses/pending')
  return response.data
}

export async function getCourseReviewDetail(courseId: number): Promise<AdminReviewCourseDetail> {
  const response = await http.get<AdminReviewCourseDetail>(`/admin/content/courses/${courseId}`)
  return response.data
}

export async function approveCourse(courseId: number): Promise<AdminReviewCourseDetail> {
  const response = await http.post<AdminReviewCourseDetail>(`/admin/content/courses/${courseId}/approve`)
  return response.data
}

export async function rejectCourse(
  courseId: number,
  payload: RejectContentRequest,
): Promise<AdminReviewCourseDetail> {
  const response = await http.post<AdminReviewCourseDetail>(`/admin/content/courses/${courseId}/reject`, payload)
  return response.data
}
