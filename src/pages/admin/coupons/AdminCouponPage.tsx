import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Pencil, Plus, Ticket, XCircle } from 'lucide-react'
import { getApiErrorMessage } from '../../../lib/api/client'
import { listAdminCoupons } from '../../../lib/api/adminCouponApi'
import type { AdminCoupon } from '../../../lib/api/types'
import { Alert, AlertDescription, AlertTitle } from '../../../components/shadcn/ui/alert'
import { Badge } from '../../../components/shadcn/ui/badge'
import { Button } from '../../../components/shadcn/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from '../../../components/shadcn/ui/pagination'
import { Skeleton } from '../../../components/shadcn/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/shadcn/ui/table'
import { formatStudentLearningDate } from '../../student/learning/studentLearningUtils'
import { couponProductScopeLabels, couponStatusLabel, formatCouponDiscount } from './adminCouponLabels'

const PAGE_SIZE = 6

export function AdminCouponPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setCoupons(null)
      setError(null)
      try {
        const response = await listAdminCoupons()
        if (!cancelled) setCoupons(response.data)
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải danh sách mã giảm giá.'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const totalPages = coupons ? Math.max(1, Math.ceil(coupons.length / PAGE_SIZE)) : 1
  const safePage = Math.min(Math.max(1, page), totalPages)
  const pagedCoupons = coupons?.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleOpenCreate = useCallback(() => {
    // Wired by a later task: opens the create/edit dialog.
  }, [])

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">Mã giảm giá</h1>
          <p className="text-sm text-gray-600">Tạo và quản lý mã giảm giá áp dụng cho khóa học và gói thành viên.</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus data-icon="inline-start" aria-hidden="true" />
          Tạo mã giảm giá
        </Button>
      </section>

      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <XCircle aria-hidden="true" data-icon="inline-start" />
          <AlertTitle>Không thể tải danh sách mã giảm giá</AlertTitle>
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      ) : coupons === null ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </div>
      ) : coupons.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-600 shadow-sm">
          <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Ticket aria-hidden="true" className="size-5" />
          </span>
          Chưa có mã giảm giá nào.
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm [&>[data-slot=table-container]]:max-h-[60vh] [&>[data-slot=table-container]]:overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 [&_th]:bg-gray-50">
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Giảm giá</TableHead>
                  <TableHead>Phạm vi</TableHead>
                  <TableHead>Hiệu lực</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedCoupons?.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-medium">{coupon.code}</TableCell>
                    <TableCell>{formatCouponDiscount(coupon)}</TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="flex min-w-32 flex-wrap gap-1">
                        {coupon.productScopes.map((scope) => (
                          <Badge key={scope} variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                            {couponProductScopeLabels[scope]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="flex min-w-40 flex-col gap-0.5 text-sm text-muted-foreground">
                        <span>{formatStudentLearningDate(coupon.validFrom)}</span>
                        <span>{formatStudentLearningDate(coupon.validUntil)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={coupon.active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-100 text-gray-700'}
                      >
                        {couponStatusLabel(coupon.active)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" disabled>
                          <Pencil data-icon="inline-start" aria-hidden="true" />
                          Sửa
                        </Button>
                        <Button variant="destructive" size="sm" disabled>
                          Vô hiệu hóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
                      setPage((prev) => Math.max(1, Math.min(prev, totalPages) - 1))
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
                        setPage(pageNumber)
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
                      setPage((prev) => Math.min(totalPages, Math.max(1, prev) + 1))
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
    </div>
  )
}