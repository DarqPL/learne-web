import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Lock, LockOpen, Plus, TriangleAlert, XCircle } from 'lucide-react'
import { getApiErrorMessage } from '../../lib/api/client'
import { adminListTeachers, adminLockTeacher, adminUnlockTeacher, adminResendTeacherInvitation } from '../../lib/api/adminApi'
import { isAxiosError } from 'axios'
import { TeacherInvitationDelivery } from './TeacherInvitationDelivery'
import type { AdminTeacher } from '../../lib/api/types'
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

const accountStatusOf = (teacher: AdminTeacher): AccountStatus => {
  if (teacher.locked) return 'locked'
  if (teacher.mustChangePassword) return 'mustChange'
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

const profileStatusLabels: Record<NonNullable<AdminTeacher['profileStatus']>, string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Ngừng hoạt động',
  SUSPENDED: 'Bị khóa',
}

const profileStatusBadgeClassNames: Record<NonNullable<AdminTeacher['profileStatus']>, string> = {
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  INACTIVE: 'border-gray-200 bg-gray-50 text-gray-700',
  SUSPENDED: 'border-red-200 bg-red-50 text-red-700',
}

export function AdminTeacherListPage() {
  const [teachers, setTeachers] = useState<AdminTeacher[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [lockTarget, setLockTarget] = useState<AdminTeacher | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [totalPages, setTotalPages] = useState(1)

  const loadTeachers = useCallback(async (targetPage: number) => {
    try {
      const response = await adminListTeachers({ page: Math.max(0, targetPage - 1), size: PAGE_SIZE })
      setTeachers(response.data.content)
      setPage(response.data.page + 1)
      setTotalPages(Math.max(1, response.data.totalPages))
      setError(null)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải danh sách giảng viên.'))
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await adminListTeachers({ page: 0, size: PAGE_SIZE })
        if (!cancelled) {
          setTeachers(response.data.content)
          setPage(response.data.page + 1)
          setTotalPages(Math.max(1, response.data.totalPages))
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải danh sách giảng viên.'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const safePage = Math.min(Math.max(1, page), totalPages)
  const pagedTeachers = teachers

  const handleOpenLock = useCallback((teacher: AdminTeacher) => {
    setDialogError(null)
    setLockTarget(teacher)
  }, [])

  const handleConfirmLock = useCallback(() => {
    if (!lockTarget || processing) return
    setProcessing(true)
    setDialogError(null)
    void (async () => {
      try {
        if (lockTarget.locked) {
          await adminUnlockTeacher(lockTarget.userId)
        } else {
          await adminLockTeacher(lockTarget.userId)
        }
        setInfo(lockTarget.locked ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.')
        await loadTeachers(page)
        setLockTarget(null)
      } catch (err) {
        setDialogError(getApiErrorMessage(err, 'Không thể cập nhật trạng thái tài khoản.'))
      } finally {
        setProcessing(false)
      }
    })()
  }, [lockTarget, processing, loadTeachers, page])

  async function resendInvitation(userId: number) {
    setInfo(null)
    let delivery
    try {
      delivery = (await adminResendTeacherInvitation(userId)).data
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) await loadTeachers(page)
      throw err
    }
    setTeachers((current) => current?.map((teacher) => teacher.userId === userId
      ? { ...teacher, invitationDelivery: delivery } : teacher) ?? null)
    setInfo('Yêu cầu gửi email cấp tài khoản đã được tiếp nhận.')
    // GET failure is independent of the already accepted POST.
    await loadTeachers(page)
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="flex flex-col gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Quản lý giảng viên</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-950">Quản lý giảng viên</h1>
            <p className="text-sm text-gray-600">Xem danh sách giảng viên, trạng thái tài khoản và khóa hoặc mở khóa khi cần.</p>
          </div>
          <Button asChild>
            <Link to="/admin/teachers/new">
              <Plus data-icon="inline-start" aria-hidden="true" />
              Tạo giảng viên
            </Link>
          </Button>
        </div>
      </section>

      <Button variant="outline" className="self-start" onClick={() => void loadTeachers(page)}>Làm mới danh sách</Button>

      {info ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <AlertTitle>Thành công</AlertTitle>
          <AlertDescription className="text-emerald-700">{info}</AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <XCircle aria-hidden="true" data-icon="inline-start" />
          <AlertTitle>Không thể tải danh sách giảng viên</AlertTitle>
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      ) : null}

      {teachers === null ? (error ? null : (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </div>
      )) : teachers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-600 shadow-sm">
          Chưa có giảng viên nào.
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-indigo-100 bg-white shadow-sm [&>[data-slot=table-container]]:max-h-[60vh] [&>[data-slot=table-container]]:overflow-y-auto">
            <Table className="[&_tr]:border-indigo-100/70">
              <TableHeader className="sticky top-0 z-10 [&_th]:bg-indigo-50">
                <TableRow>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Trạng thái tài khoản</TableHead>
                  <TableHead>Trạng thái hồ sơ</TableHead>
                  <TableHead>Hồ sơ công khai</TableHead>
                  <TableHead>Email cấp tài khoản</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedTeachers?.map((teacher) => {
                  const accountStatus = accountStatusOf(teacher)
                  return (
                    <TableRow key={teacher.userId}>
                      <TableCell className="font-medium">{teacher.fullName}</TableCell>
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={accountStatusBadgeClassNames[accountStatus]}>
                          {accountStatusLabels[accountStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {teacher.profileStatus ? (
                          <Badge variant="outline" className={profileStatusBadgeClassNames[teacher.profileStatus]}>
                            {profileStatusLabels[teacher.profileStatus]}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                            Chưa tạo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            teacher.completed
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-amber-200 bg-amber-50 text-amber-800'
                          }
                        >
                          {teacher.completed ? 'Công khai' : 'Chưa hoàn tất'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TeacherInvitationDelivery delivery={teacher.invitationDelivery} onResend={() => resendInvitation(teacher.userId)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            title={teacher.locked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                            aria-label={teacher.locked ? `Mở khóa tài khoản ${teacher.fullName}` : `Khóa tài khoản ${teacher.fullName}`}
                            onClick={() => handleOpenLock(teacher)}
                          >
                            {teacher.locked ? <LockOpen aria-hidden="true" /> : <Lock aria-hidden="true" />}
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
                      void loadTeachers(Math.max(1, safePage - 1))
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
                        void loadTeachers(pageNumber)
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
                      void loadTeachers(Math.min(totalPages, safePage + 1))
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
                        Giảng viên sẽ có thể đăng nhập trở lại.
                      </span>
                    </>
                  ) : (
                    <>
                      Khóa tài khoản <span className="font-semibold text-gray-900">{lockTarget?.fullName}</span> (
                      {lockTarget?.email})?
                      <span className="mt-2 block rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                        Giảng viên sẽ không thể đăng nhập cho đến khi được mở khóa.
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
