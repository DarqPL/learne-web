import { describe, expect, it } from 'vitest'
import {
  getRegistrationErrorMessage,
  isOtpAttemptsExhaustedError,
  isOtpExpiredError,
} from './authErrorMessages'

function axiosError(status: number, message: string) {
  return Object.assign(new Error(message), {
    isAxiosError: true,
    response: { status, data: { message } },
  })
}

describe('getRegistrationErrorMessage', () => {
  it.each([
    ['OTP has expired.', 'Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.'],
    ['OTP is invalid.', 'Mã OTP không đúng. Vui lòng kiểm tra lại.'],
    [
      'Too many invalid OTP attempts. Please request a new code.',
      'Bạn đã nhập sai quá 5 lần. Vui lòng chờ mã hiện tại hết hạn rồi gửi lại.',
    ],
    [
      'Current OTP is still valid. Please wait until it expires before requesting a new one.',
      'Mã hiện tại vẫn còn hiệu lực. Vui lòng chờ đến khi mã hết hạn rồi gửi lại.',
    ],
  ])('maps %s', (message, expected) => {
    expect(getRegistrationErrorMessage(axiosError(400, message), 'fallback')).toBe(expected)
  })

  it('passes unknown API messages through and falls back for non-axios errors', () => {
    expect(getRegistrationErrorMessage(axiosError(400, 'Unexpected.'), 'fallback')).toBe('Unexpected.')
    expect(getRegistrationErrorMessage(new Error('network'), 'fallback')).toBe('fallback')
  })

  it('does not resolve prototype keys as mapped messages', () => {
    expect(getRegistrationErrorMessage(axiosError(400, 'toString'), 'fallback')).toBe('toString')
  })
})

describe('OTP error predicates', () => {
  it('detects the expired-code response', () => {
    expect(isOtpExpiredError(axiosError(400, 'OTP has expired.'))).toBe(true)
    expect(isOtpExpiredError(axiosError(400, 'OTP is invalid.'))).toBe(false)
  })

  it('detects an exhausted-attempts 429 only when the message matches', () => {
    expect(
      isOtpAttemptsExhaustedError(
        axiosError(429, 'Too many invalid OTP attempts. Please request a new code.'),
      ),
    ).toBe(true)
    expect(isOtpAttemptsExhaustedError(axiosError(400, 'Too many invalid OTP attempts. Please request a new code.'))).toBe(
      false,
    )
    expect(isOtpAttemptsExhaustedError(axiosError(429, 'Something else.'))).toBe(false)
  })
})
