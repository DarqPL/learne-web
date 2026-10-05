import { http } from './client'
import type {
  RevenueCourseSalesRow,
  RevenuePlanSalesRow,
  TeacherShareResponse,
} from './types'

export function getCourseSales(month: string) {
  return http.get<RevenueCourseSalesRow[]>('/api/admin/revenue/course-sales', { params: { month } })
}

export function getPlanSales(month: string) {
  return http.get<RevenuePlanSalesRow[]>('/api/admin/revenue/plan-sales', { params: { month } })
}

export function getTeacherShare(month: string) {
  return http.get<TeacherShareResponse>('/api/admin/revenue/teacher-share', { params: { month } })
}
