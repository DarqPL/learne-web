import { useEffect, useState, type FormEvent } from 'react'
import { getApiErrorMessage } from '../../lib/api/client'
import { getTeacherProfile, updateTeacherProfile } from '../../lib/api/teacherApi'
import type { TeacherProfile } from '../../lib/api/types'
import { Alert } from '../../components/ui/Alert'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { Textarea } from '../../components/ui/Textarea'
import { validateForm } from '../../lib/validation/validateForm'
import { maxLength, numberRange, required } from '../../lib/validation/validators'

const statusLabels: Record<TeacherProfile['status'], string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Ngừng hoạt động',
  SUSPENDED: 'Bị khóa',
}

const statusStyles: Record<TeacherProfile['status'], string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-700',
  SUSPENDED: 'bg-red-100 text-red-700',
}

export function TeacherProfilePage() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [expertise, setExpertise] = useState('')
  const [yearsOfExperience, setYearsOfExperience] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const response = await getTeacherProfile()
      setProfile(response.data)
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Không thể tải hồ sơ giảng viên.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await getTeacherProfile()
        if (!cancelled) setProfile(response.data)
      } catch (err) {
        if (!cancelled) setLoadError(getApiErrorMessage(err, 'Không thể tải hồ sơ giảng viên.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const startEdit = () => {
    if (!profile) return
    setBio(profile.bio)
    setExpertise(profile.expertise)
    setYearsOfExperience(String(profile.yearsOfExperience))
    setFieldErrors({})
    setError(null)
    setSuccess(null)
    setEditing(true)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const errors = validateForm(
      { bio, expertise, yearsOfExperience },
      {
        bio: [required('Vui lòng nhập giới thiệu.'), maxLength(2000, 'Giới thiệu tối đa 2000 ký tự.')],
        expertise: [required('Vui lòng nhập chuyên môn.'), maxLength(255, 'Chuyên môn tối đa 255 ký tự.')],
        yearsOfExperience: [required(), numberRange(0, 80)],
      },
    )
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setError(null)
    setSubmitting(true)
    try {
      const response = await updateTeacherProfile({
        bio,
        expertise,
        yearsOfExperience: Number(yearsOfExperience),
      })
      setProfile(response.data)
      setEditing(false)
      setSuccess('Hồ sơ đã được lưu.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể lưu hồ sơ.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  if (loadError || !profile) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Hồ sơ giảng viên</h1>
        <Alert>{loadError ?? 'Không thể tải hồ sơ giảng viên.'}</Alert>
        <div className="mt-4">
          <Button variant="secondary" onClick={load}>
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Chỉnh sửa hồ sơ</h1>
        {error ? (
          <div className="mb-4">
            <Alert>{error}</Alert>
          </div>
        ) : null}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <Field label="Giới thiệu" error={fieldErrors.bio}>
            <Textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={2000} rows={5} required />
          </Field>
          <Field label="Chuyên môn" error={fieldErrors.expertise}>
            <Input
              value={expertise}
              onChange={(event) => setExpertise(event.target.value)}
              maxLength={255}
              required
              placeholder="Ví dụ: Giao tiếp, Ngữ pháp, IELTS"
            />
          </Field>
          <Field label="Số năm kinh nghiệm" error={fieldErrors.yearsOfExperience}>
            <Input
              type="number"
              min={0}
              max={80}
              value={yearsOfExperience}
              onChange={(event) => setYearsOfExperience(event.target.value)}
              required
              placeholder="0"
            />
          </Field>
          <div className="flex gap-3">
            <Button type="submit" loading={submitting}>
              Lưu hồ sơ
            </Button>
            <Button type="button" variant="secondary" disabled={submitting} onClick={() => setEditing(false)}>
              Hủy
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Hồ sơ giảng viên</h1>
      {success ? (
        <div className="mb-4">
          <Alert variant="success">{success}</Alert>
        </div>
      ) : null}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-6 border-b border-gray-200 p-6">
          <Avatar name={profile.fullName} url={profile.avatarUrl} size="lg" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile.fullName}</h2>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <div className="mt-2 flex gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[profile.status]}`}>
                {statusLabels[profile.status]}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  profile.completed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {profile.completed ? 'Hồ sơ công khai' : 'Hồ sơ chưa hoàn tất'}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-6 p-6">
          <section>
            <h3 className="mb-1 text-sm font-semibold text-gray-900">Giới thiệu</h3>
            <p className="whitespace-pre-wrap text-sm text-gray-700">{profile.bio || 'Chưa cập nhật.'}</p>
          </section>
          <section>
            <h3 className="mb-1 text-sm font-semibold text-gray-900">Chuyên môn</h3>
            <p className="text-sm text-gray-700">{profile.expertise || 'Chưa cập nhật.'}</p>
          </section>
          <section>
            <h3 className="mb-1 text-sm font-semibold text-gray-900">Kinh nghiệm</h3>
            <p className="text-sm text-gray-700">{profile.yearsOfExperience} năm kinh nghiệm</p>
          </section>
        </div>
        <div className="border-t border-gray-200 p-6">
          <Button onClick={startEdit}>Chỉnh sửa</Button>
        </div>
      </div>
    </div>
  )
}
