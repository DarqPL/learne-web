import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../lib/api/client'
import { adminGetStudent, adminLockUser, adminUnlockUser } from '../../lib/api/adminApi'
import type { AdminStudentDetail, AiTutorPracticeType, EnrollmentStatus } from '../../lib/api/types'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'

const enrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  ACTIVE: 'Đang học',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

const practiceTypeLabels: Record<AiTutorPracticeType, string> = {
  FREE_CHAT: 'Trò chuyện tự do',
  ROLEPLAY: 'Nhập vai',
  WRITING_PRACTICE: 'Luyện viết',
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'Chưa có dữ liệu'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Chưa có dữ liệu'
  return new Intl.DateTimeFormat('vi-VN').format(date)
}

export function AdminStudentDetailPage() {
  const { id } = useParams()
  const userId = Number(id)
  const [student, setStudent] = useState<AdminStudentDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [actionUserId, setActionUserId] = useState<number | null>(null)

  const load = async () => {
    if (!Number.isInteger(userId) || userId <= 0) {
      setError('Mã học sinh không hợp lệ.')
      return
    }
    try {
      const response = await adminGetStudent(userId)
      setStudent(response.data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải thông tin học sinh.'))
    }
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!Number.isInteger(userId) || userId <= 0) {
        if (!cancelled) setError('Mã học sinh không hợp lệ.')
        return
      }
      try {
        const response = await adminGetStudent(userId)
        if (!cancelled) setStudent(response.data)
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải thông tin học sinh.'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const handleToggleLock = async () => {
    if (!student) return
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

  return (
    <div>
      <Link to="/admin/students" className="mb-4 inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
        Quay lại danh sách học sinh
      </Link>

      {error ? (
        <Alert>{error}</Alert>
      ) : student === null ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{student.fullName}</h1>
              <p className="mt-1 text-sm text-gray-600">{student.email}</p>
              <p className="mt-2 text-sm text-gray-600">
                Trạng thái: {student.locked ? 'Bị khóa' : student.mustChangePassword ? 'Chưa đổi mật khẩu' : 'Đang hoạt động'}
              </p>
            </div>
            <Button
              variant={student.locked ? 'secondary' : 'danger'}
              loading={actionUserId === student.userId}
              onClick={handleToggleLock}
            >
              {student.locked ? 'Mở khóa' : 'Khóa'}
            </Button>
          </div>

          {info ? <Alert variant="success">{info}</Alert> : null}

          <div className="grid gap-4 md:grid-cols-4">
            {[
              ['Tổng XP', student.stats.totalXp],
              ['Streak hiện tại', student.stats.currentStreakDays],
              ['Streak dài nhất', student.stats.longestStreakDays],
              ['Khóa đã đăng ký', student.enrollments.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">{label}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Khóa học đã đăng ký</h2>
            {student.enrollments.length === 0 ? (
              <p className="mt-4 text-sm text-gray-600">Chưa có khóa học đã đăng ký</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      {['Khóa học', 'Trạng thái', 'Tiến độ', 'Ngày đăng ký'].map((heading) => (
                        <th key={heading} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {student.enrollments.map((enrollment) => (
                      <tr key={enrollment.enrollmentId}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{enrollment.courseName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{enrollmentStatusLabels[enrollment.status]}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{enrollment.progressPercent}%</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(enrollment.enrolledAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Lượt làm quiz gần đây</h2>
            {student.recentQuizAttempts.length === 0 ? (
              <p className="mt-4 text-sm text-gray-600">Chưa có lượt làm quiz gần đây</p>
            ) : (
              <div className="mt-4 space-y-3">
                {student.recentQuizAttempts.map((attempt) => (
                  <div key={attempt.attemptId} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-gray-900">{attempt.lessonTitle}</p>
                      <span className={attempt.passed ? 'text-sm font-medium text-green-700' : 'text-sm font-medium text-red-700'}>
                        {attempt.passed ? 'Đạt' : 'Chưa đạt'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      Điểm: {attempt.scorePercent}% - {formatDate(attempt.submittedAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Kiểm tra ngữ pháp gần đây</h2>
            {student.recentGrammarChecks.length === 0 ? (
              <p className="mt-4 text-sm text-gray-600">Chưa có lần kiểm tra ngữ pháp gần đây</p>
            ) : (
              <div className="mt-4 space-y-3">
                {student.recentGrammarChecks.map((check) => (
                  <div key={check.id} className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">{formatDate(check.createdAt)}</p>
                    <p className="mt-2 text-sm text-gray-700">Nội dung gốc: {check.originalText}</p>
                    <p className="mt-2 text-sm text-gray-700">Nội dung sửa: {check.correctedText ?? 'Chưa có nội dung sửa'}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Hội thoại AI gần đây</h2>
            {student.recentAiConversations.length === 0 ? (
              <p className="mt-4 text-sm text-gray-600">Chưa có hội thoại AI gần đây</p>
            ) : (
              <div className="mt-4 space-y-3">
                {student.recentAiConversations.map((conversation) => (
                  <div key={conversation.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-gray-900">{conversation.title}</p>
                      <span className="text-sm text-gray-600">{practiceTypeLabels[conversation.practiceType]}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Cập nhật: {formatDate(conversation.updatedAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
