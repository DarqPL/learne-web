import { act, fireEvent, render, screen, cleanup } from '@testing-library/react'
import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { NotificationProvider } from './NotificationProvider'
import { NotificationBell } from './NotificationBell'
import { TeacherLayout } from '../../layouts/TeacherLayout'
import { getNotifications, getUnreadCount, markNotificationRead } from '../../lib/api/notificationApi'

const auth = vi.hoisted(() => ({ user: { id: 1, role: 'TEACHER' } as { id: number; role: string } | null }))
vi.mock('../../lib/auth/auth-context', () => ({ useAuth: () => ({ user: auth.user, isInitializing: false }) }))
vi.mock('../../lib/api/notificationApi', () => ({ getNotifications: vi.fn(), getUnreadCount: vi.fn(), markNotificationRead: vi.fn() }))

const item = (id = 'n1', available = true) => ({ id, type: 'COURSE_APPROVED', message: `Kết quả ${id}`, createdAt: '2026-10-20T10:00:00Z', readAt: null, courseId: 7, revisionId: 8, submissionId: 's1', resourceAvailable: available, actionUrl: available ? '/teacher/content/courses/7' : null })
const page = (content = [item()], nextCursor: string | null = null) => ({ data: { content, nextCursor, hasNext: !!nextCursor, size: 20, unreadCount: 42 } })
const deferred = <T,>() => { let resolve!: (value: T) => void; const promise = new Promise<T>((r) => { resolve = r }); return { promise, resolve } }
const flush = async () => { await act(async () => { await Promise.resolve() }) }
const view = () => <MemoryRouter><NotificationProvider><NotificationBell /></NotificationProvider></MemoryRouter>
const open = async () => { fireEvent.click(screen.getByRole('button', { name: /Thông báo/ })); await flush() }
const visibility = (value: 'hidden' | 'visible') => { Object.defineProperty(document, 'visibilityState', { configurable: true, value }); fireEvent(document, new Event('visibilitychange')) }

beforeEach(() => {
  vi.useFakeTimers()
  vi.resetAllMocks()
  auth.user = { id: 1, role: 'TEACHER' }
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
  vi.mocked(getUnreadCount).mockResolvedValue({ data: { unreadCount: 42 } } as never)
  vi.mocked(getNotifications).mockResolvedValue(page() as never)
  vi.mocked(markNotificationRead).mockResolvedValue({ data: { id: 'n1', readAt: '2026-10-20T11:00:00Z', unreadCount: 41 } } as never)
})
afterEach(() => { cleanup(); vi.useRealTimers() })

it('loads the global badge on login without fetching any list pages', async () => {
  render(view()); await flush()
  expect(screen.getByRole('button', { name: 'Thông báo, 42 chưa đọc' })).toHaveAttribute('aria-expanded', 'false')
  expect(getNotifications).not.toHaveBeenCalled()
})

it('polls 30 seconds after each count response without overlapping requests', async () => {
  const pending = deferred<{ data: { unreadCount: number } }>()
  vi.mocked(getUnreadCount).mockReturnValueOnce(pending.promise as never)
  render(view()); await flush()
  await act(async () => { vi.advanceTimersByTime(90_000) })
  expect(getUnreadCount).toHaveBeenCalledTimes(1)
  pending.resolve({ data: { unreadCount: 45 } }); await flush()
  await act(async () => { vi.advanceTimersByTime(29_999) })
  expect(getUnreadCount).toHaveBeenCalledTimes(1)
  await act(async () => { vi.advanceTimersByTime(1) }); await flush()
  expect(getUnreadCount).toHaveBeenCalledTimes(2)
  expect(getNotifications).not.toHaveBeenCalled()
})

it('opens an accessible panel, focuses it, closes with Escape and restores bell focus', async () => {
  render(view()); await flush(); await open()
  const dialog = screen.getByRole('dialog', { name: 'Thông báo' })
  expect(dialog).toHaveFocus()
  expect(screen.getByText('Kết quả n1')).toBeInTheDocument()
  fireEvent.keyDown(dialog, { key: 'Escape' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Thông báo/ })).toHaveFocus()
})

it('loads only the requested cursor and keeps the global badge beyond page one', async () => {
  vi.mocked(getNotifications).mockResolvedValueOnce(page([item()], 'next') as never).mockResolvedValueOnce(page([item('n2')]) as never)
  render(view()); await flush(); await open()
  expect(getNotifications).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: 'Tải thêm' })); await flush()
  expect(getNotifications).toHaveBeenLastCalledWith('next', expect.any(AbortSignal))
  expect(screen.getByText('Kết quả n1')).toBeInTheDocument()
  expect(screen.getByText('Kết quả n2')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Thông báo, 42 chưa đọc' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Tải thêm' })).not.toBeInTheDocument()
})

it('marks a notification read and invalidates both count and the first list page', async () => {
  render(view()); await flush(); await open()
  vi.mocked(getUnreadCount).mockResolvedValue({ data: { unreadCount: 41 } } as never)
  vi.mocked(getNotifications).mockResolvedValue({ data: { ...page().data, content: [{ ...item(), readAt: '2026-10-20T11:00:00Z' }], unreadCount: 41 } } as never)
  fireEvent.click(screen.getByRole('button', { name: 'Đánh dấu đã đọc' })); await flush()
  expect(markNotificationRead).toHaveBeenCalledWith('n1', expect.any(AbortSignal))
  expect(getUnreadCount).toHaveBeenCalledTimes(2)
  expect(getNotifications).toHaveBeenCalledTimes(2)
  expect(screen.queryByRole('button', { name: 'Đánh dấu đã đọc' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Thông báo, 41 chưa đọc' })).toBeInTheDocument()
})

it('shows unavailable resources without a navigation link', async () => {
  vi.mocked(getNotifications).mockResolvedValue(page([item('deleted', false)]) as never)
  render(view()); await flush(); await open()
  expect(screen.getByText('Nội dung không còn khả dụng')).toBeInTheDocument()
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})

it('refreshes on window focus only while the panel is open', async () => {
  render(view()); await flush()
  fireEvent(window, new Event('focus')); await flush()
  expect(getNotifications).not.toHaveBeenCalled()
  await open()
  fireEvent(window, new Event('focus')); await flush()
  expect(getNotifications).toHaveBeenCalledTimes(2)
})

it('aborts hidden work, ignores stale responses, and resumes on visibility', async () => {
  const pending = deferred<ReturnType<typeof page>>()
  vi.mocked(getNotifications).mockReturnValueOnce(pending.promise as never)
  render(view()); await flush(); await open()
  const signal = vi.mocked(getNotifications).mock.calls[0][1]!
  act(() => visibility('hidden'))
  expect(signal.aborted).toBe(true)
  pending.resolve(page([item('stale')])); await flush()
  expect(screen.queryByText('Kết quả stale')).not.toBeInTheDocument()
  await act(async () => { vi.advanceTimersByTime(90_000) })
  expect(getUnreadCount).toHaveBeenCalledTimes(1)
  act(() => visibility('visible')); await flush()
  expect(getUnreadCount).toHaveBeenCalledTimes(2)
  expect(getNotifications).toHaveBeenCalledTimes(2)
})

it('clears old user data immediately and rejects responses from the previous user', async () => {
  const pending = deferred<ReturnType<typeof page>>()
  vi.mocked(getNotifications).mockReturnValueOnce(pending.promise as never)
  const rendered = render(view()); await flush(); await open()
  const signal = vi.mocked(getNotifications).mock.calls[0][1]!
  auth.user = { id: 2, role: 'TEACHER' }; rendered.rerender(view())
  expect(signal.aborted).toBe(true)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  pending.resolve(page([item('private')])); await flush(); await open()
  expect(screen.queryByText('Kết quả private')).not.toBeInTheDocument()
  expect(screen.getByText('Kết quả n1')).toBeInTheDocument()
})

it('stops timers and aborts requests on logout and unmount', async () => {
  const pending = deferred<{ data: { unreadCount: number } }>()
  vi.mocked(getUnreadCount).mockReturnValue(pending.promise as never)
  const rendered = render(view()); await flush()
  const signal = vi.mocked(getUnreadCount).mock.calls[0][0]!
  auth.user = null; rendered.rerender(view())
  expect(signal.aborted).toBe(true)
  expect(screen.queryByRole('button', { name: /Thông báo/ })).not.toBeInTheDocument()
  pending.resolve({ data: { unreadCount: 999 } }); await flush()
  rendered.unmount()
  await act(async () => { vi.advanceTimersByTime(90_000) })
  expect(getUnreadCount).toHaveBeenCalledTimes(1)
})

it('shows retryable list errors after an offline response', async () => {
  vi.mocked(getNotifications).mockRejectedValueOnce(new Error('offline'))
  render(view()); await flush(); await open()
  expect(screen.getByRole('alert')).toHaveTextContent('Không thể tải thông báo')
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' })); await flush()
  expect(screen.getByText('Kết quả n1')).toBeInTheDocument()
})

it('does not create an unauthorized polling or focus retry loop', async () => {
  vi.mocked(getUnreadCount).mockRejectedValue({ response: { status: 401 } })
  render(view()); await flush()
  await act(async () => { vi.advanceTimersByTime(90_000) })
  fireEvent(window, new Event('focus')); await open()
  expect(getUnreadCount).toHaveBeenCalledTimes(1)
  expect(getNotifications).not.toHaveBeenCalled()
})

it('preserves keyboard focus inside the panel when counts update', async () => {
  render(view()); await flush(); await open()
  const readButton = screen.getByRole('button', { name: 'Đánh dấu đã đọc' })
  act(() => readButton.focus())
  await act(async () => { vi.advanceTimersByTime(30_000) }); await flush()
  expect(readButton).toHaveFocus()
})

it('does not fetch while initially hidden or logged out; loads results after login', async () => {
  auth.user = null
  const rendered = render(view()); await flush()
  expect(getUnreadCount).not.toHaveBeenCalled()
  act(() => visibility('hidden'))
  auth.user = { id: 1, role: 'TEACHER' }; rendered.rerender(view()); await flush()
  expect(getUnreadCount).not.toHaveBeenCalled()
  act(() => visibility('visible')); await flush(); await open()
  expect(screen.getByText('Kết quả n1')).toBeInTheDocument()
})

it('retries transient count failures at the normal interval', async () => {
  vi.mocked(getUnreadCount).mockRejectedValueOnce(new Error('offline'))
  render(view()); await flush()
  await act(async () => { vi.advanceTimersByTime(30_000) }); await flush()
  expect(screen.getByRole('button', { name: 'Thông báo, 42 chưa đọc' })).toBeInTheDocument()
  expect(getUnreadCount).toHaveBeenCalledTimes(2)
})

it('aborts a list request when closed and ignores its late response', async () => {
  const pending = deferred<ReturnType<typeof page>>()
  vi.mocked(getNotifications).mockReturnValueOnce(pending.promise as never)
  render(view()); await flush(); await open()
  const signal = vi.mocked(getNotifications).mock.calls[0][1]!
  fireEvent.click(screen.getByRole('button', { name: 'Đóng' }))
  expect(signal.aborted).toBe(true)
  pending.resolve(page([item('late')])); await flush(); await open()
  expect(screen.queryByText('Kết quả late')).not.toBeInTheDocument()
})

it('aborts an in-flight read while hidden and refreshes authoritative data on resume', async () => {
  const pending = deferred<{ data: { id: string; readAt: string; unreadCount: number } }>()
  vi.mocked(markNotificationRead).mockReturnValueOnce(pending.promise as never)
  render(view()); await flush(); await open()
  fireEvent.click(screen.getByRole('button', { name: 'Đánh dấu đã đọc' })); await flush()
  const signal = vi.mocked(markNotificationRead).mock.calls[0][1]!
  act(() => visibility('hidden'))
  expect(signal.aborted).toBe(true)
  pending.resolve({ data: { id: 'n1', readAt: 'now', unreadCount: 0 } }); await flush()
  act(() => visibility('visible')); await flush()
  expect(screen.getByRole('button', { name: 'Thông báo, 42 chưa đọc' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Đánh dấu đã đọc' })).toBeEnabled()
})

it('cancels a pending poll after read and rejects its stale unread count', async () => {
  render(view()); await flush(); await open()
  const pending = deferred<{ data: { unreadCount: number } }>()
  vi.mocked(getUnreadCount).mockReturnValueOnce(pending.promise as never)
  await act(async () => { vi.advanceTimersByTime(30_000) })
  const signal = vi.mocked(getUnreadCount).mock.calls[1][0]!
  vi.mocked(getUnreadCount).mockResolvedValue({ data: { unreadCount: 41 } } as never)
  vi.mocked(getNotifications).mockResolvedValue({ data: { ...page().data, unreadCount: 41 } } as never)
  fireEvent.click(screen.getByRole('button', { name: 'Đánh dấu đã đọc' })); await flush()
  expect(signal.aborted).toBe(true)
  pending.resolve({ data: { unreadCount: 999 } }); await flush()
  expect(screen.getByRole('button', { name: 'Thông báo, 41 chưa đọc' })).toBeInTheDocument()
})

it('cleans up the StrictMode probe and aborts the live request on unmount', async () => {
  const pending = deferred<{ data: { unreadCount: number } }>()
  vi.mocked(getUnreadCount).mockReturnValue(pending.promise as never)
  const rendered = render(<StrictMode>{view()}</StrictMode>); await flush()
  expect(getUnreadCount).toHaveBeenCalledTimes(2)
  expect(vi.mocked(getUnreadCount).mock.calls[0][0]!.aborted).toBe(true)
  const signal = vi.mocked(getUnreadCount).mock.calls[1][0]!
  rendered.unmount()
  expect(signal.aborted).toBe(true)
  pending.resolve({ data: { unreadCount: 999 } }); await flush()
  expect(vi.getTimerCount()).toBe(0)
})

it('does not let an older pending count overwrite a newer page snapshot', async () => {
  const pending = deferred<{ data: { unreadCount: number } }>()
  vi.mocked(getUnreadCount).mockReturnValueOnce(pending.promise as never)
  render(view()); await flush(); await open()
  pending.resolve({ data: { unreadCount: 99 } }); await flush()
  expect(screen.getByRole('button', { name: 'Thông báo, 42 chưa đọc' })).toBeInTheDocument()
})

it('does not let an older pending page overwrite a newer count snapshot', async () => {
  const count = deferred<{ data: { unreadCount: number } }>()
  const list = deferred<ReturnType<typeof page>>()
  vi.mocked(getUnreadCount).mockReturnValueOnce(count.promise as never)
  vi.mocked(getNotifications).mockReturnValueOnce(list.promise as never)
  render(view()); await flush(); await open()
  count.resolve({ data: { unreadCount: 42 } }); await flush()
  await act(async () => { vi.advanceTimersByTime(30_000) }); await flush()
  list.resolve({ data: { ...page().data, unreadCount: 99 } }); await flush()
  expect(screen.getByRole('button', { name: 'Thông báo, 42 chưa đọc' })).toBeInTheDocument()
  expect(getNotifications).toHaveBeenCalledTimes(1)
})

it('mounts a single bell and a single polling owner in TeacherLayout', async () => {
  render(<MemoryRouter><TeacherLayout /></MemoryRouter>); await flush()
  expect(screen.getAllByRole('button', { name: /Thông báo/ })).toHaveLength(1)
  expect(getUnreadCount).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('navigation', { name: 'Điều hướng giảng viên' })).toBeInTheDocument()
})

it('shows a persisted result after remounting following an offline session', async () => {
  const rendered = render(view()); await flush(); rendered.unmount()
  vi.mocked(getNotifications).mockResolvedValue(page([item('saved-result')]) as never)
  render(view()); await flush(); await open()
  expect(screen.getByText('Kết quả saved-result')).toBeInTheDocument()
})

it('keeps unread notifications available to retry when marking read fails', async () => {
  vi.mocked(markNotificationRead).mockRejectedValueOnce(new Error('offline'))
  render(view()); await flush(); await open()
  fireEvent.click(screen.getByRole('button', { name: 'Đánh dấu đã đọc' })); await flush()
  expect(screen.getByRole('alert')).toHaveTextContent('Không thể đánh dấu đã đọc')
  expect(screen.getByRole('button', { name: 'Đánh dấu đã đọc' })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Thông báo, 42 chưa đọc' })).toBeInTheDocument()
})

it('supports outside dismissal and closes when keyboard focus leaves the panel', async () => {
  render(<>{view()}<button>Outside</button></>); await flush(); await open()
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  await open()
  act(() => screen.getByRole('button', { name: 'Outside' }).focus())
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
