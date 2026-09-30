import { http } from './client'
import type { OrderResponse, PlanCode, SubscriptionSummaryResponse } from './types'

export interface CheckoutCouponRequest {
  couponCode?: string | null
}

export function checkoutCourse(courseId: number, request?: CheckoutCouponRequest) {
  return http.post<OrderResponse>(`/api/student/checkout/course/${courseId}`, request ?? {})
}

export function checkoutPlan(planCode: PlanCode, request?: CheckoutCouponRequest) {
  return http.post<OrderResponse>(`/api/student/checkout/plans/${planCode}`, request ?? {})
}

export function getStudentOrder(orderId: number) {
  return http.get<OrderResponse>(`/api/student/orders/${orderId}`)
}

export function getStudentSubscription() {
  return http.get<SubscriptionSummaryResponse>('/api/student/subscription')
}
