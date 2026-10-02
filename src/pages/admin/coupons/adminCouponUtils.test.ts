import { describe, expect, it } from 'vitest'
import { formatCouponDiscount } from './adminCouponLabels'
import { formatIdList, fromDatetimeLocalValue, parseIdList, toDatetimeLocalValue } from './adminCouponUtils'

describe('toDatetimeLocalValue', () => {
  it('formats a local date as YYYY-MM-DDTHH:mm', () => {
    expect(toDatetimeLocalValue(new Date(2026, 0, 15, 8, 30).toISOString())).toBe('2026-01-15T08:30')
  })

  it('zero-pads month, day, hour and minute', () => {
    expect(toDatetimeLocalValue(new Date(2026, 8, 3, 4, 5).toISOString())).toBe('2026-09-03T04:05')
  })

  it('returns an empty string for an invalid date', () => {
    expect(toDatetimeLocalValue('khong-phai-ngay')).toBe('')
  })
})

describe('fromDatetimeLocalValue', () => {
  it('converts a datetime-local value to an ISO string', () => {
    expect(fromDatetimeLocalValue('2026-01-15T08:30')).toBe(new Date(2026, 0, 15, 8, 30).toISOString())
  })

  it('round-trips with toDatetimeLocalValue', () => {
    const iso = new Date(2026, 5, 1, 23, 59).toISOString()
    expect(toDatetimeLocalValue(fromDatetimeLocalValue(toDatetimeLocalValue(iso)))).toBe('2026-06-01T23:59')
  })
})

describe('parseIdList', () => {
  it('parses ids separated by commas', () => {
    expect(parseIdList('1,2,3')).toEqual([1, 2, 3])
  })

  it('parses ids separated by whitespace or newlines', () => {
    expect(parseIdList('1 2\n3\t4')).toEqual([1, 2, 3, 4])
  })

  it('handles mixed separators and stray whitespace', () => {
    expect(parseIdList(' 1, 2 ,3 ')).toEqual([1, 2, 3])
  })

  it('drops non-numeric, zero and negative tokens', () => {
    expect(parseIdList('1,abc,,0,-5,2')).toEqual([1, 2])
  })

  it('drops fractional ids', () => {
    expect(parseIdList('1,2.5,3')).toEqual([1, 3])
  })

  it('dedupes ids keeping first occurrence order', () => {
    expect(parseIdList('3,1,3,2,1')).toEqual([3, 1, 2])
  })

  it('returns an empty array for empty or invalid input', () => {
    expect(parseIdList('')).toEqual([])
    expect(parseIdList('   ')).toEqual([])
    expect(parseIdList('abc')).toEqual([])
  })
})

describe('formatIdList', () => {
  it('joins ids with comma and space', () => {
    expect(formatIdList([1, 2, 3])).toBe('1, 2, 3')
  })

  it('returns an empty string for an empty list', () => {
    expect(formatIdList([])).toBe('')
  })

  it('round-trips with parseIdList', () => {
    expect(parseIdList(formatIdList([4, 7, 9]))).toEqual([4, 7, 9])
  })
})

describe('formatCouponDiscount', () => {
  it('formats percent discounts', () => {
    expect(formatCouponDiscount({ discountType: 'PERCENT', discountValue: 20 })).toBe('Giảm 20%')
  })

  it('formats fixed amount discounts in VND', () => {
    expect(formatCouponDiscount({ discountType: 'FIXED_AMOUNT', discountValue: 100000 })).toBe('Giảm 100.000\u00a0₫')
  })
})