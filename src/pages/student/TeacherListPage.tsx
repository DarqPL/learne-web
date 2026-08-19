import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../lib/api/client'
import { getTeachers } from '../../lib/api/teacherApi'
import type { TeacherProfileSummary } from '../../lib/api/types'
import { Alert } from '../../components/ui/Alert'
import { Avatar } from '../../components/ui/Avatar'
import { Spinner } from '../../components/ui/Spinner'

export function TeacherListPage() {
  const navigate = useNavigate()
  const [teachers, setTeachers] = useState<TeacherProfileSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await getTeachers()
        if (!cancelled) setTeachers(response.data)
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải danh sách giảng viên.'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Đội ngũ giảng viên</h1>
        <Alert>{error}</Alert>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Đội ngũ giảng viên</h1>
      {teachers === null ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : teachers.length === 0 ? (
        <p className="text-gray-600">Chưa có giảng viên nào.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map((teacher) => (
            <button
              key={teacher.teacherId}
              type="button"
              onClick={() => navigate(`/student/teachers/${teacher.teacherId}`)}
              className="rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-colors hover:border-indigo-200 hover:shadow"
            >
              <div className="flex items-center gap-4">
                <Avatar name={teacher.fullName} url={teacher.avatarUrl} size="md" />
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-gray-900">{teacher.fullName}</h2>
                  <p className="truncate text-sm text-gray-500">{teacher.email}</p>
                </div>
              </div>
              <p className="mt-4 line-clamp-2 text-sm text-gray-700">{teacher.expertise}</p>
              <p className="mt-2 text-xs text-gray-500">{teacher.yearsOfExperience} năm kinh nghiệm</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
