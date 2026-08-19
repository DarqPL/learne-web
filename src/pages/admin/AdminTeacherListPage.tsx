import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../lib/api/client'
import { adminListTeachers, adminLockTeacher, adminUnlockTeacher } from '../../lib/api/adminApi'
import type { AdminTeacher } from '../../lib/api/types'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'

type AccountStatus = 'locked' | 'mustChange' | 'active'

const accountStatusOf = (teacher: AdminTeacher): AccountStatus => {
  if (teacher.locked) return 'locked'
  if (teacher.mustChangePassword) return 'mustChange'
  return 'active'
}

const accountStatusLabels: Record<AccountStatus, string> = {
  locked: 'Bị khóa',
  mustChange: 'Chưa đổi mật khẩu',
  active: 'Đang hoạt động',
}

const accountStatusStyles: Record<AccountStatus, string> = {
  locked: 'bg-red-100 text-red-700',
  mustChange: 'bg-amber-100 text-amber-800',
  active: 'bg-green-100 text-green-800',
}

const profileStatusLabels: Record<NonNullable<AdminTeacher['profileStatus']>, string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Ngừng hoạt động',
  SUSPENDED: 'Bị khóa',
}

const profileStatusStyles: Record<NonNullable<AdminTeacher['profileStatus']>, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-700',
  SUSPENDED: 'bg-red-100 text-red-700',
}

export function AdminTeacherListPage() {
  const [teachers, setTeachers] = useState<AdminTeacher[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [actionUserId, setActionUserId] = useState<number | null>(null)

  const load = async () => {
    try {
      const response = await adminListTeachers()
      setTeachers(response.data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải danh sách giảng viên.'))
    }
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await adminListTeachers()
        if (!cancelled) setTeachers(response.data)
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải danh sách giảng viên.'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleToggleLock = async (teacher: AdminTeacher) => {
    const confirmed = window.confirm(
      teacher.locked
        ? `Bạn có chắc muốn mở khóa tài khoản ${teacher.fullName} (${teacher.email})?`
        : `Bạn có chắc muốn khóa tài khoản ${teacher.fullName} (${teacher.email})?`,
    )
    if (!confirmed) return
    setActionUserId(teacher.userId)
    setInfo(null)
    setError(null)
    try {
      if (teacher.locked) {
        await adminUnlockTeacher(teacher.userId)
      } else {
        await adminLockTeacher(teacher.userId)
      }
      setInfo(teacher.locked ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật trạng thái tài khoản.'))
    } finally {
      setActionUserId(null)
    }
  }

  if (error) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Quản lý giảng viên</h1>
        <Alert>{error}</Alert>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Quản lý giảng viên</h1>
      {info ? (
        <div className="mb-4">
          <Alert variant="success">{info}</Alert>
        </div>
      ) : null}
      {teachers === null ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : teachers.length === 0 ? (
        <p className="text-gray-600">Chưa có giảng viên nào.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                {['Họ và tên', 'Email', 'Trạng thái tài khoản', 'Trạng thái hồ sơ', 'Hồ sơ công khai', 'Thao tác'].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teachers.map((teacher) => {
                const accountStatus = accountStatusOf(teacher)
                return (
                  <tr key={teacher.userId} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{teacher.fullName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{teacher.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${accountStatusStyles[accountStatus]}`}>
                        {accountStatusLabels[accountStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {teacher.profileStatus ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${profileStatusStyles[teacher.profileStatus]}`}
                        >
                          {profileStatusLabels[teacher.profileStatus]}
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Chưa tạo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          teacher.completed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {teacher.completed ? 'Công khai' : 'Chưa hoàn tất'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant={teacher.locked ? 'secondary' : 'danger'}
                        loading={actionUserId === teacher.userId}
                        disabled={actionUserId !== null && actionUserId !== teacher.userId}
                        onClick={() => handleToggleLock(teacher)}
                      >
                        {teacher.locked ? 'Mở khóa' : 'Khóa'}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}