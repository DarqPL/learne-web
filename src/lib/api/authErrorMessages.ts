import axios from 'axios'
import { getApiErrorMessage } from './client'

const REGISTRATION_MESSAGES: Record<string, string> = {
  'OTP has expired.': 'Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.',
  'OTP is invalid.': 'Mã OTP không đúng. Vui lòng kiểm tra lại.',
  'Too many invalid OTP attempts. Please request a new code.':
    'Bạn đã nhập sai quá 5 lần. Vui lòng chờ mã hiện tại hết hạn rồi gửi lại.',
  'Current OTP is still valid. Please wait until it expires before requesting a new one.':
    'Mã hiện tại vẫn còn hiệu lực. Vui lòng chờ đến khi mã hết hạn rồi gửi lại.',
}

const ATTEMPTS_EXHAUSTED_MESSAGE = 'Too many invalid OTP attempts. Please request a new code.'
const OTP_EXPIRED_MESSAGE = 'OTP has expired.'

function apiMessage(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return null
  const data = error.response?.data as { message?: unknown } | undefined
  return typeof data?.message === 'string' ? data.message : null
}

export function getRegistrationErrorMessage(error: unknown, fallback: string): string {
  const message = apiMessage(error)
  if (message && Object.prototype.hasOwnProperty.call(REGISTRATION_MESSAGES, message)) {
    return REGISTRATION_MESSAGES[message]
  }
  return getApiErrorMessage(error, fallback)
}

export function isOtpExpiredError(error: unknown): boolean {
  return apiMessage(error) === OTP_EXPIRED_MESSAGE
}

export function isOtpAttemptsExhaustedError(error: unknown): boolean {
  return (
    axios.isAxiosError(error) &&
    error.response?.status === 429 &&
    apiMessage(error) === ATTEMPTS_EXHAUSTED_MESSAGE
  )
}
