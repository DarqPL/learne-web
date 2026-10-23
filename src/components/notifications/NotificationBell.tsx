import { useContext, useEffect, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { NotificationContext } from './notification-context'

export function NotificationBell() {
  const notifications = useContext(NotificationContext)
  const bell = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const titleId = useId()
  const open = notifications?.open ?? false
  const close = notifications?.close

  useEffect(() => {
    if (!open) return
    panel.current?.focus()
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) close?.()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, close])

  if (!notifications) return null
  const { unreadCount, items, loading, reading, error, hasNext, toggle, refresh, loadMore, markRead } = notifications
  const dismiss = () => { close?.(); bell.current?.focus() }

  return (
    <div ref={root} className="relative" onKeyDown={(event) => {
      if (event.key === 'Escape' && open) { event.preventDefault(); dismiss() }
    }} onBlur={(event) => {
      if (open && event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) close?.()
    }}>
      <button ref={bell} type="button" aria-label={`Thông báo, ${unreadCount} chưa đọc`}
        aria-expanded={open} aria-controls={panelId} aria-haspopup="dialog" onClick={toggle}
        className="relative rounded-lg p-2 text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-indigo-600">
        <Bell aria-hidden="true" size={22} />
        {unreadCount > 0 ? <span aria-hidden="true" className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1 text-xs text-white">{unreadCount > 99 ? '99+' : unreadCount}</span> : null}
      </button>
      {open ? (
        <section ref={panel} id={panelId} role="dialog" aria-labelledby={titleId} tabIndex={-1}
          className="absolute -right-32 top-12 z-50 max-h-[75vh] w-[min(24rem,calc(100vw-2rem))] overflow-auto rounded-xl border border-gray-200 bg-white p-4 shadow-xl sm:right-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id={titleId} className="font-semibold text-gray-900">Thông báo</h2>
            <button type="button" onClick={dismiss} className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100">Đóng</button>
          </div>
          {error ? <div role="alert" className="mb-3 text-sm text-red-700">{error} <button type="button" onClick={refresh} className="underline">Thử lại</button></div> : null}
          {loading ? <p role="status" className="text-sm text-gray-500">Đang tải thông báo…</p> : null}
          {!loading && !error && items.length === 0 ? <p className="text-sm text-gray-500">Chưa có thông báo.</p> : null}
          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <li key={item.id} className={`space-y-2 py-3 text-sm ${item.readAt ? 'text-gray-600' : 'font-medium text-gray-900'}`}>
                <p>{item.message}</p>
                <time dateTime={item.createdAt} className="block text-xs font-normal text-gray-500">{new Date(item.createdAt).toLocaleString('vi-VN')}</time>
                <div className="flex flex-wrap items-center gap-3 text-xs font-normal">
                  {item.resourceAvailable && item.actionUrl?.startsWith('/teacher/content/courses/') ? <Link to={item.actionUrl} onClick={dismiss} className="text-indigo-700 underline">Xem khóa học</Link> : <span className="text-gray-500">Nội dung không còn khả dụng</span>}
                  {!item.readAt ? <button type="button" disabled={reading} onClick={() => markRead(item.id)} className="text-indigo-700 underline disabled:opacity-50">Đánh dấu đã đọc</button> : <span>Đã đọc</span>}
                </div>
              </li>
            ))}
          </ul>
          {hasNext ? <button type="button" onClick={loadMore} disabled={loading} className="mt-3 w-full rounded-lg border border-gray-300 p-2 text-sm disabled:opacity-50">Tải thêm</button> : null}
        </section>
      ) : null}
    </div>
  )
}
