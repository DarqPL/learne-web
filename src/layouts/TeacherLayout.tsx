import { Outlet } from 'react-router-dom'
import { AppShell } from './AppShell'
import { TeacherSidebar } from './TeacherSidebar'

export function TeacherLayout() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <TeacherSidebar />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </AppShell>
  )
}
