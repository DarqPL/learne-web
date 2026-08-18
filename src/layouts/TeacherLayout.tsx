import { Outlet } from 'react-router-dom'
import { AppShell } from './AppShell'

export function TeacherLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}