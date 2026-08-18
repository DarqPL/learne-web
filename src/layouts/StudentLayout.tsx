import { Outlet } from 'react-router-dom'
import { AppShell } from './AppShell'

export function StudentLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}