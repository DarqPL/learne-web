// frontend/src/lib/api/adminCouponApi.ts
import { http } from './client'
import type { AdminCoupon, AdminCouponCreatePayload, AdminCouponUpdatePayload, NumberedPage } from './types'
const base = '/api/admin/coupons'
export function listAdminCoupons(params?: { page?: number; size?: number }) {
  return http.get<NumberedPage<AdminCoupon>>(base, { params })
}
export function getAdminCoupon(id: number) { return http.get<AdminCoupon>(`${base}/${id}`) }
export function createAdminCoupon(payload: AdminCouponCreatePayload) { return http.post<AdminCoupon>(base, payload) }
export function updateAdminCoupon(id: number, payload: AdminCouponUpdatePayload) { return http.patch<AdminCoupon>(`${base}/${id}`, payload) }
export function disableAdminCoupon(id: number) { return http.post<AdminCoupon>(`${base}/${id}/disable`, {}) }
