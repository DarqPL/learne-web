import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { TeacherCourse } from '../../../lib/api/types'
import { CourseForm } from './CourseForm'
import { getCourseInitialValue } from './teacherContentMappers'

describe('CourseForm pricing', () => {
  it('forces A1 courses to free pricing', () => {
    const onSubmit = vi.fn()
    render(
      <CourseForm
        submitLabel="Lưu khóa học"
        onSubmit={onSubmit}
        initialValue={{
          name: 'A1 Forced',
          description: '',
          type: 'COMPREHENSIVE',
          level: 'A1',
          orderIndex: 0,
          pricingType: 'PAID',
          proposedPriceAmountVnd: 100000,
        }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Lưu khóa học' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ level: 'A1', pricingType: 'FREE', proposedPriceAmountVnd: null }),
    )
  })

  it('requires a positive price for paid A2+ courses', () => {
    const onSubmit = vi.fn()
    render(
      <CourseForm
        submitLabel="Lưu khóa học"
        onSubmit={onSubmit}
        initialValue={{
          name: 'Tiếng Anh A2',
          description: '',
          type: 'COMPREHENSIVE',
          level: 'A2',
          orderIndex: 0,
          pricingType: 'PAID',
          proposedPriceAmountVnd: null,
        }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Lưu khóa học' }))

    expect(screen.getByText('Vui lòng nhập giá bán lớn hơn 0.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('preserves pricing in getCourseInitialValue so the form renders paid state after save', () => {
    const course = {
      name: 'Tiếng Anh B1',
      description: '',
      type: 'COMPREHENSIVE',
      level: 'B1',
      orderIndex: 0,
      pricingType: 'PAID',
      proposedPriceAmountVnd: 100000,
    } as TeacherCourse

    expect(getCourseInitialValue(course)).toMatchObject({ pricingType: 'PAID', proposedPriceAmountVnd: 100000 })

    const freeCourse = { ...course, pricingType: 'FREE', proposedPriceAmountVnd: null } as TeacherCourse
    expect(getCourseInitialValue(freeCourse)).toMatchObject({ pricingType: 'FREE', proposedPriceAmountVnd: null })

    const onSubmit = vi.fn()
    render(<CourseForm submitLabel="Lưu khóa học" onSubmit={onSubmit} initialValue={getCourseInitialValue(course)} />)

    const priceInput = screen.getByLabelText('Giá đề xuất (VND)') as HTMLInputElement
    expect(priceInput.value).toBe('100.000')
    expect(screen.getByRole('combobox', { name: 'Hình thức giá' }).textContent).toContain('Trả phí')
  })

  it('formats VND with thousands separators while typing and submits the numeric payload', () => {
    const onSubmit = vi.fn()
    render(
      <CourseForm
        submitLabel="Lưu khóa học"
        onSubmit={onSubmit}
        initialValue={{
          name: 'Tiếng Anh A2',
          description: '',
          type: 'COMPREHENSIVE',
          level: 'A2',
          orderIndex: 0,
          pricingType: 'PAID',
          proposedPriceAmountVnd: null,
        }}
      />,
    )

    const priceInput = screen.getByLabelText('Giá đề xuất (VND)') as HTMLInputElement
    fireEvent.change(priceInput, { target: { value: '100000' } })

    expect(priceInput.value).toBe('100.000')

    fireEvent.click(screen.getByRole('button', { name: 'Lưu khóa học' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ pricingType: 'PAID', proposedPriceAmountVnd: 100000 }))
  })
})
