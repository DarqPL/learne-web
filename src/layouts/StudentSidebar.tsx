import { NavLink } from 'react-router-dom'

const tabs = [
  { label: 'Tổng quan', to: '/student', end: true },
  { label: 'AI đề xuất khóa học', to: '/student/course-recommendations', end: false },
  { label: 'Kiểm tra ngữ pháp AI', to: '/student/grammar-check', end: false },
  { label: 'Khóa học', to: '/student/courses', end: false },
  { label: 'Khóa đã đăng ký', to: '/student/enrollments', end: false },
  { label: 'Giảng viên', to: '/student/teachers', end: false },
]

export function StudentSidebar() {
  return (
    <aside className="mb-6 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm lg:mb-0 lg:w-64 lg:shrink-0">
      <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="Điều hướng học viên">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
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
