import { NavLink } from 'react-router-dom'

const tabs = [
  { label: 'Tổng quan', to: '/admin', end: true },
  { label: 'Quản lý giảng viên', to: '/admin/teachers', end: false },
]

export function AdminTabs() {
  return (
    <nav className="border-b border-gray-200">
      <div className="mx-auto flex max-w-6xl gap-1 px-4">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `-mb-px border-b-2 px-4 py-2.5 text-sm font-medium ${
                isActive
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}