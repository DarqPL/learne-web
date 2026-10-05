import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminRevenueSection } from './AdminRevenueSection'
import { getCourseSales, getPlanSales, getTeacherShare } from '../../lib/api/adminRevenueApi'
import type {
  RevenueCourseSalesRow,
  RevenuePlanSalesRow,
  RevenueTeacherShareRow,
} from '../../lib/api/types'

vi.mock('../../lib/api/adminRevenueApi', () => ({
  getCourseSales: vi.fn(),
  getPlanSales: vi.fn(),
  getTeacherShare: vi.fn(),
}))

const mockedCourseSales = vi.mocked(getCourseSales)
const mockedPlanSales = vi.mocked(getPlanSales)
const mockedTeacherShare = vi.mocked(getTeacherShare)

function apiResponse<T>(data: T) {
  return { data } as unknown as Awaited<ReturnType<typeof getCourseSales>>
}

function makeCourseRow(overrides: Partial<RevenueCourseSalesRow> = {}): RevenueCourseSalesRow {
  return {
    courseId: 1,
    courseName: 'Khóa học A',
    teacherId: 10,
    teacherName: 'Giảng viên A',
    paidOrderCount: 5,
    grossRevenueVnd: 1_200_000,
    discountAmountVnd: 200_000,
    netRevenueVnd: 1_000_000,
    ...overrides,
  }
}

function makePlanRow(overrides: Partial<RevenuePlanSalesRow> = {}): RevenuePlanSalesRow {
  return {
    planCode: 'VIP',
    paidOrderCount: 3,
    grossRevenueVnd: 600_000,
    discountAmountVnd: 100_000,
    netRevenueVnd: 500_000,
    ...overrides,
  }
}

function makeTeacherRow(overrides: Partial<RevenueTeacherShareRow> = {}): RevenueTeacherShareRow {
  return {
    teacherId: 10,
    teacherName: 'Giảng viên A',
    activityScore: 120,
    directCourseNetRevenueVnd: 1_000_000,
    suggestedPlanShareVnd: 250_000,
    suggestedTotalShareVnd: 1_250_000,
    ...overrides,
  }
}

function setupMocks(currentMonth = '2026-03') {
  mockedCourseSales.mockImplementation(async (month: string) => {
    if (month === currentMonth) {
      return apiResponse({
        month,
        rows: [
          makeCourseRow({ netRevenueVnd: 1_000_000, courseName: 'Khóa học A' }),
          makeCourseRow({ courseId: 2, courseName: 'Khóa học B', netRevenueVnd: 2_000_000 }),
        ],
      }) as never
    }
    return apiResponse({ month, rows: [makeCourseRow({ netRevenueVnd: 500_000, courseName: `Khóa ${month}` })] }) as never
  })
  mockedPlanSales.mockImplementation(async (month: string) => {
    if (month === currentMonth) {
      return apiResponse({ month, rows: [makePlanRow({ netRevenueVnd: 500_000 })] }) as never
    }
    return apiResponse({ month, rows: [makePlanRow({ netRevenueVnd: 100_000, planCode: 'PRO' })] }) as never
  })
  mockedTeacherShare.mockImplementation(async (month: string) => {
    return {
      data: {
        month,
        planRevenuePoolVnd: 500_000,
        totalActivityScore: 120,
        rows: [makeTeacherRow()],
      },
    } as never
  })
}

describe('AdminRevenueSection', () => {
  beforeEach(() => {
    mockedCourseSales.mockReset()
    mockedPlanSales.mockReset()
    mockedTeacherShare.mockReset()
    // jsdom + recharts: give ResponsiveContainer a non-zero size
    class SizedResizeObserver {
      callback: ResizeObserverCallback
      constructor(callback: ResizeObserverCallback) {
        this.callback = callback
      }
      observe(target: Element) {
        this.callback(
          [{ contentRect: { width: 800, height: 400 }, target } as unknown as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        )
      }
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', SizedResizeObserver)
  })

  it('shows skeleton while loading revenue', () => {
    mockedCourseSales.mockReturnValue(new Promise(() => {}) as never)
    mockedPlanSales.mockReturnValue(new Promise(() => {}) as never)
    mockedTeacherShare.mockReturnValue(new Promise(() => {}) as never)

    render(<AdminRevenueSection initialMonth="2026-03" />)

    expect(document.querySelector('[data-slot="skeleton"]')).not.toBeNull()
  })

  it('computes total revenue as sum of course net + plan net', async () => {
    setupMocks('2026-03')

    render(<AdminRevenueSection initialMonth="2026-03" />)

    // 1_000_000 + 2_000_000 + 500_000 = 3_500_000 (total card + trend fallback table)
    expect((await screen.findAllByText(/3\.500\.000/)).length).toBeGreaterThanOrEqual(1)
  })

  it('fetches 6 months for the trend and renders 6 month labels', async () => {
    setupMocks('2026-03')

    render(<AdminRevenueSection initialMonth="2026-03" />)

    await screen.findAllByText(/3\.500\.000/)

    await waitFor(() => {
      expect(mockedCourseSales.mock.calls.length).toBeGreaterThanOrEqual(6)
    })

    const calledMonths = mockedCourseSales.mock.calls.map((call) => call[0])
    expect(new Set(calledMonths).size).toBe(6)
    expect(calledMonths).toContain('2026-03')

    // XAxis labels MM/YYYY for the 6-month window (10/2025 -> 03/2026)
    expect(await screen.findByText('Xu hướng 6 tháng')).toBeInTheDocument()
    const trendCard = screen.getByText('Xu hướng 6 tháng').closest('[data-slot="card"]')
    expect(trendCard).not.toBeNull()
    const withinTrend = within(trendCard as HTMLElement)
    expect(withinTrend.getAllByText('10/2025').length).toBeGreaterThanOrEqual(1)
    expect(withinTrend.getAllByText('03/2026').length).toBeGreaterThanOrEqual(1)

    // a11y fallback table lists the same 6 months + net totals
    const trendTable = withinTrend.getByRole('table')
    const withinTable = within(trendTable)
    expect(withinTable.getByText('10/2025')).toBeInTheDocument()
    expect(withinTable.getByText('03/2026')).toBeInTheDocument()
    expect(withinTable.getAllByRole('row')).toHaveLength(7)
    // prior months: 500k course + 100k plan = 600k net
    expect(withinTable.getAllByText(/600\.000/).length).toBeGreaterThanOrEqual(1)
    // current month: 1M + 2M + 500k = 3.5M net
    expect(withinTable.getByText(/3\.500\.000/)).toBeInTheDocument()
  })

  it('renders course, plan and teacher-share tables with Vietnamese headers', async () => {
    setupMocks('2026-03')

    render(<AdminRevenueSection initialMonth="2026-03" />)

    expect(await screen.findByText('Khóa học A')).toBeInTheDocument()
    expect(screen.getByText('Khóa học B')).toBeInTheDocument()
    expect(screen.getByText('VIP')).toBeInTheDocument()
    expect(screen.getByText('Giảng viên A')).toBeInTheDocument()

    expect(screen.getByText('Theo khóa học')).toBeInTheDocument()
    expect(screen.getByText('Theo gói')).toBeInTheDocument()
    expect(screen.getByText('giảng viên')).toBeInTheDocument()
    expect(screen.getByText('điểm hoạt động')).toBeInTheDocument()
    expect(screen.getByText('doanh thu trực tiếp')).toBeInTheDocument()
    expect(screen.getByText('chia từ gói')).toBeInTheDocument()
    expect(screen.getByText('tổng đề xuất')).toBeInTheDocument()

    // indigo table chrome reused from teacher-style tables
    const header = document.querySelector('[data-slot="table-header"]')
    expect(header?.className).toContain('bg-indigo-50')
  })

  it('refetches when the month changes', async () => {
    setupMocks('2026-03')

    render(<AdminRevenueSection initialMonth="2026-03" />)

    await screen.findAllByText(/3\.500\.000/)
    expect(mockedCourseSales).toHaveBeenCalledWith('2026-03')

    const monthInput = screen.getByLabelText('Tháng') as HTMLInputElement
    fireEvent.change(monthInput, { target: { value: '2026-02' } })

    await waitFor(() => {
      expect(mockedCourseSales).toHaveBeenCalledWith('2026-02')
    })
    expect(mockedPlanSales).toHaveBeenCalledWith('2026-02')
    expect(mockedTeacherShare).toHaveBeenCalledWith('2026-02')
  })

  it('shows empty states when there is no revenue data', async () => {
    mockedCourseSales.mockResolvedValue(apiResponse({ month: '2026-03', rows: [] }) as never)
    mockedPlanSales.mockResolvedValue({ data: { month: '2026-03', rows: [] } } as never)
    mockedTeacherShare.mockResolvedValue({
      data: { month: '2026-03', planRevenuePoolVnd: 0, totalActivityScore: 0, rows: [] },
    } as never)

    render(<AdminRevenueSection initialMonth="2026-03" />)

    expect(await screen.findByText('Chưa có dữ liệu doanh thu khóa học.')).toBeInTheDocument()
    expect(screen.getByText('Chưa có dữ liệu doanh thu gói.')).toBeInTheDocument()
    expect(screen.getByText('Chưa có dữ liệu chia sẻ giảng viên.')).toBeInTheDocument()
  })

  it('shows an alert when revenue fetch fails', async () => {
    mockedCourseSales.mockRejectedValue(new Error('boom'))
    mockedPlanSales.mockResolvedValue({ data: { month: '2026-03', rows: [] } } as never)
    mockedTeacherShare.mockResolvedValue({
      data: { month: '2026-03', planRevenuePoolVnd: 0, totalActivityScore: 0, rows: [] },
    } as never)

    render(<AdminRevenueSection initialMonth="2026-03" />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
