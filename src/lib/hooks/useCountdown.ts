import { useCallback, useLayoutEffect, useRef, useState } from 'react'

export interface Countdown {
  secondsLeft: number
  start: (seconds: number) => void
  stop: () => void
}

export function useCountdown(): Countdown {
  const [secondsLeft, setSecondsLeft] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const deadlineRef = useRef(0)
  const isMountedRef = useRef(true)

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(
    (seconds: number) => {
      if (!isMountedRef.current) return
      clearTimer()

      const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.ceil(seconds)) : 0
      setSecondsLeft(safeSeconds)
      if (safeSeconds <= 0) {
        deadlineRef.current = 0
        return
      }

      deadlineRef.current = Date.now() + safeSeconds * 1000
      intervalRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000))
        setSecondsLeft(remaining)
        if (remaining <= 0) {
          clearTimer()
          deadlineRef.current = 0
        }
      }, 1000)
    },
    [clearTimer],
  )

  const stop = useCallback(() => {
    clearTimer()
    deadlineRef.current = 0
    if (isMountedRef.current) setSecondsLeft(0)
  }, [clearTimer])

  useLayoutEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      clearTimer()
    }
  }, [clearTimer])

  return { secondsLeft, start, stop }
}
