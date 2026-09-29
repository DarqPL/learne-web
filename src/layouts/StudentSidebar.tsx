import type { ComponentType } from 'react'
import { BookOpen, Bot, CreditCard, FileCheck2, GraduationCap, LayoutDashboard, Sparkles, UsersRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'

type StudentNavItem = {
  label: string
  to: string
  end: boolean
  icon: ComponentType<{ className?: string; 'aria-hidden'?: 'true' }>
  description: string
}

const tabs: StudentNavItem[] = [
  { label: 'Tổng quan', to: '/student', end: true, icon: LayoutDashboard, description: 'AI Learning Hub' },
  { label: 'AI đề xuất', to: '/student/course-recommendations', end: false, icon: Sparkles, description: 'Khóa học phù hợp' },
  { label: 'Kiểm tra ngữ pháp AI', to: '/student/grammar-check', end: false, icon: FileCheck2, description: 'Sửa lỗi văn bản' },
  { label: 'AI Tutor', to: '/student/ai-tutor', end: false, icon: Bot, description: 'Luyện hội thoại' },
  { label: 'Khóa học', to: '/student/courses', end: false, icon: BookOpen, description: 'Khám phá nội dung' },
  { label: 'Khóa đã đăng ký', to: '/student/enrollments', end: false, icon: GraduationCap, description: 'Tiếp tục học' },
  { label: 'Gói học', to: '/student/subscription', end: false, icon: CreditCard, description: 'VIP, PRO, Pro+' },
  { label: 'Giảng viên', to: '/student/teachers', end: false, icon: UsersRound, description: 'Chọn người hướng dẫn' },
]

export function StudentSidebar() {
  return (
    <aside className="mb-6 rounded-3xl border border-indigo-100 bg-white/95 p-2 shadow-sm shadow-indigo-100/60 ring-1 ring-white lg:sticky lg:top-24 lg:mb-0 lg:max-h-[calc(100vh-7rem)] lg:w-72 lg:shrink-0 lg:overflow-y-auto lg:p-3">
      <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Điều hướng học viên">
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
                    <Icon className="h-5 w-5" aria-hidden="true" />
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
