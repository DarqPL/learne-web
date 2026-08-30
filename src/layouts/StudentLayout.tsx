import { Outlet } from 'react-router-dom'
import { AppShell } from './AppShell'
import { StudentSidebar } from './StudentSidebar'

export function StudentLayout() {
  return (
    <AppShell>
      <div className="lg:flex lg:gap-6">
        <StudentSidebar />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </AppShell>
  )
}
