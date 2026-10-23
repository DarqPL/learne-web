import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shadcn/ui/avatar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/shadcn/ui/breadcrumb'
import { Button } from '@/components/shadcn/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/ui/card'
import { Spinner } from '@/components/shadcn/ui/spinner'
import { getApiErrorMessage } from '../../lib/api/client'
import { getTeacherDetail } from '../../lib/api/teacherApi'
import type { TeacherProfile } from '../../lib/api/types'

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'GV'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

const cardSoftClassName = 'border-indigo-100 bg-white/95 shadow-sm shadow-indigo-100/60'

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
      <div className="mx-auto max-w-2xl">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/student/teachers">Giảng viên</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Chi tiết giảng viên</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="mb-6 mt-2 text-2xl font-bold text-indigo-950">Chi tiết giảng viên</h1>
        <Alert variant="destructive">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Không thể tải hồ sơ giảng viên</AlertTitle>
          <AlertDescription>{error ?? 'Không tìm thấy giảng viên.'}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => navigate('/student/teachers')}>
            <ArrowLeft data-icon="inline-start" aria-hidden="true" />
            Quay lại danh sách
          </Button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/student/teachers">Giảng viên</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Chi tiết giảng viên</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex justify-center py-16" aria-label="Đang tải hồ sơ giảng viên">
          <Spinner />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/student/teachers">Giảng viên</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Chi tiết giảng viên</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="mb-6 mt-2 text-2xl font-bold text-indigo-950">Chi tiết giảng viên</h1>
      <div className="mb-4 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => navigate('/student/teachers')}>
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          Quay lại danh sách
        </Button>
        <Button onClick={() => navigate(`/student/courses?teacherId=${teacherId}`)}>
          <BookOpen data-icon="inline-start" aria-hidden="true" />
          Xem khóa học của giảng viên
        </Button>
      </div>
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <section className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-indigo-950">Video giới thiệu</h3>
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
      </Card>
    </div>
  )
}
