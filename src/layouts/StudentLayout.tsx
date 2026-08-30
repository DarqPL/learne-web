import { Outlet } from 'react-router-dom'
import { AppShell } from './AppShell'
import { StudentSidebar } from './StudentSidebar'

export function StudentLayout() {
  return (
    <AppShell>
      <div className="lg:flex lg:gap-6">
        <StudentSidebar />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </AppShell>
  )
}
