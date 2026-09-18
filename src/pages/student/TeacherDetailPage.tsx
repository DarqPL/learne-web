import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../lib/api/client'
import { getTeacherDetail } from '../../lib/api/teacherApi'
import type { TeacherProfile } from '../../lib/api/types'
import { Alert } from '../../components/ui/Alert'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'

export function TeacherDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const teacherId = Number(id)
  const hasInvalidId = !Number.isInteger(teacherId) || teacherId <= 0

  useEffect(() => {
    if (hasInvalidId) return
    let cancelled = false
    void (async () => {
      setProfile(null)
      setError(null)
      try {
        const response = await getTeacherDetail(teacherId)
        if (!cancelled) setProfile(response.data)
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không tìm thấy giảng viên.'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [teacherId, hasInvalidId])

  if (error || hasInvalidId) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Chi tiết giảng viên</h1>
        <Alert>{error ?? 'Không tìm thấy giảng viên.'}</Alert>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => navigate('/student/teachers')}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => navigate('/student/teachers')}>
          Quay lại danh sách
        </Button>
        <Button onClick={() => navigate(`/student/courses?teacherId=${teacherId}`)}>Xem khóa học của giảng viên</Button>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-6 border-b border-gray-200 p-6">
          <Avatar name={profile.fullName} url={profile.avatarUrl} size="lg" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">{profile.fullName}</h1>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <p className="mt-1 text-sm text-gray-700">{profile.expertise}</p>
          </div>
        </div>
        <div className="space-y-6 p-6">
          {profile.introductionVideoUrl ? (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-gray-900">Video giới thiệu</h2>
              <video className="w-full rounded-xl border border-gray-200 bg-black" src={profile.introductionVideoUrl} controls />
            </section>
          ) : null}
          <section>
            <h2 className="mb-1 text-sm font-semibold text-gray-900">Giới thiệu</h2>
            <p className="whitespace-pre-wrap text-sm text-gray-700">{profile.bio}</p>
          </section>
          <section>
            <h2 className="mb-1 text-sm font-semibold text-gray-900">Kinh nghiệm</h2>
            <p className="text-sm text-gray-700">{profile.yearsOfExperience} năm kinh nghiệm</p>
          </section>
        </div>
      </div>
    </div>
  )
}
