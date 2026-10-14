export function getCurrentMonth(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}

export function getLast6Months(month: string): string[] {
  const [yearText, monthText] = month.split('-')
  const year = Number(yearText)
  const monthIndex = Number(monthText) - 1
  const result: string[] = []
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(year, monthIndex - offset, 1)
    const label = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    result.push(label)
  }
  return result
}

export function formatMonthLabel(month: string): string {
  const [year, mon] = month.split('-')
  return `${mon}/${year}`
}

export function formatVnd(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

export function formatCompactVnd(value: number): string {
  const compact = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
  return `${compact} ₫`
}

export function planCodeLabel(planCode: string): string {
  if (planCode === 'PRO_PLUS') return 'PRO+'
  return planCode
}

export function getCurrentYear(): number {
  return new Date().getFullYear()
}

export function getYearMonths(year: number): string[] {
  return Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, '0')}`)
}
