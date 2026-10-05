import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Eye, Lock, LockOpen, TriangleAlert, XCircle } from 'lucide-react'
import { getApiErrorMessage } from '../../lib/api/client'
import { adminListStudents, adminLockUser, adminUnlockUser } from '../../lib/api/adminApi'
import type { AdminStudentSummary } from '../../lib/api/types'
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
  BreadcrumbList,
  BreadcrumbPage,
} from '../../components/shadcn/ui/breadcrumb'
import { Button } from '../../components/shadcn/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from '../../components/shadcn/ui/pagination'
import { Skeleton } from '../../components/shadcn/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/shadcn/ui/table'

const PAGE_SIZE = 6

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

const accountStatusBadgeClassNames: Record<AccountStatus, string> = {
  locked: 'border-red-200 bg-red-50 text-red-700',
  mustChange: 'border-amber-200 bg-amber-50 text-amber-800',
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

export function AdminStudentListPage() {
  const [students, setStudents] = useState<AdminStudentSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [lockTarget, setLockTarget] = useState<AdminStudentSummary | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [totalPages, setTotalPages] = useState(1)

  const loadStudents = useCallback(async (targetPage = page) => {
    try {
      const response = await adminListStudents({ page: Math.max(0, targetPage - 1), size: PAGE_SIZE })
      setStudents(response.data.content)
      setPage(response.data.page + 1)
      setTotalPages(Math.max(1, response.data.totalPages))
      setError(null)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải danh sách học sinh.'))
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await adminListStudents({ page: 0, size: PAGE_SIZE })
        if (!cancelled) {
            setStudents(response.data.content)
            setPage(response.data.page + 1)
            setTotalPages(Math.max(1, response.data.totalPages))
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải danh sách học sinh.'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const safePage = Math.min(Math.max(1, page), totalPages)
  const pagedStudents = students

  const handleOpenLock = useCallback((student: AdminStudentSummary) => {
    setDialogError(null)
    setLockTarget(student)
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
        await loadStudents()
        setLockTarget(null)
      } catch (err) {
        setDialogError(getApiErrorMessage(err, 'Không thể cập nhật trạng thái tài khoản.'))
      } finally {
        setProcessing(false)
      }
    })()
  }, [lockTarget, processing, loadStudents])

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="flex flex-col gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Quản lý học sinh</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">Quản lý học sinh</h1>
          <p className="text-sm text-gray-600">Xem danh sách học viên, trạng thái tài khoản và khóa hoặc mở khóa khi cần.</p>
        </div>
      </section>

      {info ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <AlertTitle>Thành công</AlertTitle>
          <AlertDescription className="text-emerald-700">{info}</AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <XCircle aria-hidden="true" data-icon="inline-start" />
          <AlertTitle>Không thể tải danh sách học sinh</AlertTitle>
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      ) : students === null ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-600 shadow-sm">
          Chưa có học sinh nào.
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-indigo-100 bg-white shadow-sm [&>[data-slot=table-container]]:max-h-[60vh] [&>[data-slot=table-container]]:overflow-y-auto">
            <Table className="[&_tr]:border-indigo-100/70">
              <TableHeader className="sticky top-0 z-10 [&_th]:bg-indigo-50">
                <TableRow>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead>Streak</TableHead>
                  <TableHead>Khóa đã đăng ký</TableHead>
                  <TableHead>Bài học hoàn thành</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedStudents?.map((student) => {
                  const accountStatus = accountStatusOf(student)
                  return (
                    <TableRow key={student.userId}>
                      <TableCell className="font-medium">{student.fullName}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={accountStatusBadgeClassNames[accountStatus]}>
                          {accountStatusLabels[accountStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell>{student.totalXp}</TableCell>
                      <TableCell>{student.currentStreakDays}</TableCell>
                      <TableCell>{student.enrollmentCount}</TableCell>
                      <TableCell>{student.completedLessonCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild size="icon" variant="outline" title="Chi tiết" className="size-8">
                            <Link to={`/admin/students/${student.userId}`} aria-label={`Chi tiết học sinh ${student.fullName}`}>
                              <Eye aria-hidden="true" />
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            title={student.locked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                            aria-label={student.locked ? `Mở khóa tài khoản ${student.fullName}` : `Khóa tài khoản ${student.fullName}`}
                            onClick={() => handleOpenLock(student)}
                          >
                            {student.locked ? <LockOpen aria-hidden="true" /> : <Lock aria-hidden="true" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 ? (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    size="default"
                    className="gap-1 px-2.5 sm:pl-2.5 aria-disabled:opacity-50 aria-disabled:pointer-events-none"
                    aria-label="Trang trước"
                    onClick={(event) => {
                      event.preventDefault()
                      void loadStudents(Math.max(1, safePage - 1))
                    }}
                    aria-disabled={safePage === 1}
                  >
                    <ChevronLeft aria-hidden="true" />
                    <span>Trang trước</span>
                  </PaginationLink>
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      isActive={pageNumber === safePage}
                      onClick={(event) => {
                        event.preventDefault()
                        void loadStudents(pageNumber)
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    size="default"
                    className="gap-1 px-2.5 sm:pr-2.5 aria-disabled:opacity-50 aria-disabled:pointer-events-none"
                    aria-label="Trang sau"
                    onClick={(event) => {
                      event.preventDefault()
                      void loadStudents(Math.min(totalPages, safePage + 1))
                    }}
                    aria-disabled={safePage === totalPages}
                  >
                    <span>Trang sau</span>
                    <ChevronRight aria-hidden="true" />
                  </PaginationLink>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </>
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
