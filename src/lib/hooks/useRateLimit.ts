import { useCallback, useState } from 'react'
import { readRateLimit, type RateLimitInfo } from '../api/rateLimit'
import { useCountdown } from './useCountdown'

export interface RateLimiter {
  info: RateLimitInfo | null
  secondsLeft: number
  locked: boolean
  capture: (error: unknown) => boolean
  reset: () => void
}

export function useRateLimit(): RateLimiter {
  const [info, setInfo] = useState<RateLimitInfo | null>(null)
  const { secondsLeft, start, stop } = useCountdown()

  const capture = useCallback(
    (error: unknown) => {
      const parsed = readRateLimit(error)
      if (!parsed) return false
      setInfo(parsed)
      if (parsed.kind === 'limited') start(parsed.retryAfterSeconds)
      return true
    },
    [start],
  )

  const reset = useCallback(() => {
    setInfo(null)
    stop()
  }, [stop])

  return { info, secondsLeft, locked: secondsLeft > 0, capture, reset }
}
