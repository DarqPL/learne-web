import { Outlet } from 'react-router-dom'
import { AppShell } from './AppShell'
import { TeacherSidebar } from './TeacherSidebar'
import { NotificationProvider } from '../components/notifications/NotificationProvider'
import { NotificationBell } from '../components/notifications/NotificationBell'

export function TeacherLayout() {
  return (
    <NotificationProvider>
      <AppShell headerActions={<NotificationBell />}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <TeacherSidebar />
          <div className="min-w-0 flex-1">
            <Outlet />
          </div>
        </div>
      </AppShell>
    </NotificationProvider>
  )
}
