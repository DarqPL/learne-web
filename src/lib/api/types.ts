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