import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { http } from '../../../lib/api/client'
import { useCourseSubmission } from './useCourseSubmission'
import { canEditCourseContent, canSubmitCourse } from './contentUtils'
import type { CourseSubmission, TeacherCourse } from '../../../lib/api/types'

vi.mock('../../../lib/api/client', () => ({ http: { get: vi.fn() } }))
const summary = { id: 's1', courseId: 1, revisionId: 2, status: 'QUEUED' as const, processedQuestions: 0, totalQuestions: 3, createdAt: '', completedAt: null, failureCode: null, message: null }
beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' }) })
afterEach(() => { vi.useRealTimers() })
it.each(['FAILED', 'SUCCEEDED'] as const)('reconciles persisted same-ID %s over observed PROCESSING and aborts the older poll', async (status) => {
  let resolvePoll!: (value: unknown) => void
  vi.mocked(http.get).mockResolvedValueOnce({ data: { ...summary, status: 'PROCESSING' } }).mockImplementationOnce(() => new Promise((resolve) => { resolvePoll = resolve }) as never)
  const done = vi.fn()
  const { result, rerender } = renderHook(({ seed }: { seed: CourseSubmission }) => useCourseSubmission(1, seed, done), { initialProps: { seed: summary as CourseSubmission } })
  await act(async () => { await Promise.resolve() })
  expect(result.current.submission?.status).toBe('PROCESSING')
  await act(async () => { await vi.advanceTimersByTimeAsync(5000) })
  const signal = vi.mocked(http.get).mock.calls[1][1]?.signal
  const terminal = { ...summary, status, completedAt: '2026-10-20T10:00:00Z', message: 'Persisted terminal result' }
  rerender({ seed: terminal })
  expect(result.current.submission).toEqual(terminal)
  expect(result.current.active).toBe(false)
  expect(signal?.aborted).toBe(true)
  await act(async () => { resolvePoll({ data: { ...summary, status: 'PROCESSING' } }); window.dispatchEvent(new Event('focus')); await vi.advanceTimersByTimeAsync(60000) })
  expect(result.current.submission).toEqual(terminal)
  expect(http.get).toHaveBeenCalledTimes(2)
  expect(done).not.toHaveBeenCalled()
})
it('locks editable drafts and submit while the server editing lock is set', () => {
  const course = { status: 'DRAFT', editingLocked: true, hasEditableRevision: true, topics: [] } as unknown as TeacherCourse
  expect(canEditCourseContent(course)).toBe(false)
  expect(canSubmitCourse(course)).toBe(false)
})
it('polls after responses, completes once, and stops on terminal state', async () => {
  const done = vi.fn()
  vi.mocked(http.get).mockResolvedValueOnce({ data: summary }).mockResolvedValue({ data: { ...summary, status: 'SUCCEEDED' } })
  renderHook(() => useCourseSubmission(1, summary, done))
  await act(async () => { await Promise.resolve() })
  expect(http.get).toHaveBeenCalledTimes(1)
  await act(async () => { await vi.advanceTimersByTimeAsync(4999) })
  expect(http.get).toHaveBeenCalledTimes(1)
  await act(async () => { await vi.advanceTimersByTimeAsync(1) })
  expect(done).toHaveBeenCalledTimes(1)
  await act(async () => { await vi.advanceTimersByTimeAsync(60000) })
  expect(http.get).toHaveBeenCalledTimes(2)
})
it('aborts hidden/unmounted requests, resumes on focus, and ignores stale course responses', async () => {
  let resolve!: (value: unknown) => void
  vi.mocked(http.get).mockImplementationOnce(() => new Promise((r) => { resolve = r }) as never).mockResolvedValue({ data: { ...summary, courseId: 2, id: 's2' } })
  const done = vi.fn()
  const { result, rerender, unmount } = renderHook(({ id }) => useCourseSubmission(id, id === 1 ? summary : { ...summary, courseId: 2, id: 's2' }, done), { initialProps: { id: 1 } })
  const signal = vi.mocked(http.get).mock.calls[0][1]?.signal
  await act(async () => { Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' }); document.dispatchEvent(new Event('visibilitychange')) })
  expect(signal?.aborted).toBe(true)
  rerender({ id: 2 })
  await act(async () => { resolve({ data: { ...summary, status: 'SUCCEEDED' } }) })
  expect(result.current.submission?.courseId).toBe(2)
  expect(done).not.toHaveBeenCalled()
  await act(async () => { Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' }); window.dispatchEvent(new Event('focus')) })
  expect(http.get).toHaveBeenCalledTimes(2)
  unmount()
  await act(async () => { await vi.advanceTimersByTimeAsync(60000) })
  expect(http.get).toHaveBeenCalledTimes(2)
})
it('does not retry unauthorized responses', async () => {
  vi.mocked(http.get).mockRejectedValue({ response: { status: 401 } })
  renderHook(() => useCourseSubmission(1, summary, vi.fn()))
  await act(async () => { await vi.advanceTimersByTimeAsync(60000); window.dispatchEvent(new Event('focus')) })
  expect(http.get).toHaveBeenCalledTimes(1)
})
it('replaces an in-flight submission on the same course without accepting its late terminal result', async () => {
  let resolveOld!: (value: unknown) => void
  vi.mocked(http.get).mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve }) as never).mockResolvedValue({ data: { ...summary, id: 's2' } })
  const done = vi.fn()
  const { result, rerender } = renderHook(({ id }) => useCourseSubmission(1, { ...summary, id }, done), { initialProps: { id: 's1' } })
  const oldSignal = vi.mocked(http.get).mock.calls[0][1]?.signal
  rerender({ id: 's2' })
  await act(async () => { resolveOld({ data: { ...summary, status: 'FAILED' } }) })
  expect(oldSignal?.aborted).toBe(true)
  expect(result.current.submission?.id).toBe('s2')
  expect(done).not.toHaveBeenCalled()
  await act(async () => { await vi.advanceTimersByTimeAsync(5000) })
  expect(http.get).toHaveBeenLastCalledWith('/api/teacher/content/courses/1/submissions/s2', expect.anything())
})
it('keeps one request in flight and backs errors off to at most 30 seconds', async () => {
  let reject!: (error: unknown) => void
  vi.mocked(http.get).mockImplementationOnce(() => new Promise((_resolve, r) => { reject = r }) as never).mockRejectedValue(new Error('offline'))
  renderHook(() => useCourseSubmission(1, summary, vi.fn()))
  await act(async () => { await vi.advanceTimersByTimeAsync(60000); window.dispatchEvent(new Event('focus')) })
  expect(http.get).toHaveBeenCalledTimes(1)
  await act(async () => { reject(new Error('offline')) })
  await act(async () => { await vi.advanceTimersByTimeAsync(9999) })
  expect(http.get).toHaveBeenCalledTimes(1)
  await act(async () => { await vi.advanceTimersByTimeAsync(1) })
  expect(http.get).toHaveBeenCalledTimes(2)
  await act(async () => { await vi.advanceTimersByTimeAsync(20000) })
  expect(http.get).toHaveBeenCalledTimes(3)
  await act(async () => { await vi.advanceTimersByTimeAsync(30000) })
  expect(http.get).toHaveBeenCalledTimes(4)
})
