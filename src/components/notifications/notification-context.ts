import { createContext, useContext } from 'react'
import type { NotificationItem } from '../../lib/api/notificationApi'

export interface NotificationState {
  open: boolean
  items: NotificationItem[]
  unreadCount: number
  hasNext: boolean
  loading: boolean
  reading: boolean
  error: string | null
}

export interface NotificationActions {
  toggle: () => void
  close: () => void
  refresh: () => void
  loadMore: () => void
  markRead: (id: string) => void
}

export const NotificationContext = createContext<(NotificationState & NotificationActions) | null>(null)

export function useNotifications() {
  const value = useContext(NotificationContext)
  if (!value) throw new Error('useNotifications must be used within NotificationProvider')
  return value
}
