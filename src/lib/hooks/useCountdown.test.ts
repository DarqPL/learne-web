import { StrictMode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCountdown } from './useCountdown'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-22T10:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useCountdown', () => {
  it('sets the initial value synchronously', () => {
    const { result } = renderHook(() => useCountdown())

    act(() => result.current.start(300))

    expect(result.current.secondsLeft).toBe(300)
  })

  it('decrements from the deadline, not from the number of ticks', () => {
    const { result } = renderHook(() => useCountdown())
    act(() => result.current.start(300))

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.secondsLeft).toBe(299)
  })

  it('derives the remaining value from the deadline after a clock jump', () => {
    const { result } = renderHook(() => useCountdown())
    act(() => result.current.start(300))

    vi.setSystemTime(Date.now() + 30_000)
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.secondsLeft).toBe(269)
  })

  it('stops at zero', () => {
    const { result } = renderHook(() => useCountdown())
    act(() => result.current.start(2))

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current.secondsLeft).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('replaces the previous deadline on a repeated start', () => {
    const { result } = renderHook(() => useCountdown())
    act(() => result.current.start(300))
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    act(() => result.current.start(10))
    expect(result.current.secondsLeft).toBe(10)
    expect(vi.getTimerCount()).toBe(1)

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.secondsLeft).toBe(9)
  })

  it('starts at zero without scheduling a timer', () => {
    const { result } = renderHook(() => useCountdown())

    act(() => result.current.start(0))

    expect(result.current.secondsLeft).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('start(0) clears an already running timer', () => {
    const { result } = renderHook(() => useCountdown())
    act(() => result.current.start(60))
    expect(vi.getTimerCount()).toBe(1)

    act(() => result.current.start(0))

    expect(result.current.secondsLeft).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('stop clears the timer and resets the value', () => {
    const { result } = renderHook(() => useCountdown())
    act(() => result.current.start(60))

    act(() => result.current.stop())

    expect(result.current.secondsLeft).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('clears the interval on unmount', () => {
    const { result, unmount } = renderHook(() => useCountdown())
    act(() => result.current.start(60))
    expect(vi.getTimerCount()).toBe(1)

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not schedule a timer when started after unmount', () => {
    const { result, unmount } = renderHook(() => useCountdown())
    unmount()

    act(() => result.current.start(60))

    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps start working after the StrictMode effect cycle', () => {
    const { result } = renderHook(() => useCountdown(), { wrapper: StrictMode })

    act(() => result.current.start(10))

    expect(result.current.secondsLeft).toBe(10)
    expect(vi.getTimerCount()).toBe(1)
  })
})
