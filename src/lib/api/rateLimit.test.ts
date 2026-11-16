import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatCountdown, rateLimitMessage, readRateLimit } from './rateLimit'

function axiosError(status: number, data: unknown, headers: Record<string, string> = {}) {
  return Object.assign(new Error('request failed'), {
    isAxiosError: true,
    response: { status, data, headers },
  })
}

function limitedBody() {
  return { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('readRateLimit', () => {
  it('reads numeric Retry-After seconds and rounds up', () => {
    expect(readRateLimit(axiosError(429, limitedBody(), { 'retry-after': '42' }))).toEqual({
      kind: 'limited',
      retryAfterSeconds: 42,
    })
    expect(readRateLimit(axiosError(429, limitedBody(), { 'retry-after': '1.2' }))).toEqual({
      kind: 'limited',
      retryAfterSeconds: 2,
    })
  })

  it('converts an HTTP-date Retry-After using the current time', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-22T10:00:00Z'))

    expect(
      readRateLimit(axiosError(429, limitedBody(), { 'retry-after': 'Thu, 22 Oct 2026 10:00:07 GMT' })),
    ).toEqual({ kind: 'limited', retryAfterSeconds: 7 })
  })

  it('clamps missing, invalid, and past Retry-After values to one second', () => {
    expect(readRateLimit(axiosError(429, limitedBody()))).toEqual({ kind: 'limited', retryAfterSeconds: 1 })
    expect(readRateLimit(axiosError(429, limitedBody(), { 'retry-after': 'soon' }))).toEqual({
      kind: 'limited',
      retryAfterSeconds: 1,
    })
    expect(readRateLimit(axiosError(429, limitedBody(), { 'retry-after': '0' }))).toEqual({
      kind: 'limited',
      retryAfterSeconds: 1,
    })
  })

  it('ignores a 429 that has no RATE_LIMITED code', () => {
    expect(
      readRateLimit(
        axiosError(429, { message: 'Too many invalid OTP attempts. Please request a new code.' }),
      ),
    ).toBeNull()
  })

  it('recognises only the abuse-protection 503', () => {
    expect(
      readRateLimit(axiosError(503, { code: 'ABUSE_PROTECTION_UNAVAILABLE', message: 'Service temporarily unavailable.' })),
    ).toEqual({ kind: 'unavailable' })
    expect(readRateLimit(axiosError(503, { message: 'Gateway down' }))).toBeNull()
  })

  it('ignores non-axios errors and non-rate-limit statuses', () => {
    expect(readRateLimit(new Error('network'))).toBeNull()
    expect(readRateLimit(axiosError(500, limitedBody(), { 'retry-after': '10' }))).toBeNull()
  })
})

describe('rateLimitMessage', () => {
  it('renders the remaining time and the retry-available copy at zero', () => {
    expect(rateLimitMessage({ kind: 'limited', retryAfterSeconds: 42 })).toBe(
      'Quá nhiều lần thử. Vui lòng thử lại sau 00:42.',
    )
    expect(rateLimitMessage({ kind: 'limited', retryAfterSeconds: 0 })).toBe('Bạn có thể thử lại.')
  })

  it('renders the unavailable copy', () => {
    expect(rateLimitMessage({ kind: 'unavailable' })).toBe(
      'Tạm thời không thể xác thực do hệ thống bảo vệ đang bận. Vui lòng thử lại.',
    )
  })
})

describe('formatCountdown', () => {
  it('formats minutes and seconds', () => {
    expect(formatCountdown(0)).toBe('00:00')
    expect(formatCountdown(59)).toBe('00:59')
    expect(formatCountdown(90)).toBe('01:30')
    expect(formatCountdown(3600)).toBe('60:00')
  })

  it('clamps invalid input to zero', () => {
    expect(formatCountdown(-5)).toBe('00:00')
    expect(formatCountdown(Number.NaN)).toBe('00:00')
    expect(formatCountdown(Number.POSITIVE_INFINITY)).toBe('00:00')
  })
})
