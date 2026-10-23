import { http } from './client'

export interface NotificationItem {
  id: string
  type: string
  message: string
  createdAt: string
  readAt: string | null
  courseId: number | null
  revisionId: number | null
  submissionId: string | null
  resourceAvailable: boolean
  actionUrl: string | null
}

export interface NotificationPage {
  content: NotificationItem[]
  nextCursor: string | null
  hasNext: boolean
  size: number
  unreadCount: number
}

export interface NotificationCount { unreadCount: number }
export interface NotificationRead extends NotificationCount { id: string; readAt: string }

export function getNotifications(cursor?: string, signal?: AbortSignal) {
  return http.get<NotificationPage>('/api/notifications', { params: { size: 20, cursor }, signal })
}

export function getUnreadCount(signal?: AbortSignal) {
  return http.get<NotificationCount>('/api/notifications/unread-count', { signal })
}

export function markNotificationRead(id: string, signal?: AbortSignal) {
  return http.patch<NotificationRead>(`/api/notifications/${encodeURIComponent(id)}/read`, undefined, { signal })
}
