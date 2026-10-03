import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TriangleAlert, XCircle } from 'lucide-react'
import { getApiErrorMessage } from '../../lib/api/client'
import { adminGetStudent, adminLockUser, adminUnlockUser } from '../../lib/api/adminApi'
import type { AdminStudentDetail, AiTutorPracticeType, EnrollmentStatus } from '../../lib/api/types'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/shadcn/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '../../components/shadcn/ui/alert'
import { Badge } from '../../components/shadcn/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../components/shadcn/ui/breadcrumb'
import { Button } from '../../components/shadcn/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/shadcn/ui/card'
import { Skeleton } from '../../components/shadcn/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/shadcn/ui/table'

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
  const [lockTarget, setLockTarget] = useState<AdminStudentDetail | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const load = useCallback(async () => {
    if (!Number.isInteger(userId) || userId <= 0) {
      setError('Mã học sinh không hợp lệ.')
      return
    }
    try {
      const response = await adminGetStudent(userId)
      setStudent(response.data)
      setError(null)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải thông tin học sinh.'))
    }
  }, [userId])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!Number.isInteger(userId) || userId <= 0) {
        if (!cancelled) setError('Mã học sinh không hợp lệ.')
        return
      }
      try {
        const response = await adminGetStudent(userId)
        if (!cancelled) {
          setStudent(response.data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải thông tin học sinh.'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const handleOpenLock = useCallback((target: AdminStudentDetail) => {
    setDialogError(null)
    setLockTarget(target)
  }, [])

  const handleConfirmLock = useCallback(() => {
    if (!lockTarget || processing) return
    setProcessing(true)
    setDialogError(null)
    void (async () => {
      try {
        if (lockTarget.locked) {
          await adminUnlockUser(lockTarget.userId)
        } else {
          await adminLockUser(lockTarget.userId)
        }
        setInfo(lockTarget.locked ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.')
        setLockTarget(null)
        await load()
      } catch (err) {
        setDialogError(getApiErrorMessage(err, 'Không thể cập nhật trạng thái tài khoản.'))
      } finally {
        setProcessing(false)
      }
    })()
  }, [lockTarget, processing, load])

  const accountStatus = student
    ? student.locked
      ? { label: 'Bị khóa', className: 'border-red-200 bg-red-50 text-red-700' }
      : student.mustChangePassword
        ? { label: 'Chưa đổi mật khẩu', className: 'border-amber-200 bg-amber-50 text-amber-800' }
        : { label: 'Đang hoạt động', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' }
    : null

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="flex flex-col gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/admin/students">Quản lý học sinh</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{student?.fullName ?? 'Chi tiết học sinh'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </section>

      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <XCircle aria-hidden="true" data-icon="inline-start" />
          <AlertTitle>Không thể tải thông tin học sinh</AlertTitle>
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      ) : student === null ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-28 w-full" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-gray-950">{student.fullName}</h1>
                <p className="mt-1 text-sm text-gray-600">{student.email}</p>
                <div className="mt-2">
                  {accountStatus ? (
                    <Badge variant="outline" className={accountStatus.className}>
                      {accountStatus.label}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <Button variant={student.locked ? 'secondary' : 'destructive'} onClick={() => handleOpenLock(student)}>
                {student.locked ? 'Mở khóa' : 'Khóa'}
              </Button>
            </CardContent>
          </Card>

          {info ? (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
              <AlertTitle>Thành công</AlertTitle>
              <AlertDescription className="text-emerald-700">{info}</AlertDescription>
            </Alert>
          ) : null}

          <section className="grid gap-4 md:grid-cols-4" aria-label="Thống kê học tập">
            {[
              { label: 'Tổng XP', value: student.stats.totalXp },
              { label: 'Streak hiện tại', value: student.stats.currentStreakDays },
              { label: 'Streak dài nhất', value: student.stats.longestStreakDays },
              { label: 'Khóa đã đăng ký', value: student.enrollments.length },
            ].map((item) => (
              <Card key={item.label}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">{item.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-950">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Khóa học đã đăng ký</CardTitle>
            </CardHeader>
            <CardContent>
              {student.enrollments.length === 0 ? (
                <p className="text-sm text-gray-600">Chưa có khóa học đã đăng ký</p>
              ) : (
                <div className="[&>[data-slot=table-container]]:max-h-[50vh] [&>[data-slot=table-container]]:overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 [&_th]:bg-gray-50">
                      <TableRow>
                        <TableHead>Khóa học</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Tiến độ</TableHead>
                        <TableHead>Ngày đăng ký</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {student.enrollments.map((enrollment) => (
                        <TableRow key={enrollment.enrollmentId}>
                          <TableCell className="font-medium">{enrollment.courseName}</TableCell>
                          <TableCell>{enrollmentStatusLabels[enrollment.status]}</TableCell>
                          <TableCell>{enrollment.progressPercent}%</TableCell>
                          <TableCell>{formatDate(enrollment.enrolledAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lượt làm quiz gần đây</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {student.recentQuizAttempts.length === 0 ? (
                <p className="text-sm text-gray-600">Chưa có lượt làm quiz gần đây</p>
              ) : (
                student.recentQuizAttempts.map((attempt) => (
                  <div key={attempt.attemptId} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-gray-900">{attempt.lessonTitle}</p>
                      <Badge
                        variant="outline"
                        className={attempt.passed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}
                      >
                        {attempt.passed ? 'Đạt' : 'Chưa đạt'}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      Điểm: {attempt.scorePercent}% - {formatDate(attempt.submittedAt)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kiểm tra ngữ pháp gần đây</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {student.recentGrammarChecks.length === 0 ? (
                <p className="text-sm text-gray-600">Chưa có lần kiểm tra ngữ pháp gần đây</p>
              ) : (
                student.recentGrammarChecks.map((check) => (
                  <div key={check.id} className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">{formatDate(check.createdAt)}</p>
                    <p className="mt-2 text-sm text-gray-700">Nội dung gốc: {check.originalText}</p>
                    <p className="mt-2 text-sm text-gray-700">Nội dung sửa: {check.correctedText ?? 'Chưa có nội dung sửa'}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hội thoại AI gần đây</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {student.recentAiConversations.length === 0 ? (
                <p className="text-sm text-gray-600">Chưa có hội thoại AI gần đây</p>
              ) : (
                student.recentAiConversations.map((conversation) => (
                  <div key={conversation.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-gray-900">{conversation.title}</p>
                      <span className="text-sm text-gray-600">{practiceTypeLabels[conversation.practiceType]}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Cập nhật: {formatDate(conversation.updatedAt)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog
        open={lockTarget !== null}
        onOpenChange={(open) => {
          if (processing) return
          if (!open) {
            setLockTarget(null)
            setDialogError(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <TriangleAlert className="size-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <AlertDialogTitle>
                  {lockTarget?.locked ? `Mở khóa tài khoản ${lockTarget?.fullName}` : `Khóa tài khoản ${lockTarget?.fullName}`}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {lockTarget?.locked ? (
                    <>
                      Mở khóa tài khoản <span className="font-semibold text-gray-900">{lockTarget?.fullName}</span> (
                      {lockTarget?.email})?
                      <span className="mt-2 block rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                        Học viên sẽ có thể đăng nhập trở lại.
                      </span>
                    </>
                  ) : (
                    <>
                      Khóa tài khoản <span className="font-semibold text-gray-900">{lockTarget?.fullName}</span> (
                      {lockTarget?.email})?
                      <span className="mt-2 block rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                        Học viên sẽ không thể đăng nhập cho đến khi được mở khóa.
                      </span>
                    </>
                  )}
                </AlertDialogDescription>
                {dialogError ? (
                  <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
                    <XCircle aria-hidden="true" data-icon="inline-start" />
                    <AlertTitle>Không thể cập nhật trạng thái tài khoản</AlertTitle>
                    <AlertDescription className="text-red-700">{dialogError}</AlertDescription>
                  </Alert>
                ) : null}
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={processing}>
                Hủy
              </Button>
            </AlertDialogCancel>
            {lockTarget?.locked ? (
              <Button variant="secondary" loading={processing} disabled={processing} onClick={() => void handleConfirmLock()}>
                Mở khóa
              </Button>
            ) : (
              <Button variant="destructive" loading={processing} disabled={processing} onClick={() => void handleConfirmLock()}>
                Khóa
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
