import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../lib/api/client'
import { adminListStudents, adminLockUser, adminUnlockUser } from '../../lib/api/adminApi'
import type { AdminStudentSummary } from '../../lib/api/types'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'

type AccountStatus = 'locked' | 'mustChange' | 'active'

const accountStatusOf = (student: AdminStudentSummary): AccountStatus => {
  if (student.locked) return 'locked'
  if (student.mustChangePassword) return 'mustChange'
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

export function AdminStudentListPage() {
  const [students, setStudents] = useState<AdminStudentSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [actionUserId, setActionUserId] = useState<number | null>(null)

  const load = async () => {
    try {
      const response = await adminListStudents()
      setStudents(response.data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải danh sách học sinh.'))
    }
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await adminListStudents()
        if (!cancelled) setStudents(response.data)
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải danh sách học sinh.'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleToggleLock = async (student: AdminStudentSummary) => {
    const confirmed = window.confirm(
      student.locked
        ? `Bạn có chắc muốn mở khóa tài khoản ${student.fullName} (${student.email})?`
        : `Bạn có chắc muốn khóa tài khoản ${student.fullName} (${student.email})?`,
    )
    if (!confirmed) return
    setActionUserId(student.userId)
    setInfo(null)
    setError(null)
    try {
      if (student.locked) {
        await adminUnlockUser(student.userId)
      } else {
        await adminLockUser(student.userId)
      }
      setInfo(student.locked ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật trạng thái tài khoản.'))
    } finally {
      setActionUserId(null)
    }
  }

  const header = (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-900">Quản lý học sinh</h1>
    </div>
  )

  if (error) {
    return (
      <div>
        {header}
        <Alert>{error}</Alert>
      </div>
    )
  }

  return (
    <div>
      {header}
      {info ? (
        <div className="mb-4">
          <Alert variant="success">{info}</Alert>
        </div>
      ) : null}
      {students === null ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : students.length === 0 ? (
        <p className="text-gray-600">Chưa có học sinh nào.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                {['Họ và tên', 'Email', 'Trạng thái', 'XP', 'Streak', 'Khóa đã đăng ký', 'Bài học hoàn thành', 'Thao tác'].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student) => {
                const accountStatus = accountStatusOf(student)
                return (
                  <tr key={student.userId} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.fullName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${accountStatusStyles[accountStatus]}`}>
                        {accountStatusLabels[accountStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.totalXp}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.currentStreakDays}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.enrollmentCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.completedLessonCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/admin/students/${student.userId}`}
                          className="inline-flex items-center justify-center rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300"
                        >
                          Chi tiết
                        </Link>
                        <Button
                          variant={student.locked ? 'secondary' : 'danger'}
                          loading={actionUserId === student.userId}
                          disabled={actionUserId !== null && actionUserId !== student.userId}
                          onClick={() => handleToggleLock(student)}
                        >
                          {student.locked ? 'Mở khóa' : 'Khóa'}
                        </Button>
                      </div>
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
