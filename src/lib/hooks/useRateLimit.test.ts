import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRateLimit } from './useRateLimit'

function limitedError(seconds: number) {
  return Object.assign(new Error('429'), {
    isAxiosError: true,
    response: {
      status: 429,
      headers: { 'retry-after': String(seconds) },
      data: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
    },
  })
}

function unavailableError() {
  return Object.assign(new Error('503'), {
    isAxiosError: true,
    response: {
      status: 503,
      data: { code: 'ABUSE_PROTECTION_UNAVAILABLE', message: 'Service temporarily unavailable.' },
    },
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-22T10:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useRateLimit', () => {
  it('ignores errors that are not rate limits', () => {
    const { result } = renderHook(() => useRateLimit())

    let captured = true
    act(() => {
      captured = result.current.capture(new Error('network'))
    })

    expect(captured).toBe(false)
    expect(result.current.info).toBeNull()
    expect(result.current.locked).toBe(false)
  })

  it('captures a limited response and locks until the countdown ends', () => {
    const { result } = renderHook(() => useRateLimit())

    act(() => {
      expect(result.current.capture(limitedError(30))).toBe(true)
    })

    expect(result.current.info).toEqual({ kind: 'limited', retryAfterSeconds: 30 })
    expect(result.current.secondsLeft).toBe(30)
    expect(result.current.locked).toBe(true)

    act(() => {
      vi.advanceTimersByTime(30_000)
    })

    expect(result.current.secondsLeft).toBe(0)
    expect(result.current.locked).toBe(false)
  })

  it('captures an unavailable response without locking', () => {
    const { result } = renderHook(() => useRateLimit())

    act(() => {
      expect(result.current.capture(unavailableError())).toBe(true)
    })

    expect(result.current.info).toEqual({ kind: 'unavailable' })
    expect(result.current.secondsLeft).toBe(0)
    expect(result.current.locked).toBe(false)
  })

  it('reset clears the info and any running countdown', () => {
    const { result } = renderHook(() => useRateLimit())
    act(() => {
      result.current.capture(limitedError(60))
    })
    expect(vi.getTimerCount()).toBe(1)

    act(() => {
      result.current.reset()
    })

    expect(result.current.info).toBeNull()
    expect(result.current.secondsLeft).toBe(0)
    expect(result.current.locked).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('leaves an existing lock untouched when a later error is not a rate limit', () => {
    const { result } = renderHook(() => useRateLimit())
    act(() => {
      result.current.capture(limitedError(60))
    })
    expect(vi.getTimerCount()).toBe(1)

    let captured = true
    act(() => {
      captured = result.current.capture(new Error('network'))
    })

    expect(captured).toBe(false)
    expect(result.current.info).toEqual({ kind: 'limited', retryAfterSeconds: 60 })
    expect(result.current.secondsLeft).toBe(60)
    expect(result.current.locked).toBe(true)
    expect(vi.getTimerCount()).toBe(1)
  })

  it('replaces the previous limit on a repeated capture', () => {
    const { result } = renderHook(() => useRateLimit())
    act(() => {
      result.current.capture(limitedError(30))
    })
    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    act(() => {
      result.current.capture(limitedError(5))
    })

    expect(result.current.info).toEqual({ kind: 'limited', retryAfterSeconds: 5 })
    expect(result.current.secondsLeft).toBe(5)
    expect(result.current.locked).toBe(true)
    expect(vi.getTimerCount()).toBe(1)
  })

  it('reset after an unavailable response is a no-op for the timer', () => {
    const { result } = renderHook(() => useRateLimit())
    act(() => {
      result.current.capture(unavailableError())
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.info).toBeNull()
    expect(result.current.locked).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })
})
