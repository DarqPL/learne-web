import type { UserRole } from '../api/types'

export function homePathFor(role: UserRole): string {
  switch (role) {
    case 'STUDENT':
      return '/student'
    case 'TEACHER':
      return '/teacher'
    case 'ADMIN':
      return '/admin'
  }
}

export interface NavItem {
  label: string
  to: string
  end?: boolean
}

export function navItemsFor(role: UserRole): NavItem[] {
  switch (role) {
    case 'STUDENT':
      return [
        { label: 'Trang chủ', to: '/student', end: true },
        { label: 'Giảng viên', to: '/student/teachers' },
      ]
    case 'TEACHER':
      return [
        { label: 'Dashboard', to: '/teacher', end: true },
        { label: 'Nội dung học tập', to: '/teacher/content' },
        { label: 'Hồ sơ', to: '/teacher/profile' },
      ]
    case 'ADMIN':
      return []
  }
}
