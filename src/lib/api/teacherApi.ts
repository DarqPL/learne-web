import { http } from './client'
import type { TeacherProfile, TeacherProfileSummary, UpdateTeacherProfileRequest } from './types'

export function getTeacherProfile() {
  return http.get<TeacherProfile>('/api/teacher/profile')
}

export function updateTeacherProfile(payload: UpdateTeacherProfileRequest) {
  return http.put<TeacherProfile>('/api/teacher/profile', payload)
}

export function getTeachers() {
  return http.get<TeacherProfileSummary[]>('/api/teachers')
}

export function getTeacherDetail(teacherId: number) {
  return http.get<TeacherProfile>(`/api/teachers/${teacherId}`)
}
