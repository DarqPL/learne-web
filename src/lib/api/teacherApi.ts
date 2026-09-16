import { http } from './client'
import type { TeacherDashboard, TeacherProfile, TeacherProfileSummary, UpdateTeacherProfileRequest } from './types'

export function getTeacherDashboard() {
  return http.get<TeacherDashboard>('/api/teacher/dashboard')
}

export function getTeacherProfile() {
  return http.get<TeacherProfile>('/api/teacher/profile')
}

export function updateTeacherProfile(payload: UpdateTeacherProfileRequest) {
  return http.put<TeacherProfile>('/api/teacher/profile', payload)
}

export function uploadTeacherAvatar(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return http.post<TeacherProfile>('/api/teacher/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function deleteTeacherAvatar() {
  return http.delete<TeacherProfile>('/api/teacher/profile/avatar')
}

export function uploadTeacherIntroductionVideo(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return http.post<TeacherProfile>('/api/teacher/profile/introduction-video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function deleteTeacherIntroductionVideo() {
  return http.delete<TeacherProfile>('/api/teacher/profile/introduction-video')
}

export function getTeachers() {
  return http.get<TeacherProfileSummary[]>('/api/teachers')
}

export function getTeacherDetail(teacherId: number) {
  return http.get<TeacherProfile>(`/api/teachers/${teacherId}`)
}
