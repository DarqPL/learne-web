import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminRevenueSection } from './AdminRevenueSection'
import { getCourseSales, getPlanSales, getTeacherShare } from '../../lib/api/adminRevenueApi'
import { getCurrentYear } from './adminRevenueUtils'
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
    if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = () => {}
    }
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

  it('renders yearly chart with 12 months when year mode is selected', async () => {
    mockedCourseSales.mockImplementation(
      async (month: string) =>
        apiResponse({ month, rows: [makeCourseRow({ netRevenueVnd: 100_000, courseName: `Year course ${month}` })] }) as never,
    )
    mockedPlanSales.mockImplementation(
      async (month: string) => apiResponse({ month, rows: [makePlanRow({ netRevenueVnd: 100_000 })] }) as never,
    )
    mockedTeacherShare.mockResolvedValue({
      data: { month: '2026-10', planRevenuePoolVnd: 0, totalActivityScore: 0, rows: [] },
    } as never)

    render(<AdminRevenueSection initialMonth="2026-10" />)

    fireEvent.click(await screen.findByRole('button', { name: /theo năm/i }))

    // 12 months x (100k course + 100k plan) = 2.400.000 net
    expect(await screen.findByText(/tổng năm 2026/i)).toBeInTheDocument()
    expect(await screen.findByText(/2\.400\.000/)).toBeInTheDocument()

    await waitFor(() => {
      expect(mockedCourseSales).toHaveBeenCalledWith('2026-01')
      expect(mockedCourseSales).toHaveBeenCalledWith('2026-12')
    })
    const calledMonths = mockedCourseSales.mock.calls.map((call) => call[0])
    expect(new Set(calledMonths).size).toBe(12)

    const yearCard = screen.getByText(/tổng năm 2026/i).closest('[data-slot="card"]')
    expect(yearCard).not.toBeNull()
    for (let index = 1; index <= 12; index += 1) {
      expect(screen.getAllByText(`T${index}`, { exact: true }).length).toBeGreaterThanOrEqual(1)
    }
  })

  it('renders zero columns for empty months in year mode', async () => {
    mockedCourseSales.mockResolvedValue(apiResponse({ month: '2026-10', rows: [] }) as never)
    mockedPlanSales.mockResolvedValue({ data: { month: '2026-10', rows: [] } } as never)
    mockedTeacherShare.mockResolvedValue({
      data: { month: '2026-10', planRevenuePoolVnd: 0, totalActivityScore: 0, rows: [] },
    } as never)

    render(<AdminRevenueSection initialMonth="2026-10" />)

    fireEvent.click(await screen.findByRole('button', { name: /theo năm/i }))

    expect(await screen.findByText(/tổng năm 2026/i)).toBeInTheDocument()
    const yearCard = screen.getByText(/tổng năm 2026/i).closest('[data-slot="card"]')
    expect(yearCard).not.toBeNull()
    expect(within(yearCard as HTMLElement).getAllByText(/0\s*₫/).length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows error banner when a yearly fetch fails', async () => {
    mockedCourseSales.mockRejectedValue(new Error('boom'))
    mockedPlanSales.mockResolvedValue({ data: { month: '2026-10', rows: [] } } as never)
    mockedTeacherShare.mockResolvedValue({
      data: { month: '2026-10', planRevenuePoolVnd: 0, totalActivityScore: 0, rows: [] },
    } as never)

    render(<AdminRevenueSection initialMonth="2026-10" />)

    fireEvent.click(await screen.findByRole('button', { name: /theo năm/i }))

    expect(await screen.findByText('Không thể tải dữ liệu doanh thu')).toBeInTheDocument()
  })

  it('restores the trend card when switching back to 6 months', async () => {
    setupMocks('2026-03')

    render(<AdminRevenueSection initialMonth="2026-03" />)

    await screen.findByText('Xu hướng 6 tháng')

    fireEvent.click(screen.getByRole('button', { name: /theo năm/i }))
    expect(await screen.findByText(/tổng năm 2026/i)).toBeInTheDocument()
    expect(screen.queryByText('Xu hướng 6 tháng')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /6 tháng/i }))
    expect(await screen.findByText('Xu hướng 6 tháng')).toBeInTheDocument()
  })

  it('marks the segmented view buttons with correct aria-pressed', async () => {
    setupMocks('2026-03')

    render(<AdminRevenueSection initialMonth="2026-03" />)

    await screen.findByText('Xu hướng 6 tháng')

    const trendButton = screen.getByRole('button', { name: /6 tháng/i })
    const yearButton = screen.getByRole('button', { name: /theo năm/i })
    expect(trendButton).toHaveAttribute('aria-pressed', 'true')
    expect(yearButton).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(yearButton)
    await screen.findByText(/tổng năm 2026/i)
    expect(screen.getByRole('button', { name: /6 tháng/i })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: /theo năm/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows year breakdown totals for course and plan revenue', async () => {
    mockedCourseSales.mockImplementation(
      async (month: string) =>
        apiResponse({ month, rows: [makeCourseRow({ netRevenueVnd: 100_000, courseName: `Year course ${month}` })] }) as never,
    )
    mockedPlanSales.mockImplementation(
      async (month: string) =>
        apiResponse({ month, rows: [makePlanRow({ netRevenueVnd: 50_000, planCode: 'VIP' })] }) as never,
    )
    mockedTeacherShare.mockResolvedValue({
      data: { month: '2026-10', planRevenuePoolVnd: 0, totalActivityScore: 0, rows: [] },
    } as never)

    render(<AdminRevenueSection initialMonth="2026-10" />)

    fireEvent.click(await screen.findByRole('button', { name: /theo năm/i }))

    // 12 x 100k course = 1.200.000, 12 x 50k plan = 600.000
    const yearCard = (await screen.findByText(/tổng năm 2026/i)).closest('[data-slot="card"]')
    expect(yearCard).not.toBeNull()
    const withinYear = within(yearCard as HTMLElement)
    expect(await withinYear.findByText(/1\.200\.000/)).toBeInTheDocument()
    expect(withinYear.getByText(/600\.000/)).toBeInTheDocument()
  })

  it('offers only discrete years from 2024 to the current year', async () => {
    setupMocks('2026-03')

    render(<AdminRevenueSection initialMonth="2026-03" />)

    await screen.findByText('Xu hướng 6 tháng')
    fireEvent.click(screen.getByRole('button', { name: /theo năm/i }))
    await screen.findByText(/tổng năm 2026/i)

    const yearTrigger = screen.getByRole('combobox', { name: 'Năm' })
    fireEvent.click(yearTrigger)

    const options = await screen.findAllByRole('option')
    const expected = Array.from({ length: getCurrentYear() - 2024 + 1 }, (_, index) => String(2024 + index))
    expect(options.map((option) => option.textContent?.trim())).toEqual(expected)
    // no number input anymore, so clearing/out-of-range typing cannot fire year-0 requests
    expect(screen.queryByLabelText('Năm')).not.toBeNull()
    expect(document.querySelector('input#admin-revenue-year')).toBeNull()
  })
})
