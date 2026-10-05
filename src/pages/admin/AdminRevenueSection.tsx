import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { XCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../../components/shadcn/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/shadcn/ui/card'
import { Input } from '../../components/shadcn/ui/input'
import { Label } from '../../components/shadcn/ui/label'
import { Skeleton } from '../../components/shadcn/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/shadcn/ui/table'
import { getCourseSales, getPlanSales, getTeacherShare } from '../../lib/api/adminRevenueApi'
import { getApiErrorMessage } from '../../lib/api/client'
import type {
  RevenueCourseSalesRow,
  RevenuePlanSalesRow,
  TeacherShareResponse,
} from '../../lib/api/types'
import {
  formatCompactVnd,
  formatMonthLabel,
  formatVnd,
  getCurrentMonth,
  getLast6Months,
  planCodeLabel,
} from './adminRevenueUtils'

interface TrendPoint {
  month: string
  label: string
  total: number
}

interface AdminRevenueSectionProps {
  initialMonth?: string
}

export function AdminRevenueSection({ initialMonth }: AdminRevenueSectionProps) {
  const [month, setMonth] = useState(initialMonth ?? getCurrentMonth())
  const [courseRows, setCourseRows] = useState<RevenueCourseSalesRow[] | null>(null)
  const [planRows, setPlanRows] = useState<RevenuePlanSalesRow[] | null>(null)
  const [teacherShare, setTeacherShare] = useState<TeacherShareResponse | null>(null)
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function handleMonthChange(value: string) {
    if (!value) return
    setMonth(value)
    setLoading(true)
    setError(null)
  }

  useEffect(() => {
    let cancelled = false

    const months = getLast6Months(month)

    void (async () => {
      try {
        const [trendResults, teacherResponse] = await Promise.all([
          Promise.all(
            months.map(async (targetMonth) => {
              const [courseResponse, planResponse] = await Promise.all([
                getCourseSales(targetMonth),
                getPlanSales(targetMonth),
              ])
              if (cancelled) return null
              const courseRowsForMonth = courseResponse.data.rows ?? []
              const planRowsForMonth = planResponse.data.rows ?? []
              const courseTotal = courseRowsForMonth.reduce((sum, row) => sum + row.netRevenueVnd, 0)
              const planTotal = planRowsForMonth.reduce((sum, row) => sum + row.netRevenueVnd, 0)
              return {
                month: targetMonth,
                label: formatMonthLabel(targetMonth),
                total: courseTotal + planTotal,
                courseRows: courseRowsForMonth,
                planRows: planRowsForMonth,
              }
            }),
          ),
          getTeacherShare(month),
        ])
        if (cancelled) return
        const validResults = trendResults.filter((item) => item !== null)
        setTrend(validResults.map(({ month: pointMonth, label, total }) => ({ month: pointMonth, label, total })))
        const current = validResults[validResults.length - 1]
        setCourseRows(current?.courseRows ?? [])
        setPlanRows(current?.planRows ?? [])
        setTeacherShare(teacherResponse.data)
        setError(null)
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải dữ liệu doanh thu.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [month])

  const courseTotal = (courseRows ?? []).reduce((sum, row) => sum + row.netRevenueVnd, 0)
  const planTotal = (planRows ?? []).reduce((sum, row) => sum + row.netRevenueVnd, 0)
  const totalRevenue = courseTotal + planTotal

  const topCourses = [...(courseRows ?? [])].sort((a, b) => b.netRevenueVnd - a.netRevenueVnd).slice(0, 8)
  const courseChartData = topCourses.map((row) => ({ name: row.courseName, total: row.netRevenueVnd }))
  const planChartData = (planRows ?? []).map((row) => ({ name: planCodeLabel(row.planCode), total: row.netRevenueVnd }))

  return (
    <section aria-label="Doanh thu" className="flex min-w-0 flex-col gap-4">
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-lg font-bold tracking-tight text-gray-950">Doanh thu</h2>
          <p className="text-sm text-gray-600">Theo dõi doanh thu khóa học, gói và chia sẻ giảng viên theo tháng.</p>
        </div>
        <div className="flex w-48 flex-col gap-1.5">
          <Label htmlFor="admin-revenue-month">Tháng</Label>
          <Input
            id="admin-revenue-month"
            type="month"
            value={month}
            onChange={(event) => {
              handleMonthChange(event.target.value)
            }}
          />
        </div>
      </div>

      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <XCircle aria-hidden="true" data-icon="inline-start" />
          <AlertTitle>Không thể tải dữ liệu doanh thu</AlertTitle>
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-28 w-full" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Tổng doanh thu</CardTitle>
              <CardDescription>Tổng net khóa học + gói trong tháng {formatMonthLabel(month)}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-950">{formatVnd(totalRevenue)}</p>
              <p className="mt-1 text-sm text-gray-600">
                Khóa học {formatVnd(courseTotal)} · Gói {formatVnd(planTotal)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Xu hướng 6 tháng</CardTitle>
              <CardDescription>Tổng doanh thu net 6 tháng gần nhất</CardDescription>
            </CardHeader>
            <CardContent>
              {trend.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  Chưa có dữ liệu xu hướng doanh thu.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trend} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                        <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} />
                        <YAxis tickFormatter={(value: number) => formatCompactVnd(value)} tick={{ fontSize: 12 }} width={80} />
                        <Tooltip
                          formatter={(value) => formatVnd(Number(value))}
                          labelFormatter={(label) => `Tháng ${String(label)}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="total"
                          name="Doanh thu"
                          stroke="#4f46e5"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="rounded-xl border border-indigo-100 bg-white shadow-sm [&>[data-slot=table-container]]:max-h-[40vh] [&>[data-slot=table-container]]:overflow-y-auto">
                    <Table className="[&_tr]:border-indigo-100/70">
                      <TableHeader className="sticky top-0 z-10 [&_th]:bg-indigo-50">
                        <TableRow>
                          <TableHead>Tháng</TableHead>
                          <TableHead className="text-right">Doanh thu net</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trend.map((point) => (
                          <TableRow key={point.month}>
                            <TableCell className="font-medium">{point.label}</TableCell>
                            <TableCell className="text-right">{formatVnd(point.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Theo khóa học</CardTitle>
                <CardDescription>Top 8 khóa học theo doanh thu net</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {courseChartData.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                    Chưa có dữ liệu doanh thu khóa học.
                  </p>
                ) : (
                  <>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={courseChartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                          <YAxis
                            tickFormatter={(value: number) => formatCompactVnd(value)}
                            tick={{ fontSize: 12 }}
                            width={80}
                          />
                          <Tooltip formatter={(value) => formatVnd(Number(value))} />
                          <Bar dataKey="total" name="Doanh thu" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="rounded-xl border border-indigo-100 bg-white shadow-sm [&>[data-slot=table-container]]:max-h-[40vh] [&>[data-slot=table-container]]:overflow-y-auto">
                      <Table className="[&_tr]:border-indigo-100/70">
                        <TableHeader className="sticky top-0 z-10 [&_th]:bg-indigo-50">
                          <TableRow>
                            <TableHead>Khóa học</TableHead>
                            <TableHead className="text-right">Doanh thu net</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topCourses.map((row) => (
                            <TableRow key={row.courseId}>
                              <TableCell className="font-medium">{row.courseName}</TableCell>
                              <TableCell className="text-right">{formatVnd(row.netRevenueVnd)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Theo gói</CardTitle>
                <CardDescription>Doanh thu net theo gói đăng ký</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {planChartData.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                    Chưa có dữ liệu doanh thu gói.
                  </p>
                ) : (
                  <>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={planChartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                          <YAxis
                            tickFormatter={(value: number) => formatCompactVnd(value)}
                            tick={{ fontSize: 12 }}
                            width={80}
                          />
                          <Tooltip formatter={(value) => formatVnd(Number(value))} />
                          <Bar dataKey="total" name="Doanh thu" fill="#059669" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="rounded-xl border border-indigo-100 bg-white shadow-sm [&>[data-slot=table-container]]:max-h-[40vh] [&>[data-slot=table-container]]:overflow-y-auto">
                      <Table className="[&_tr]:border-indigo-100/70">
                        <TableHeader className="sticky top-0 z-10 [&_th]:bg-indigo-50">
                          <TableRow>
                            <TableHead>Gói</TableHead>
                            <TableHead className="text-right">Doanh thu net</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(planRows ?? []).map((row) => (
                            <TableRow key={row.planCode}>
                              <TableCell className="font-medium">{planCodeLabel(row.planCode)}</TableCell>
                              <TableCell className="text-right">{formatVnd(row.netRevenueVnd)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Chia sẻ giảng viên</CardTitle>
              <CardDescription>
                Đề xuất chia sẻ doanh thu gói theo điểm hoạt động · Tháng {formatMonthLabel(month)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!teacherShare || teacherShare.rows.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  Chưa có dữ liệu chia sẻ giảng viên.
                </p>
              ) : (
                <div className="rounded-xl border border-indigo-100 bg-white shadow-sm [&>[data-slot=table-container]]:max-h-[60vh] [&>[data-slot=table-container]]:overflow-y-auto">
                  <Table className="[&_tr]:border-indigo-100/70">
                    <TableHeader className="sticky top-0 z-10 [&_th]:bg-indigo-50">
                      <TableRow>
                        <TableHead>giảng viên</TableHead>
                        <TableHead>điểm hoạt động</TableHead>
                        <TableHead className="text-right">doanh thu trực tiếp</TableHead>
                        <TableHead className="text-right">chia từ gói</TableHead>
                        <TableHead className="text-right">tổng đề xuất</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teacherShare.rows.map((row) => (
                        <TableRow key={row.teacherId}>
                          <TableCell className="font-medium">{row.teacherName}</TableCell>
                          <TableCell>{new Intl.NumberFormat('vi-VN').format(row.activityScore)}</TableCell>
                          <TableCell className="text-right">{formatVnd(row.directCourseNetRevenueVnd)}</TableCell>
                          <TableCell className="text-right">{formatVnd(row.suggestedPlanShareVnd)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatVnd(row.suggestedTotalShareVnd)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  )
}
