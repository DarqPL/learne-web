import axios from 'axios'

const RATE_LIMITED_CODE = 'RATE_LIMITED'
const ABUSE_UNAVAILABLE_CODE = 'ABUSE_PROTECTION_UNAVAILABLE'

export type RateLimitInfo =
  | { kind: 'limited'; retryAfterSeconds: number }
  | { kind: 'unavailable' }

interface ErrorBody {
  code?: unknown
}

function normalizeSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) return 1
  return Math.max(1, Math.ceil(seconds))
}

function parseRetryAfter(value: unknown): number {
  if (typeof value === 'number') return normalizeSeconds(value)
  if (typeof value !== 'string') return 1

  const trimmed = value.trim()
  if (trimmed === '') return 1

  const seconds = Number(trimmed)
  if (Number.isFinite(seconds)) return normalizeSeconds(seconds)

  const date = Date.parse(trimmed)
  if (!Number.isFinite(date)) return 1
  return normalizeSeconds((date - Date.now()) / 1000)
}

export function readRateLimit(error: unknown): RateLimitInfo | null {
  if (!axios.isAxiosError(error)) return null

  const response = error.response
  if (!response) return null

  const body = response.data as ErrorBody | undefined

  if (response.status === 429 && body?.code === RATE_LIMITED_CODE) {
    return {
      kind: 'limited',
      retryAfterSeconds: parseRetryAfter(response.headers?.['retry-after']),
    }
  }

  if (response.status === 503 && body?.code === ABUSE_UNAVAILABLE_CODE) {
    return { kind: 'unavailable' }
  }

  return null
}

export function rateLimitMessage(info: RateLimitInfo): string {
  if (info.kind === 'unavailable') {
    return 'Tạm thời không thể xác thực do hệ thống bảo vệ đang bận. Vui lòng thử lại.'
  }
  if (info.retryAfterSeconds <= 0) return 'Bạn có thể thử lại.'
  return `Quá nhiều lần thử. Vui lòng thử lại sau ${formatCountdown(info.retryAfterSeconds)}.`
}

export function formatCountdown(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
