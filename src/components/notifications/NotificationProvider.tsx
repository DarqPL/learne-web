import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../../lib/auth/auth-context'
import { getNotifications, getUnreadCount, markNotificationRead } from '../../lib/api/notificationApi'
import { NotificationContext, type NotificationActions, type NotificationState } from './notification-context'

const initialState: NotificationState = {
  open: false, items: [], unreadCount: 0, hasNext: false, loading: false, reading: false, error: null,
}

function isUnauthorized(error: unknown) {
  return (error as { response?: { status?: number } } | null)?.response?.status === 401
}

// A keyed session prevents even one render of the previous user's notifications.
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isInitializing } = useAuth()
  const identity = !isInitializing && user ? String(user.id) : 'anonymous'
  return <NotificationSession key={identity} authenticated={identity !== 'anonymous'}>{children}</NotificationSession>
}

function NotificationSession({ children, authenticated }: { children: ReactNode; authenticated: boolean }) {
  const [state, setState] = useState<NotificationState>(initialState)
  const actions = useRef<NotificationActions | null>(null)
  const commands = useMemo<NotificationActions>(() => ({
    toggle: () => actions.current?.toggle(),
    close: () => actions.current?.close(),
    refresh: () => actions.current?.refresh(),
    loadMore: () => actions.current?.loadMore(),
    markRead: (id) => actions.current?.markRead(id),
  }), [])

  useEffect(() => {
    if (!authenticated) return
    let disposed = false
    let blocked = false
    let open = false
    let cursor: string | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    let countRequest: AbortController | null = null
    let listRequest: AbortController | null = null
    let readRequest: AbortController | null = null
    // Order count snapshots across endpoints, independent of response arrival order.
    let countVersion = 0
    let appliedCountVersion = 0
    const active = () => !disposed && !blocked && document.visibilityState === 'visible'
    const update = (patch: Partial<NotificationState>) => {
      if (!disposed) setState((current) => ({ ...current, ...patch }))
    }
    const clearTimer = () => { clearTimeout(timer); timer = undefined }
    const cancelList = () => { listRequest?.abort(); listRequest = null }
    const cancelCount = () => { clearTimer(); countRequest?.abort(); countRequest = null }
    const cancelAll = () => {
      cancelCount(); cancelList(); readRequest?.abort(); readRequest = null
    }
    const fail = (error: unknown) => {
      if (isUnauthorized(error)) { blocked = true; cancelAll(); update({ loading: false, reading: false }) }
    }

    const pollCount = async () => {
      if (!active() || countRequest) return
      clearTimer()
      const request = new AbortController()
      countRequest = request
      const version = ++countVersion
      try {
        const { data } = await getUnreadCount(request.signal)
        if (active() && countRequest === request && version >= appliedCountVersion) {
          appliedCountVersion = version
          update({ unreadCount: data.unreadCount })
        }
      } catch (error) {
        if (countRequest === request && !request.signal.aborted) fail(error)
      } finally {
        if (countRequest === request) {
          countRequest = null
          if (active()) timer = setTimeout(() => { void pollCount() }, 30_000)
        }
      }
    }

    const loadList = async (next?: string) => {
      if (!active() || !open || listRequest) return
      const request = new AbortController()
      listRequest = request
      const version = ++countVersion
      update({ loading: true, error: null })
      try {
        const { data } = await getNotifications(next, request.signal)
        if (!active() || listRequest !== request) return
        cursor = data.hasNext ? data.nextCursor : null
        const countPatch = version >= appliedCountVersion ? { unreadCount: data.unreadCount } : {}
        if (version >= appliedCountVersion) appliedCountVersion = version
        setState((current) => {
          const items = next ? [...current.items, ...data.content] : data.content
          return {
            ...current,
            items: [...new Map(items.map((item) => [item.id, item])).values()],
            hasNext: !!cursor,
            ...countPatch,
          }
        })
      } catch (error) {
        if (listRequest === request && !request.signal.aborted) {
          fail(error)
          update({ error: 'Không thể tải thông báo. Vui lòng thử lại.' })
        }
      } finally {
        if (listRequest === request) { listRequest = null; update({ loading: false }) }
      }
    }

    const markRead = async (id: string) => {
      if (!active() || readRequest) return
      const request = new AbortController()
      readRequest = request
      update({ reading: true, error: null })
      try {
        const { data } = await markNotificationRead(id, request.signal)
        if (!active() || readRequest !== request) return
        appliedCountVersion = ++countVersion
        cancelCount(); cancelList()
        setState((current) => ({ ...current, unreadCount: data.unreadCount, loading: false,
          items: current.items.map((item) => item.id === data.id ? { ...item, readAt: data.readAt } : item),
        }))
        void pollCount()
        if (open) void loadList()
      } catch (error) {
        if (readRequest === request && !request.signal.aborted) {
          fail(error)
          update({ error: 'Không thể đánh dấu đã đọc. Vui lòng thử lại.' })
        }
      } finally {
        if (readRequest === request) { readRequest = null; update({ reading: false }) }
      }
    }

    actions.current = {
      toggle: () => {
        open = !open
        update({ open })
        if (open) void loadList()
        else { cancelList(); update({ loading: false }) }
      },
      close: () => { open = false; cancelList(); update({ open: false, loading: false }) },
      refresh: () => { void loadList() },
      loadMore: () => { if (cursor) void loadList(cursor) },
      markRead: (id) => { void markRead(id) },
    }
    const onVisibility = () => {
      if (!active()) { cancelAll(); update({ loading: false, reading: false }); return }
      void pollCount()
      if (open) void loadList()
    }
    const onFocus = () => { if (active()) { void pollCount(); if (open) void loadList() } }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onFocus)
    void pollCount()
    return () => {
      disposed = true
      cancelAll()
      actions.current = null
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onFocus)
    }
  }, [authenticated])

  return <NotificationContext.Provider value={authenticated ? {
    ...state,
    ...commands,
  } : null}>{children}</NotificationContext.Provider>
}
