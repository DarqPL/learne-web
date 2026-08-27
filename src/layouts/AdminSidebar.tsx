import { NavLink } from 'react-router-dom'

const tabs = [
  { label: 'Tổng quan', to: '/admin', end: true },
  { label: 'Quản lý giảng viên', to: '/admin/teachers', end: false },
  { label: 'Kiểm duyệt nội dung', to: '/admin/reviews', end: false },
]

export function AdminSidebar() {
  return (
    <aside className="w-56 shrink-0">
      <nav className="flex flex-col gap-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
