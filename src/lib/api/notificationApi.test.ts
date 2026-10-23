import { expect, it, vi } from 'vitest'
import { http } from './client'
import { getNotifications, getUnreadCount, markNotificationRead } from './notificationApi'

vi.mock('./client', () => ({ http: { get: vi.fn(), patch: vi.fn() } }))

it('uses the notification endpoints and forwards cursors and abort signals', async () => {
  const signal = new AbortController().signal
  const response = { data: { unreadCount: 42 } }
  vi.mocked(http.get).mockResolvedValue(response)
  vi.mocked(http.patch).mockResolvedValue(response)
  expect(await getNotifications('opaque', signal)).toBe(response)
  expect(http.get).toHaveBeenCalledWith('/api/notifications', { params: { size: 20, cursor: 'opaque' }, signal })
  expect(await getUnreadCount(signal)).toBe(response)
  expect(http.get).toHaveBeenCalledWith('/api/notifications/unread-count', { signal })
  expect(await markNotificationRead('n1', signal)).toBe(response)
  expect(http.patch).toHaveBeenCalledWith('/api/notifications/n1/read', undefined, { signal })
})
