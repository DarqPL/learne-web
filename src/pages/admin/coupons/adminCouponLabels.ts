import type { AdminCoupon, CouponDiscountType, CouponProductScope } from '../../../lib/api/types'
import { formatVnd } from '../../student/payment/paymentUtils'

export const couponDiscountTypeLabels: Record<CouponDiscountType, string> = {
  PERCENT: 'Theo %',
  FIXED_AMOUNT: 'Số tiền',
}

export const couponProductScopeLabels: Record<CouponProductScope, string> = {
  COURSE_PURCHASE: 'Khóa học',
  VIP: 'VIP',
  PRO: 'PRO',
  PRO_PLUS: 'PRO+',
}

export const couponStatusLabels: Record<'active' | 'inactive', string> = {
  active: 'Đang hoạt động',
  inactive: 'Đã vô hiệu hóa',
}

export function couponStatusLabel(active: boolean): string {
  return active ? couponStatusLabels.active : couponStatusLabels.inactive
}

export function formatCouponDiscount(coupon: Pick<AdminCoupon, 'discountType' | 'discountValue'>): string {
  if (coupon.discountType === 'PERCENT') {
    return `Giảm ${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(coupon.discountValue)}%`
  }
  return `Giảm ${formatVnd(coupon.discountValue)}`
}