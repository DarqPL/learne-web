import { http } from './client'
import type { AdminDashboard, AdminStudentDetail, AdminStudentSummary, AdminTeacher, ApiMessageResponse } from './types'

export function adminGetDashboard() {
  return http.get<AdminDashboard>('/api/admin/dashboard')
}

export function adminListStudents() {
  return http.get<AdminStudentSummary[]>('/api/admin/students')
}

export function adminGetStudent(userId: number) {
  return http.get<AdminStudentDetail>(`/api/admin/students/${userId}`)
}

export function adminListTeachers() {
  return http.get<AdminTeacher[]>('/api/admin/teachers')
}

export function adminLockTeacher(userId: number) {
  return http.post<ApiMessageResponse>(`/api/admin/users/${userId}/lock`)
}

export function adminUnlockTeacher(userId: number) {
  return http.post<ApiMessageResponse>(`/api/admin/users/${userId}/unlock`)
}

export const adminLockUser = adminLockTeacher
export const adminUnlockUser = adminUnlockTeacher
