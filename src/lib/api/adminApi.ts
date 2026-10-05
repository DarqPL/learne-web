import { http } from './client'
import type { AdminDashboard, AdminStudentDetail, AdminStudentSummary, AdminTeacher, ApiMessageResponse, NumberedPage } from './types'

export function adminGetDashboard() {
  return http.get<AdminDashboard>('/api/admin/dashboard')
}

export function adminListStudents(params?: { page?: number; size?: number }) {
  return http.get<NumberedPage<AdminStudentSummary>>('/api/admin/students', { params })
}

export function adminGetStudent(userId: number) {
  return http.get<AdminStudentDetail>(`/api/admin/students/${userId}`)
}

export function adminListTeachers(params?: { page?: number; size?: number }) {
  return http.get<NumberedPage<AdminTeacher>>('/api/admin/teachers', { params })
}

export function adminLockTeacher(userId: number) {
  return http.post<ApiMessageResponse>(`/api/admin/users/${userId}/lock`)
}

export function adminUnlockTeacher(userId: number) {
  return http.post<ApiMessageResponse>(`/api/admin/users/${userId}/unlock`)
}

export const adminLockUser = adminLockTeacher
export const adminUnlockUser = adminUnlockTeacher
