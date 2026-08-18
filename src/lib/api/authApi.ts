import { http } from './client'
import type { ApiMessageResponse, AuthTokenResponse, AuthUser } from './types'

export function requestRegistrationOtp(payload: { fullName: string; email: string; password: string; confirmPassword: string }) {
  return http.post<ApiMessageResponse>('/api/auth/register/request-otp', payload)
}

export function verifyRegistrationOtp(payload: { email: string; otp: string }) {
  return http.post<ApiMessageResponse>('/api/auth/register/verify-otp', payload)
}

export function resendRegistrationOtp(payload: { email: string }) {
  return http.post<ApiMessageResponse>('/api/auth/register/resend-otp', payload)
}

export function login(payload: { email: string; password: string }) {
  return http.post<AuthTokenResponse>('/api/auth/login', payload)
}

export function logout() {
  return http.post<ApiMessageResponse>('/api/auth/logout')
}

export function changePassword(payload: { currentPassword: string; newPassword: string; confirmNewPassword: string }) {
  return http.post<ApiMessageResponse>('/api/auth/change-password', payload)
}

export function requestPasswordReset(payload: { email: string }) {
  return http.post<ApiMessageResponse>('/api/auth/password-reset/request', payload)
}

export function confirmPasswordReset(payload: { email: string; token: string; newPassword: string; confirmNewPassword: string }) {
  return http.post<ApiMessageResponse>('/api/auth/password-reset/confirm', payload)
}

export function adminCreateTeacher(payload: { email: string; fullName: string }) {
  return http.post<AuthUser>('/api/admin/teachers', payload)
}
