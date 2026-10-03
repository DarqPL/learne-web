import type { ComponentType } from 'react'
import { BookOpen, LayoutDashboard, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'

type TeacherNavItem = {
  label: string
  to: string
  end: boolean
  icon: ComponentType<{ className?: string; 'aria-hidden'?: 'true' }>
  description: string
}

const tabs: TeacherNavItem[] = [
  { label: 'Dashboard', to: '/teacher', end: true, icon: LayoutDashboard, description: 'Tổng quan giảng dạy' },
  { label: 'Nội dung', to: '/teacher/content', end: false, icon: BookOpen, description: 'Khóa học, bài học, câu hỏi' },
  { label: 'Hồ sơ', to: '/teacher/profile', end: false, icon: UserRound, description: 'Hồ sơ giảng viên' },
]

export function TeacherSidebar() {
  return (
    <aside className="mb-6 rounded-3xl border border-indigo-100 bg-white/95 p-2 shadow-sm shadow-indigo-100/60 ring-1 ring-white lg:sticky lg:top-24 lg:mb-0 lg:max-h-[calc(100vh-7rem)] lg:w-72 lg:shrink-0 lg:overflow-y-auto lg:p-3">
      <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Điều hướng giảng viên">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `group flex min-w-max items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition-all lg:min-w-0 lg:px-4 ${
                isActive
                  ? 'bg-indigo-600 font-semibold text-white shadow-lg shadow-indigo-200'
                  : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700'
              }`
            }
          >
            {({ isActive }) => {
              const Icon = tab.icon

              return (
                <>
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      isActive ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-white'
                    }`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="grid gap-0.5">
                    <span className="whitespace-nowrap leading-5">{tab.label}</span>
                    <span className={`hidden text-xs leading-4 lg:block ${isActive ? 'text-indigo-100' : 'text-gray-500 group-hover:text-indigo-500'}`}>{tab.description}</span>
                  </span>
                </>
              )
            }}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
