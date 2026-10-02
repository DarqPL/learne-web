import { useCallback, useEffect, useId, useState, type FormEvent } from 'react'
import { ChevronLeft, ChevronRight, Pencil, Plus, Ticket, XCircle } from 'lucide-react'
import { getApiErrorMessage } from '../../../lib/api/client'
import { createAdminCoupon, listAdminCoupons, updateAdminCoupon } from '../../../lib/api/adminCouponApi'
import type {
  AdminCoupon,
  AdminCouponCreatePayload,
  AdminCouponUpdatePayload,
  CouponDiscountType,
  CouponProductScope,
} from '../../../lib/api/types'
import { Alert, AlertDescription, AlertTitle } from '../../../components/shadcn/ui/alert'
import { Badge } from '../../../components/shadcn/ui/badge'
import { Button } from '../../../components/shadcn/ui/button'
import { Checkbox } from '../../../components/shadcn/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/shadcn/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '../../../components/shadcn/ui/field'
import { Input } from '../../../components/shadcn/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from '../../../components/shadcn/ui/pagination'
import { Skeleton } from '../../../components/shadcn/ui/skeleton'
import { Switch } from '../../../components/shadcn/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/shadcn/ui/table'
import { ToggleGroup, ToggleGroupItem } from '../../../components/shadcn/ui/toggle-group'
import { formatStudentLearningDate } from '../../student/learning/studentLearningUtils'
import { couponProductScopeLabels, couponStatusLabel, formatCouponDiscount, couponDiscountTypeLabels } from './adminCouponLabels'
import { fromDatetimeLocalValue, toDatetimeLocalValue } from './adminCouponUtils'

const PAGE_SIZE = 6

const productScopeOptions: CouponProductScope[] = ['COURSE_PURCHASE', 'VIP', 'PRO', 'PRO_PLUS']
const discountTypeOptions: CouponDiscountType[] = ['PERCENT', 'FIXED_AMOUNT']

interface CouponFormState {
  code: string
  discountType: CouponDiscountType
  discountValue: number | null
  minOrderAmountVnd: number | null
  maxDiscountAmountVnd: number | null
  minimumFinalAmountVnd: number | null
  usageLimitTotal: number | null
  usageLimitPerUser: number | null
  validFrom: string
  validUntil: string
  active: boolean
  productScopes: CouponProductScope[]
}

function emptyForm(): CouponFormState {
  return {
    code: '',
    discountType: 'PERCENT',
    discountValue: null,
    minOrderAmountVnd: 0,
    maxDiscountAmountVnd: null,
    minimumFinalAmountVnd: 0,
    usageLimitTotal: null,
    usageLimitPerUser: null,
    validFrom: '',
    validUntil: '',
    active: true,
    productScopes: [],
  }
}

function formFromCoupon(coupon: AdminCoupon): CouponFormState {
  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    minOrderAmountVnd: coupon.minOrderAmountVnd,
    maxDiscountAmountVnd: coupon.maxDiscountAmountVnd,
    minimumFinalAmountVnd: coupon.minimumFinalAmountVnd,
    usageLimitTotal: coupon.usageLimitTotal,
    usageLimitPerUser: coupon.usageLimitPerUser,
    validFrom: toDatetimeLocalValue(coupon.validFrom),
    validUntil: toDatetimeLocalValue(coupon.validUntil),
    active: coupon.active,
    productScopes: [...coupon.productScopes],
  }
}

function digitsToNumber(digits: string): number | null {
  return digits === '' ? null : Number(digits)
}

function formatVndInput(value: number | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return ''
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value)
}

interface CouponValidation {
  field: 'code' | 'discountValue' | 'productScopes' | 'validUntil'
  message: string
}

function validateForm(form: CouponFormState): CouponValidation | null {
  if (!form.code.trim()) {
    return { field: 'code', message: 'Vui lòng nhập mã giảm giá.' }
  }
  if (form.discountValue == null || form.discountValue <= 0) {
    return { field: 'discountValue', message: 'Vui lòng nhập mức giảm lớn hơn 0.' }
  }
  if (form.discountType === 'PERCENT' && form.discountValue > 100) {
    return { field: 'discountValue', message: 'Mức giảm theo % không được vượt quá 100.' }
  }
  if (form.productScopes.length === 0) {
    return { field: 'productScopes', message: 'Chọn ít nhất một phạm vi áp dụng.' }
  }
  if (!form.validFrom || !form.validUntil) {
    return { field: 'validUntil', message: 'Vui lòng chọn thời gian hiệu lực.' }
  }
  if (new Date(form.validUntil).getTime() <= new Date(form.validFrom).getTime()) {
    return { field: 'validUntil', message: 'Ngày hết hạn phải sau ngày bắt đầu.' }
  }
  return null
}

function createPayload(form: CouponFormState): AdminCouponCreatePayload {
  return {
    code: form.code.trim().toUpperCase(),
    discountType: form.discountType,
    discountValue: form.discountValue ?? 0,
    minOrderAmountVnd: form.minOrderAmountVnd ?? 0,
    maxDiscountAmountVnd: form.maxDiscountAmountVnd,
    minimumFinalAmountVnd: form.minimumFinalAmountVnd ?? 0,
    usageLimitTotal: form.usageLimitTotal,
    usageLimitPerUser: form.usageLimitPerUser,
    validFrom: fromDatetimeLocalValue(form.validFrom),
    validUntil: fromDatetimeLocalValue(form.validUntil),
    active: form.active,
    productScopes: form.productScopes,
  }
}

function updatePayload(form: CouponFormState, original: CouponFormState): AdminCouponUpdatePayload {
  const full = createPayload(form)
  const before = createPayload(original)
  const changed: Record<string, unknown> = {}
  for (const key of Object.keys(full) as (keyof AdminCouponCreatePayload)[]) {
    if (JSON.stringify(full[key]) !== JSON.stringify(before[key])) {
      changed[key] = full[key]
    }
  }
  return changed as AdminCouponUpdatePayload
}

function couponErrorMessage(error: unknown, fallback: string): string {
  const status = (error as { response?: { status?: number } } | null)?.response?.status
  if (status === 409) return 'Mã giảm giá đã tồn tại.'
  return getApiErrorMessage(error, fallback)
}

interface CouponDialogProps {
  mode: 'create' | 'edit'
  initialValue?: AdminCoupon
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

function CouponDialog({ mode, initialValue, open, onOpenChange, onSaved }: CouponDialogProps) {
  const [form, setForm] = useState<CouponFormState>(() => (initialValue ? formFromCoupon(initialValue) : emptyForm()))
  const [validation, setValidation] = useState<CouponValidation | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fieldPrefix = useId()
  const originalForm = initialValue ? formFromCoupon(initialValue) : null

  function handleOpenChange(next: boolean) {
    if (saving) return
    if (next) {
      setForm(originalForm ?? emptyForm())
      setValidation(null)
      setSubmitError(null)
    }
    onOpenChange(next)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return

    const problem = validateForm(form)
    setValidation(problem)
    if (problem) return

    setSaving(true)
    setSubmitError(null)
    void (async () => {
      try {
        if (mode === 'edit' && initialValue && originalForm) {
          await updateAdminCoupon(initialValue.id, updatePayload(form, originalForm))
        } else {
          await createAdminCoupon(createPayload(form))
        }
        onOpenChange(false)
        onSaved()
      } catch (err) {
        setSubmitError(couponErrorMessage(err, 'Không thể lưu mã giảm giá.'))
      } finally {
        setSaving(false)
      }
    })()
  }

  const codeError = validation?.field === 'code' ? validation.message : undefined
  const discountValueError = validation?.field === 'discountValue' ? validation.message : undefined
  const scopeError = validation?.field === 'productScopes' ? validation.message : undefined
  const validUntilError = validation?.field === 'validUntil' ? validation.message : undefined
  const codeErrorId = `${fieldPrefix}-code-error`
  const discountValueErrorId = `${fieldPrefix}-value-error`
  const scopeErrorId = `${fieldPrefix}-scope-error`
  const validUntilErrorId = `${fieldPrefix}-until-error`

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Sửa mã giảm giá' : 'Tạo mã giảm giá'}</DialogTitle>
          <DialogDescription>
            Mã giảm giá được áp dụng cho các phạm vi đã chọn trong khoảng thời gian hiệu lực.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-4">
            {submitError ? (
              <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
                <XCircle aria-hidden="true" data-icon="inline-start" />
                <AlertTitle>Không thể lưu mã giảm giá</AlertTitle>
                <AlertDescription className="text-red-700">{submitError}</AlertDescription>
              </Alert>
            ) : null}

            <Field data-invalid={codeError ? true : undefined}>
              <FieldLabel htmlFor={`${fieldPrefix}-code`}>Mã giảm giá</FieldLabel>
              <Input
                id={`${fieldPrefix}-code`}
                value={form.code}
                disabled={saving}
                placeholder="VD: SALE20"
                aria-invalid={codeError ? true : undefined}
                aria-describedby={codeError ? codeErrorId : undefined}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
              />
              {codeError ? <FieldError id={codeErrorId}>{codeError}</FieldError> : null}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Loại giảm giá</FieldLabel>
                <ToggleGroup
                  type="single"
                  value={form.discountType}
                  variant="outline"
                  className="w-full"
                  onValueChange={(value) => {
                    if (value) setForm((current) => ({ ...current, discountType: value as CouponDiscountType }))
                  }}
                >
                  {discountTypeOptions.map((discountType) => (
                    <ToggleGroupItem key={discountType} value={discountType} className="flex-1">
                      {couponDiscountTypeLabels[discountType]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>

              <Field data-invalid={discountValueError ? true : undefined}>
                <FieldLabel htmlFor={`${fieldPrefix}-value`}>Mức giảm</FieldLabel>
                <FieldDescription>
                  {form.discountType === 'FIXED_AMOUNT' ? 'Số tiền giảm tính bằng VND.' : 'Tỷ lệ giảm tính bằng phần trăm.'}
                </FieldDescription>
                <Input
                  id={`${fieldPrefix}-value`}
                  inputMode="numeric"
                  value={
                    form.discountType === 'FIXED_AMOUNT'
                      ? formatVndInput(form.discountValue)
                      : form.discountValue == null
                        ? ''
                        : String(form.discountValue)
                  }
                  disabled={saving}
                  aria-invalid={discountValueError ? true : undefined}
                  aria-describedby={discountValueError ? discountValueErrorId : undefined}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, discountValue: digitsToNumber(event.target.value.replace(/\D/g, '')) }))
                  }
                />
                {discountValueError ? <FieldError id={discountValueErrorId}>{discountValueError}</FieldError> : null}
              </Field>
            </div>

            <Field data-invalid={scopeError ? true : undefined}>
              <FieldLabel>Phạm vi áp dụng</FieldLabel>
              <FieldGroup className="flex flex-wrap gap-4">
                {productScopeOptions.map((scope) => {
                  const checked = form.productScopes.includes(scope)
                  return (
                    <div key={scope} className="flex items-center gap-2">
                      <Checkbox
                        id={`${fieldPrefix}-scope-${scope}`}
                        checked={checked}
                        disabled={saving}
                        onCheckedChange={(next) =>
                          setForm((current) => ({
                            ...current,
                            productScopes: next
                              ? productScopeOptions.filter((option) => option === scope || current.productScopes.includes(option))
                              : current.productScopes.filter((option) => option !== scope),
                          }))
                        }
                      />
                      <FieldLabel htmlFor={`${fieldPrefix}-scope-${scope}`} className="font-normal">
                        {couponProductScopeLabels[scope]}
                      </FieldLabel>
                    </div>
                  )
                })}
              </FieldGroup>
              {scopeError ? <FieldError id={scopeErrorId}>{scopeError}</FieldError> : null}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={`${fieldPrefix}-min-order`}>Đơn tối thiểu (VND)</FieldLabel>
                <Input
                  id={`${fieldPrefix}-min-order`}
                  inputMode="numeric"
                  value={formatVndInput(form.minOrderAmountVnd)}
                  disabled={saving}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, minOrderAmountVnd: digitsToNumber(event.target.value.replace(/\D/g, '')) }))
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor={`${fieldPrefix}-max-discount`}>Giảm tối đa (VND)</FieldLabel>
                <Input
                  id={`${fieldPrefix}-max-discount`}
                  inputMode="numeric"
                  value={formatVndInput(form.maxDiscountAmountVnd)}
                  disabled={saving}
                  placeholder="Không giới hạn"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, maxDiscountAmountVnd: digitsToNumber(event.target.value.replace(/\D/g, '')) }))
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor={`${fieldPrefix}-min-final`}>Số tiền tối thiểu còn lại (VND)</FieldLabel>
                <Input
                  id={`${fieldPrefix}-min-final`}
                  inputMode="numeric"
                  value={formatVndInput(form.minimumFinalAmountVnd)}
                  disabled={saving}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, minimumFinalAmountVnd: digitsToNumber(event.target.value.replace(/\D/g, '')) }))
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor={`${fieldPrefix}-usage-total`}>Số lần sử dụng tối đa</FieldLabel>
                <Input
                  id={`${fieldPrefix}-usage-total`}
                  inputMode="numeric"
                  value={form.usageLimitTotal == null ? '' : String(form.usageLimitTotal)}
                  disabled={saving}
                  placeholder="Không giới hạn"
                  onChange={(event) => setForm((current) => ({ ...current, usageLimitTotal: digitsToNumber(event.target.value.replace(/\D/g, '')) }))}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor={`${fieldPrefix}-usage-user`}>Số lần mỗi tài khoản</FieldLabel>
                <Input
                  id={`${fieldPrefix}-usage-user`}
                  inputMode="numeric"
                  value={form.usageLimitPerUser == null ? '' : String(form.usageLimitPerUser)}
                  disabled={saving}
                  placeholder="Không giới hạn"
                  onChange={(event) => setForm((current) => ({ ...current, usageLimitPerUser: digitsToNumber(event.target.value.replace(/\D/g, '')) }))}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={`${fieldPrefix}-from`}>Bắt đầu</FieldLabel>
                <Input
                  id={`${fieldPrefix}-from`}
                  type="datetime-local"
                  value={form.validFrom}
                  disabled={saving}
                  onChange={(event) => setForm((current) => ({ ...current, validFrom: event.target.value }))}
                />
              </Field>

              <Field data-invalid={validUntilError ? true : undefined}>
                <FieldLabel htmlFor={`${fieldPrefix}-until`}>Kết thúc</FieldLabel>
                <Input
                  id={`${fieldPrefix}-until`}
                  type="datetime-local"
                  value={form.validUntil}
                  disabled={saving}
                  aria-invalid={validUntilError ? true : undefined}
                  aria-describedby={validUntilError ? validUntilErrorId : undefined}
                  onChange={(event) => setForm((current) => ({ ...current, validUntil: event.target.value }))}
                />
                {validUntilError ? <FieldError id={validUntilErrorId}>{validUntilError}</FieldError> : null}
              </Field>
            </div>

            <Field orientation="horizontal">
              <Switch
                id={`${fieldPrefix}-active`}
                checked={form.active}
                disabled={saving}
                onCheckedChange={(next) => setForm((current) => ({ ...current, active: next }))}
              />
              <FieldLabel htmlFor={`${fieldPrefix}-active`}>Đang hoạt động</FieldLabel>
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-4">
            <Button type="submit" loading={saving}>
              {mode === 'edit' ? 'Lưu thay đổi' : 'Tạo mã giảm giá'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AdminCouponPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [dialogState, setDialogState] = useState<{ mode: 'create' | 'edit'; coupon?: AdminCoupon } | null>(null)

  const loadCoupons = useCallback(async () => {
    setCoupons(null)
    setError(null)
    try {
      const response = await listAdminCoupons()
      setCoupons(response.data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải danh sách mã giảm giá.'))
    }
  }, [])

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
    setDialogState({ mode: 'create' })
  }, [])

  const handleOpenEdit = useCallback((coupon: AdminCoupon) => {
    setDialogState({ mode: 'edit', coupon })
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
                        <Button variant="outline" size="sm" onClick={() => handleOpenEdit(coupon)}>
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

      {dialogState ? (
        <CouponDialog
          mode={dialogState.mode}
          initialValue={dialogState.coupon}
          open
          onOpenChange={(open) => {
            if (!open) setDialogState(null)
          }}
          onSaved={() => {
            setDialogState(null)
            void loadCoupons()
          }}
        />
      ) : null}
    </div>
  )
}