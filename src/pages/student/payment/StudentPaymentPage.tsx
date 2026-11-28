import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Building2, Clock3, Copy, FileQuestion, Loader2, QrCode, ReceiptText, RefreshCw, TriangleAlert, XCircle } from 'lucide-react'
import { getApiErrorMessage } from '../../../lib/api/client'
import { getStudentOrder } from '../../../lib/api/studentMonetizationApi'
import type { OrderResponse } from '../../../lib/api/types'
import { Alert, AlertDescription, AlertTitle } from '../../../components/shadcn/ui/alert'
import { Badge } from '../../../components/shadcn/ui/badge'
import { Button } from '../../../components/shadcn/ui/button'
import { Card, CardContent } from '../../../components/shadcn/ui/card'
import { Separator } from '../../../components/shadcn/ui/separator'
import { formatCountdown, formatVnd, getRemainingMs } from './paymentUtils'

const pollIntervalMs = 3000

function parsePublicId(value: string | undefined) {
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null
}

function statusLabel(order: OrderResponse, expiredLocally: boolean) {
  if (order.status === 'PAID') return 'Đã thanh toán'
  if (order.status === 'PENDING_PAYMENT' && expiredLocally) return 'Đã hết hạn'
  if (order.status === 'PENDING_PAYMENT') return 'Chờ chuyển khoản'
  if (order.status === 'EXPIRED') return 'Đã hết hạn'
  if (order.status === 'CANCELLED') return 'Đã hủy'
  return 'Đã hoàn tiền'
}

function statusClass(order: OrderResponse, expiredLocally: boolean) {
  if (order.status === 'PAID') return 'border-success/40 bg-success-background text-success-foreground'
  if (order.status === 'PENDING_PAYMENT' && !expiredLocally) return 'border-warning/40 bg-warning-background text-warning-foreground'
  return 'border-border bg-muted text-foreground'
}

function nextActionPath(order: OrderResponse) {
  const courseItem = order.items.find((item) => item.productType === 'COURSE' && item.courseId !== null)
  if (courseItem?.courseId) return `/student/courses/${courseItem.courseId}`
  const planItem = order.items.find((item) => item.productType === 'PLAN')
  if (planItem) return '/student/subscription'
  return '/student'
}

function CopyableValue({ label, value }: { label: string; value: string }) {
  async function handleCopy() {
    await navigator.clipboard?.writeText(value)
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="break-all text-sm font-semibold text-foreground">{value}</p>
        <Button type="button" variant="outline" size="icon" onClick={handleCopy} aria-label={`Sao chép ${label}`}>
          <Copy aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

export function StudentPaymentPage() {
  const { publicId } = useParams()
  const navigate = useNavigate()
  const parsedPublicId = parsePublicId(publicId)
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [remainingMs, setRemainingMs] = useState(0)
  const [expiryRefreshCheckedOrderId, setExpiryRefreshCheckedOrderId] = useState<number | null>(null)
  const requestSeq = useRef(0)

  const loadOrder = useCallback(async (options: { silent?: boolean } = {}) => {
    if (parsedPublicId === null) return
    const seq = requestSeq.current + 1
    requestSeq.current = seq
    if (!options.silent) setRefreshing(true)
    try {
      const response = await getStudentOrder(parsedPublicId)
      if (seq !== requestSeq.current) return
      setOrder(response.data)
      setRemainingMs(getRemainingMs(response.data.expiresAt))
      setError(null)
    } catch (err) {
      if (seq !== requestSeq.current) return
      setError(getApiErrorMessage(err, 'Không thể tải trạng thái thanh toán.'))
    } finally {
      if (!options.silent) setRefreshing(false)
    }
  }, [parsedPublicId])

  useEffect(() => {
    let cancelled = false
    if (parsedPublicId === null) return

    void (async () => {
      const seq = requestSeq.current + 1
      requestSeq.current = seq
      try {
        const response = await getStudentOrder(parsedPublicId)
        if (cancelled || seq !== requestSeq.current) return
        setOrder(response.data)
        setRemainingMs(getRemainingMs(response.data.expiresAt))
        setError(null)
      } catch (err) {
        if (!cancelled && seq === requestSeq.current) setError(getApiErrorMessage(err, 'Không thể tải trạng thái thanh toán.'))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [parsedPublicId])

  useEffect(() => {
    if (!order?.expiresAt) return
    const id = window.setInterval(() => {
      setRemainingMs(getRemainingMs(order.expiresAt))
    }, 1000)
    return () => window.clearInterval(id)
  }, [order?.expiresAt])

  const expiredLocally = Boolean(order && order.status === 'PENDING_PAYMENT' && remainingMs === 0 && expiryRefreshCheckedOrderId === order.id)
  const shouldPoll = Boolean(order?.status === 'PENDING_PAYMENT' && order.paymentInstructions && remainingMs > 0)

  useEffect(() => {
    if (!order || order.status !== 'PENDING_PAYMENT' || !order.paymentInstructions || remainingMs !== 0) return
    if (expiryRefreshCheckedOrderId === order.id) return
    void (async () => {
      await loadOrder({ silent: true })
      setExpiryRefreshCheckedOrderId(order.id)
    })()
  }, [expiryRefreshCheckedOrderId, loadOrder, order, remainingMs])

  useEffect(() => {
    if (!shouldPoll) return
    const id = window.setInterval(() => void loadOrder({ silent: true }), pollIntervalMs)
    return () => window.clearInterval(id)
  }, [loadOrder, shouldPoll, order?.id])

  if (parsedPublicId === null) {
    return (
      <Card className="border-dashed border-border bg-card">
        <CardContent>
          <Alert variant="destructive">
            <FileQuestion aria-hidden="true" />
            <AlertTitle>Không tìm thấy đơn thanh toán.</AlertTitle>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!order || order.publicId !== parsedPublicId) {
    if (error) {
      return (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent>
            <Alert variant="destructive" className="bg-card">
              <XCircle aria-hidden="true" />
              <AlertTitle>Không thể tải đơn thanh toán</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button className="mt-4" loading={refreshing} onClick={() => void loadOrder()}>
              Kiểm tra lại
            </Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="border-border bg-card">
        <CardContent className="flex items-center gap-3 py-8 text-sm font-medium text-foreground">
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-primary" />
          Đang tải đơn thanh toán...
        </CardContent>
      </Card>
    )
  }

  const instructions = order.paymentInstructions
  const isPaid = order.status === 'PAID'
  const isTerminal = order.status === 'EXPIRED' || order.status === 'CANCELLED' || order.status === 'REFUNDED' || expiredLocally
  const canShowInstructions = order.status === 'PENDING_PAYMENT' && !expiredLocally && instructions !== null

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.18),_transparent_32%),linear-gradient(135deg,_#ffffff_0%,_#eef6ff_52%,_#f8f5ff_100%)] p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="shadow-sm">
              <ReceiptText aria-hidden="true" />
              Đơn {order.publicId}
            </Badge>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Thanh toán chuyển khoản SEPAY</h1>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Quét mã QR hoặc chuyển khoản đúng số tiền và nội dung để hệ thống tự động xác nhận quyền truy cập của bạn.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
            <Badge variant="outline" className={statusClass(order, expiredLocally)}>
              {isPaid ? <BadgeCheck aria-hidden="true" /> : <Clock3 aria-hidden="true" />}
              {statusLabel(order, expiredLocally)}
            </Badge>
            <Button variant="outline" loading={refreshing} onClick={() => void loadOrder()}>
              <RefreshCw aria-hidden="true" />
              Kiểm tra lại
            </Button>
          </div>
        </div>
      </section>

      {error ? (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Chưa thể cập nhật trạng thái</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {isPaid ? (
        <Card className="border-success/30 bg-success-background">
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <BadgeCheck aria-hidden="true" className="mt-1 h-6 w-6 text-success" />
              <div>
                <h2 className="text-xl font-bold text-foreground">Thanh toán thành công</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Đơn hàng đã được xác nhận. Bạn có thể tiếp tục học hoặc quay về trang tổng quan.</p>
              </div>
            </div>
            <Button onClick={() => navigate(nextActionPath(order))}>
              Tiếp tục
              <ArrowRight aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {isTerminal && !isPaid ? (
        <Card className="border-border bg-card">
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <XCircle aria-hidden="true" className="mt-1 h-6 w-6 text-muted-foreground" />
              <div>
                <h2 className="text-xl font-bold text-foreground">Đơn thanh toán không còn hiệu lực</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Vui lòng tạo đơn thanh toán mới nếu bạn vẫn muốn mua nội dung này.</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/student/courses">Quay lại danh sách khóa học</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {canShowInstructions && instructions ? (
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="text-muted-foreground">Giá gốc</p>
              <p className="font-semibold text-foreground">{formatVnd(order.originalAmountVnd)}</p>
            </div>
            {order.discountAmountVnd > 0 ? (
              <div className="flex items-center justify-between gap-3 text-sm">
                <p className="text-muted-foreground">Giảm giá</p>
                <p className="font-semibold text-success">-{formatVnd(order.discountAmountVnd)}</p>
              </div>
            ) : null}
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-foreground">Cần chuyển khoản</p>
              <p className="text-lg font-bold text-foreground">{formatVnd(order.finalAmountVnd)}</p>
            </div>
            {order.discountAmountVnd > 0 ? <Badge variant="secondary">Đã áp dụng giảm giá</Badge> : null}
          </CardContent>
        </Card>
      ) : null}

      {canShowInstructions && instructions ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_1fr]">
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary">Mã QR chuyển khoản</p>
                  <p className="mt-1 text-xs text-muted-foreground">Tự động điền số tiền và nội dung.</p>
                </div>
                <QrCode aria-hidden="true" className="h-6 w-6 text-primary" />
              </div>
              <div className="rounded-3xl border border-border bg-muted p-4">
                <img src={instructions.qrUrl} alt="Mã QR thanh toán SEPAY" className="mx-auto aspect-square w-full max-w-xs rounded-2xl bg-card object-contain p-3" />
              </div>
              <div className="rounded-2xl border border-warning/30 bg-warning-background p-4 text-sm text-warning-foreground">
                <div className="flex items-center gap-2 font-semibold">
                  <Clock3 aria-hidden="true" className="h-4 w-4" />
                  Còn {formatCountdown(remainingMs)} để hoàn tất chuyển khoản
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardContent className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Thông tin chuyển khoản</p>
                <h2 className="mt-2 text-2xl font-bold text-foreground">{formatVnd(instructions.amountVnd)}</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ngân hàng</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{instructions.bankName ?? instructions.bankCode}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Chủ tài khoản</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{instructions.accountName ?? 'LearnE'}</p>
                </div>
              </div>
              <CopyableValue label="Số tài khoản" value={instructions.accountNumber} />
              <CopyableValue label="Nội dung chuyển khoản" value={instructions.paymentReference} />
              <div className="rounded-2xl border border-info/30 bg-info-background p-4 text-sm leading-6 text-info-foreground">
                <div className="flex gap-2 font-semibold">
                  <Building2 aria-hidden="true" className="mt-0.5 h-4 w-4" />
                  Lưu ý thanh toán
                </div>
                <p className="mt-2">Vui lòng chuyển đúng số tiền và giữ nguyên nội dung chuyển khoản để hệ thống tự động đối soát.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {order.status === 'PENDING_PAYMENT' && !expiredLocally && !instructions ? (
        <Alert variant="warning">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Chưa có hướng dẫn thanh toán</AlertTitle>
          <AlertDescription>Đơn đang chờ thanh toán nhưng chưa có thông tin SEPAY. Vui lòng kiểm tra lại sau hoặc tạo đơn mới.</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
