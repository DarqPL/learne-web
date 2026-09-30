import { ChevronDown, Menu } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/shadcn/ui/sheet'

type StudentTopNavLink = {
  label: string
  to: string
  end?: boolean
}

const courseLinks: StudentTopNavLink[] = [
  { label: 'Khám phá khóa học', to: '/student/courses' },
  { label: 'Khóa học đã đăng ký', to: '/student/enrollments' },
  { label: 'Lộ trình học', to: '/student/learning-path' },
  { label: 'Tiến độ học tập', to: '/student/enrollments' },
]

const aiToolLinks: StudentTopNavLink[] = [
  { label: 'AI đề xuất', to: '/student/course-recommendations' },
  { label: 'AI Tutor', to: '/student/ai-tutor' },
  { label: 'Kiểm tra ngữ pháp', to: '/student/grammar-check', end: true },
  { label: 'Lịch sử kiểm tra', to: '/student/grammar-check/history' },
]

const mobileLinks: StudentTopNavLink[] = [
  { label: 'Trang chủ', to: '/student', end: true },
  ...courseLinks,
  ...aiToolLinks,
  { label: 'Giảng viên', to: '/student/teachers' },
]

const desktopLinkClassName = ({ isActive }: { isActive: boolean }) =>
  cn('rounded-lg px-3 py-2 text-sm font-medium transition-colors', isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')

const dropdownTriggerClassName = 'flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900'

function isLinkActive(pathname: string, link: StudentTopNavLink) {
  if (link.end) {
    return pathname === link.to
  }
  return pathname === link.to || pathname.startsWith(`${link.to}/`)
}

function StudentNavDropdown({ label, links }: { label: string; links: StudentTopNavLink[] }) {
  // Uncontrolled Radix dropdown. modal={false} keeps nav non-modal: no
  // scroll-lock or focus-trap, so sibling nav triggers stay reachable.
  const { pathname } = useLocation()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button type="button" className={dropdownTriggerClassName}>
          {label}
          <ChevronDown data-icon="inline-end" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          {links.map((link) => {
            // Radix Slot joins className with string concatenation, so a
            // NavLink function className would be stringified. Compute the
            // active state from the location and pass plain strings instead.
            // aria-current is set manually so it always agrees with the
            // visual active class (do not rely on NavLink internal isActive).
            const isActive = isLinkActive(pathname, link)
            return (
              <DropdownMenuItem key={link.label} asChild className={cn('cursor-pointer', isActive && 'bg-indigo-50 font-medium text-indigo-700')}>
                <NavLink to={link.to} end={link.end} aria-current={isActive ? 'page' : undefined} className="block w-full rounded-sm px-2 py-1.5 text-sm">
                  {link.label}
                </NavLink>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function StudentTopNav() {
  return (
    <nav aria-label="Điều hướng học viên">
      <div className="hidden items-center gap-1 md:flex">
        <NavLink to="/student" end className={desktopLinkClassName}>
          Trang chủ
        </NavLink>

        <StudentNavDropdown label="Khóa học" links={courseLinks} />
        <StudentNavDropdown label="AI Tools" links={aiToolLinks} />

        <NavLink to="/student/teachers" className={desktopLinkClassName}>
          Giảng viên
        </NavLink>
      </div>

      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Mở điều hướng"
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Menu data-icon="inline-start" aria-hidden="true" />
              Menu
            </button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Điều hướng học viên</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 px-4 pb-4">
              {mobileLinks.map((link) => (
                <NavLink key={`${link.label}-${link.to}`} to={link.to} end={link.end} className={desktopLinkClassName}>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
