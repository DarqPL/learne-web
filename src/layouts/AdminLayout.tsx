import { Outlet } from 'react-router-dom'
import { AdminSidebar } from './AdminSidebar'
import { AppShell } from './AppShell'

export function AdminLayout() {
  return (
    <AppShell>
      <div className="flex gap-8">
        <AdminSidebar />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </AppShell>
  )
}