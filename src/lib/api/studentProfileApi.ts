import { http } from './client'
import type { StudentProfile, UpdateStudentProfileRequest } from './types'

export function getStudentProfile() {
  return http.get<StudentProfile>('/api/student/profile')
}

export function updateStudentProfile(payload: UpdateStudentProfileRequest) {
  return http.put<StudentProfile>('/api/student/profile', payload)
}

export function uploadStudentAvatar(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return http.post<StudentProfile>('/api/student/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function deleteStudentAvatar() {
  return http.delete<StudentProfile>('/api/student/profile/avatar')
}
