import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Crown, FileQuestion, Gem, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '../../../components/shadcn/ui/alert'
import { Badge } from '../../../components/shadcn/ui/badge'
import { Button } from '../../../components/shadcn/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/shadcn/ui/card'
import { getApiErrorMessage } from '../../../lib/api/client'
import { checkoutPlan } from '../../../lib/api/studentMonetizationApi'
import type { PlanCode } from '../../../lib/api/types'
import { formatVnd } from './paymentUtils'

const plans: Array<{
  code: PlanCode
  name: string
  priceVnd: number
  description: string
  features: string[]
  icon: typeof Crown
}> = [
  {
    code: 'VIP',
    name: 'VIP',
    priceVnd: 200000,
    description: 'Mở khóa một khóa học VIP đã chọn.',
    features: ['Chọn 1 khóa học trả phí', 'Phù hợp mục tiêu ngắn hạn', 'Thanh toán một lần'],
    icon: Crown,
  },
  {
    code: 'PRO',
    name: 'PRO',
    priceVnd: 500000,
    description: 'Truy cập toàn bộ khóa học trong thời hạn gói.',
    features: ['Mở khóa toàn bộ khóa học', 'Không cần chọn từng khóa', 'Phù hợp học chuyên sâu'],
    icon: Sparkles,
  },
  {
    code: 'PRO_PLUS',
    name: 'Pro+',
    priceVnd: 350000,
    description: 'Gói nâng cao theo cấu hình Phase B.',
    features: ['Quyền truy cập nâng cao', 'Ưu tiên trải nghiệm học tập', 'Gia hạn linh hoạt'],
    icon: Gem,
  },
]

export function StudentSubscriptionPlansPage() {
  const navigate = useNavigate()
  const [checkoutPlanCode, setCheckoutPlanCode] = useState<PlanCode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const requestSeq = useRef(0)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  async function handleCheckoutPlan(planCode: PlanCode) {
    if (checkoutPlanCode) return
    const seq = requestSeq.current + 1
    requestSeq.current = seq
    setCheckoutPlanCode(planCode)
    setError(null)
    setInfo(null)
    try {
      const response = await checkoutPlan(planCode)
      if (!mountedRef.current || requestSeq.current !== seq) return
      const order = response.data
      if (order.status === 'PENDING_PAYMENT' && order.paymentProvider === 'SEPAY') {
        navigate(`/student/payment/orders/${order.id}`)
        return
      }
      if (order.status === 'PAID') {
        setInfo('Gói học đã được kích hoạt.')
        return
      }
      setError('Đơn thanh toán chưa sẵn sàng. Vui lòng thử lại sau.')
    } catch (err) {
      if (!mountedRef.current || requestSeq.current !== seq) return
      setError(getApiErrorMessage(err, 'Không thể tạo đơn gói học.'))
    } finally {
      if (mountedRef.current && requestSeq.current === seq) setCheckoutPlanCode(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-violet-50 p-6 shadow-sm sm:p-8">
        <Badge variant="outline" className="border-indigo-200 bg-white text-indigo-700">
          <Crown aria-hidden="true" />
          Gói học
        </Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">Chọn gói học phù hợp</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
          Tạo đơn thanh toán SEPAY và hoàn tất chuyển khoản trên trang hướng dẫn thanh toán.
        </p>
      </section>

      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <FileQuestion aria-hidden="true" />
          <AlertTitle>Không thể tạo đơn thanh toán</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {info ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle>Đã kích hoạt</AlertTitle>
          <AlertDescription className="text-emerald-700">{info}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon
          const loading = checkoutPlanCode === plan.code

          return (
            <Card key={plan.code} className="border-indigo-100 bg-white shadow-sm">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </div>
                <CardTitle className="flex items-baseline justify-between gap-3">
                  <span>{plan.name}</span>
                  <span className="text-xl font-bold text-indigo-700">{formatVnd(plan.priceVnd)}</span>
                </CardTitle>
                <p className="text-sm leading-6 text-gray-600">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <ul className="space-y-3 text-sm text-gray-700">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" loading={loading} disabled={checkoutPlanCode !== null && !loading} onClick={() => void handleCheckoutPlan(plan.code)}>
                  Chọn gói {plan.name}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </section>
    </div>
  )
}
