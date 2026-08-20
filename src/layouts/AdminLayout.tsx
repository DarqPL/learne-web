import { Outlet } from 'react-router-dom'
import { AdminTabs } from './AdminTabs'
import { AppShell } from './AppShell'

export function AdminLayout() {
  return (
    <AppShell>
      <AdminTabs />
      <Outlet />
    </AppShell>
  )
}