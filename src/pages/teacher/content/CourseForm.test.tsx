import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CourseForm } from './CourseForm'

describe('CourseForm pricing', () => {
  it('forces A1 courses to free pricing', () => {
    const onSubmit = vi.fn()
    render(<CourseForm submitLabel="Lưu khóa học" onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Tên khóa học'), { target: { value: 'Tiếng Anh A1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu khóa học' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ pricingType: 'FREE', proposedPriceAmountVnd: null }),
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
})
