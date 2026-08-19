export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN'

export interface AuthUser {
  id: number
  email: string
  fullName: string
  role: UserRole
  mustChangePassword: boolean
}

export interface AuthTokenResponse {
  accessToken: string
  expiresInSeconds: number
  user: AuthUser
}

export interface ApiMessageResponse {
  message: string
}

export interface TeacherProfile {
  teacherId: number
  fullName: string
  email: string
  bio: string
  expertise: string
  yearsOfExperience: number
  avatarUrl?: string
  introductionVideoUrl?: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  completed: boolean
}

export interface TeacherProfileSummary {
  teacherId: number
  fullName: string
  email: string
  avatarUrl?: string
  expertise: string
  yearsOfExperience: number
}

export interface UpdateTeacherProfileRequest {
  bio: string
  expertise: string
  yearsOfExperience: number
}