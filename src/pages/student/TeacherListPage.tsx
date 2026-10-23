import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, GraduationCap, TriangleAlert } from 'lucide-react'
import { getApiErrorMessage } from '@/lib/api/client'
import { getTeachers } from '@/lib/api/teacherApi'
import type { TeacherProfileSummary } from '@/lib/api/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shadcn/ui/avatar'
import { Badge } from '@/components/shadcn/ui/badge'
import { Card, CardContent } from '@/components/shadcn/ui/card'
import { Skeleton } from '@/components/shadcn/ui/skeleton'

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return (parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)).toUpperCase()
}

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
        <h1 className="mb-6 text-2xl font-bold text-indigo-950">Đội ngũ giảng viên</h1>
        <Alert variant="destructive">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Không thể tải danh sách giảng viên</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-indigo-950">Đội ngũ giảng viên</h1>
      {teachers === null ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Đang tải danh sách giảng viên">
          {Array.from({ length: 6 }, (_, index) => (
            <Card key={index}>
              <CardContent className="flex items-center gap-4 pt-6">
                <Skeleton className="size-16 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
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
              aria-label={`Xem hồ sơ giảng viên ${teacher.fullName}`}
              className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <Avatar size="lg" className="size-16 border-2 border-indigo-100">
                  {teacher.avatarUrl ? (
                    <AvatarImage src={teacher.avatarUrl} alt={`Ảnh đại diện của ${teacher.fullName}`} />
                  ) : null}
                  <AvatarFallback className="bg-indigo-100 text-base font-semibold text-indigo-700">
                    {getInitials(teacher.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-gray-900">{teacher.fullName}</h2>
                  <p className="truncate text-sm text-gray-500">{teacher.email}</p>
                </div>
              </div>
              <div className="mt-4">
                <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                  <GraduationCap data-icon="inline-start" aria-hidden="true" />
                  {teacher.expertise}
                </Badge>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                <Briefcase aria-hidden="true" className="size-3.5" />
                {teacher.yearsOfExperience} năm kinh nghiệm
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
