import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Camera, Pencil, RefreshCw, Save, Trash2, TriangleAlert, Video, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shadcn/ui/avatar'
import { Badge } from '@/components/shadcn/ui/badge'
import { Button } from '@/components/shadcn/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/shadcn/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/shadcn/ui/field'
import { Input } from '@/components/shadcn/ui/input'
import { Spinner } from '@/components/shadcn/ui/spinner'
import { Textarea } from '@/components/shadcn/ui/textarea'
import { getApiErrorMessage } from '../../lib/api/client'
import {
  deleteTeacherAvatar,
  deleteTeacherIntroductionVideo,
  getTeacherProfile,
  updateTeacherProfile,
  uploadTeacherAvatar,
  uploadTeacherIntroductionVideo,
} from '../../lib/api/teacherApi'
import type { TeacherProfile } from '../../lib/api/types'
import { validateForm } from '../../lib/validation/validateForm'
import { maxLength, numberRange, required } from '../../lib/validation/validators'

const statusLabels: Record<TeacherProfile['status'], string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Ngừng hoạt động',
  SUSPENDED: 'Bị khóa',
}

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'GV'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

const cardSoftClassName = 'border-indigo-100 bg-white/95 shadow-sm shadow-indigo-100/60'

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
  const [mediaAction, setMediaAction] = useState<'avatar' | 'video' | 'delete-avatar' | 'delete-video' | null>(null)

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

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(null)
    setSuccess(null)
    setMediaAction('avatar')
    try {
      const response = await uploadTeacherAvatar(file)
      setProfile(response.data)
      setSuccess('Ảnh đại diện đã được cập nhật.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải ảnh đại diện.'))
    } finally {
      setMediaAction(null)
    }
  }

  const handleAvatarDelete = async () => {
    setError(null)
    setSuccess(null)
    setMediaAction('delete-avatar')
    try {
      const response = await deleteTeacherAvatar()
      setProfile(response.data)
      setSuccess('Ảnh đại diện đã được xóa.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xóa ảnh đại diện.'))
    } finally {
      setMediaAction(null)
    }
  }

  const handleVideoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(null)
    setSuccess(null)
    setMediaAction('video')
    try {
      const response = await uploadTeacherIntroductionVideo(file)
      setProfile(response.data)
      setSuccess('Video giới thiệu đã được cập nhật.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải video giới thiệu.'))
    } finally {
      setMediaAction(null)
    }
  }

  const handleVideoDelete = async () => {
    setError(null)
    setSuccess(null)
    setMediaAction('delete-video')
    try {
      const response = await deleteTeacherIntroductionVideo()
      setProfile(response.data)
      setSuccess('Video giới thiệu đã được xóa.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xóa video giới thiệu.'))
    } finally {
      setMediaAction(null)
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
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-indigo-950">Hồ sơ giảng viên</h1>
        <Alert variant="destructive">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Không thể tải hồ sơ</AlertTitle>
          <AlertDescription>{loadError ?? 'Không thể tải hồ sơ giảng viên.'}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={load}>
            <RefreshCw data-icon="inline-start" aria-hidden="true" />
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-indigo-950">Chỉnh sửa hồ sơ</h1>
        {error ? (
          <div className="mb-4">
            <Alert variant="destructive">
              <TriangleAlert aria-hidden="true" />
              <AlertTitle>Không thể lưu</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : null}
        <Card className={cardSoftClassName}>
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6">
              <FieldGroup className="gap-4">
                <Field data-invalid={fieldErrors.bio ? true : undefined}>
                  <FieldLabel htmlFor="teacher-profile-bio">Giới thiệu</FieldLabel>
                  <Textarea
                    id="teacher-profile-bio"
                    value={bio}
                    aria-invalid={fieldErrors.bio ? true : undefined}
                    onChange={(event) => setBio(event.target.value)}
                    maxLength={2000}
                    rows={5}
                    required
                  />
                  {fieldErrors.bio ? <FieldError>{fieldErrors.bio}</FieldError> : null}
                </Field>
                <Field data-invalid={fieldErrors.expertise ? true : undefined}>
                  <FieldLabel htmlFor="teacher-profile-expertise">Chuyên môn</FieldLabel>
                  <Input
                    id="teacher-profile-expertise"
                    value={expertise}
                    aria-invalid={fieldErrors.expertise ? true : undefined}
                    onChange={(event) => setExpertise(event.target.value)}
                    maxLength={255}
                    required
                    placeholder="Ví dụ: Giao tiếp, Ngữ pháp, IELTS"
                  />
                  {fieldErrors.expertise ? <FieldError>{fieldErrors.expertise}</FieldError> : null}
                </Field>
                <Field data-invalid={fieldErrors.yearsOfExperience ? true : undefined}>
                  <FieldLabel htmlFor="teacher-profile-experience">Số năm kinh nghiệm</FieldLabel>
                  <Input
                    id="teacher-profile-experience"
                    type="number"
                    min={0}
                    max={80}
                    value={yearsOfExperience}
                    aria-invalid={fieldErrors.yearsOfExperience ? true : undefined}
                    onChange={(event) => setYearsOfExperience(event.target.value)}
                    required
                    placeholder="0"
                  />
                  {fieldErrors.yearsOfExperience ? <FieldError>{fieldErrors.yearsOfExperience}</FieldError> : null}
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button type="submit" loading={submitting}>
                <Save data-icon="inline-start" aria-hidden="true" />
                Lưu hồ sơ
              </Button>
              <Button type="button" variant="outline" disabled={submitting} onClick={() => setEditing(false)}>
                <X data-icon="inline-start" aria-hidden="true" />
                Hủy
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-indigo-950">Hồ sơ giảng viên</h1>
      {success ? (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-800">{success}</p>
      ) : null}
      {error ? (
        <div className="mb-4">
          <Alert variant="destructive">
            <TriangleAlert aria-hidden="true" />
            <AlertTitle>Đã xảy ra lỗi</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      ) : null}
      <Card className={cardSoftClassName}>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <Avatar size="lg" className="size-16 border-2 border-indigo-100 bg-indigo-50 text-indigo-700">
              {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt={`Ảnh đại diện của ${profile.fullName}`} /> : null}
              <AvatarFallback className="bg-indigo-100 text-base font-semibold text-indigo-700">
                {getInitials(profile.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-xl">{profile.fullName}</CardTitle>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{profile.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={
                    profile.status === 'ACTIVE'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : profile.status === 'SUSPENDED'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-slate-200 bg-slate-100 text-slate-600'
                  }
                >
                  {statusLabels[profile.status]}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    profile.completed
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700'
                  }
                >
                  {profile.completed ? 'Hồ sơ công khai' : 'Hồ sơ chưa hoàn tất'}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-indigo-500">
                {mediaAction === 'avatar' ? <Spinner className="text-white" /> : <Camera data-icon="inline-start" aria-hidden="true" />}
                {mediaAction === 'avatar' ? 'Đang tải...' : 'Đổi ảnh'}
                <input type="file" accept="image/*" className="sr-only" disabled={mediaAction !== null} onChange={handleAvatarUpload} />
              </label>
              {profile.avatarUrl ? (
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  loading={mediaAction === 'delete-avatar'}
                  disabled={mediaAction !== null}
                  onClick={handleAvatarDelete}
                >
                  <Trash2 data-icon="inline-start" aria-hidden="true" />
                  Xóa ảnh
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <section className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-indigo-950">Video giới thiệu</h3>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-indigo-200 bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50">
                  <Video data-icon="inline-start" aria-hidden="true" />
                  {mediaAction === 'video' ? 'Đang tải...' : profile.introductionVideoUrl ? 'Đổi video' : 'Tải video'}
                  <input type="file" accept="video/*" className="sr-only" disabled={mediaAction !== null} onChange={handleVideoUpload} />
                </label>
                {profile.introductionVideoUrl ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    loading={mediaAction === 'delete-video'}
                    disabled={mediaAction !== null}
                    onClick={handleVideoDelete}
                  >
                    <Trash2 data-icon="inline-start" aria-hidden="true" />
                    Xóa video
                  </Button>
                ) : null}
              </div>
            </div>
            {profile.introductionVideoUrl ? (
              <video className="w-full rounded-xl border border-indigo-100 bg-slate-950" src={profile.introductionVideoUrl} controls />
            ) : (
              <p className="text-sm text-muted-foreground">Chưa cập nhật.</p>
            )}
          </section>
          <section>
            <h3 className="mb-1 text-sm font-semibold text-indigo-950">Giới thiệu</h3>
            <p className="text-sm whitespace-pre-wrap text-slate-700">{profile.bio || 'Chưa cập nhật.'}</p>
          </section>
          <section>
            <h3 className="mb-1 text-sm font-semibold text-indigo-950">Chuyên môn</h3>
            <p className="text-sm text-slate-700">{profile.expertise || 'Chưa cập nhật.'}</p>
          </section>
          <section>
            <h3 className="mb-1 text-sm font-semibold text-indigo-950">Kinh nghiệm</h3>
            <p className="text-sm text-slate-700">{profile.yearsOfExperience} năm kinh nghiệm</p>
          </section>
        </CardContent>
        <CardFooter>
          <Button onClick={startEdit}>
            <Pencil data-icon="inline-start" aria-hidden="true" />
            Chỉnh sửa
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
