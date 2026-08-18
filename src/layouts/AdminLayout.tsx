import { Outlet } from 'react-router-dom'
import { AppShell } from './AppShell'

export function AdminLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}