import { http } from './client'
import type { AdminTeacher, ApiMessageResponse } from './types'

export function adminListTeachers() {
  return http.get<AdminTeacher[]>('/api/admin/teachers')
}

export function adminLockTeacher(userId: number) {
  return http.post<ApiMessageResponse>(`/api/admin/users/${userId}/lock`)
}

export function adminUnlockTeacher(userId: number) {
  return http.post<ApiMessageResponse>(`/api/admin/users/${userId}/unlock`)
}