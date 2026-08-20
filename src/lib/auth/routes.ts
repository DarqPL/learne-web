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
}

export function navItemsFor(role: UserRole): NavItem[] {
  switch (role) {
    case 'STUDENT':
      return [
        { label: 'Trang chủ', to: '/student' },
        { label: 'Giảng viên', to: '/student/teachers' },
      ]
    case 'TEACHER':
      return [
        { label: 'Dashboard', to: '/teacher' },
        { label: 'Hồ sơ', to: '/teacher/profile' },
      ]
    case 'ADMIN':
      return []
  }
}
