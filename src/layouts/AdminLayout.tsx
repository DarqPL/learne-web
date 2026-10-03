import { Outlet } from 'react-router-dom'
import { AdminSidebar } from './AdminSidebar'
import { AppShell } from './AppShell'

export function AdminLayout() {
  return (
    <AppShell fullWidth>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <AdminSidebar />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </AppShell>
  )
}