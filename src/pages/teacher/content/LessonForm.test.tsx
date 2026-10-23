import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LessonForm } from './LessonForm'

describe('LessonForm simplified', () => {
  it('does not render an XP input', () => {
    render(<LessonForm submitLabel="Lưu bài học" onSubmit={vi.fn()} />)

    expect(screen.queryByLabelText('XP')).not.toBeInTheDocument()
    expect(screen.queryByText('XP')).not.toBeInTheDocument()
  })

  it('submits a new lesson with default xpReward 0', () => {
    const onSubmit = vi.fn()
    render(<LessonForm submitLabel="Lưu bài học" onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Tiêu đề bài học'), { target: { value: 'Bài mới' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu bài học' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: 'Bài mới', xpReward: 0 }))
  })

  it('preserves the initial xpReward on edit', () => {
    const onSubmit = vi.fn()
    render(
      <LessonForm
        submitLabel="Lưu bài học"
        onSubmit={onSubmit}
        initialValue={{
          title: 'Bài cũ',
          description: '',
          content: '',
          skillType: 'GRAMMAR',
          orderIndex: 0,
          xpReward: 25,
          placementTest: false,
        }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Lưu bài học' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: 'Bài cũ', xpReward: 25 }))
  })

  it('keeps unsaved input when initialValue changes identity with the same fields', () => {
    const initialValue = {
      title: 'Bài cũ',
      description: 'Mô tả cũ',
      content: 'Nội dung cũ',
      skillType: 'GRAMMAR' as const,
      orderIndex: 0,
      xpReward: 25,
      placementTest: false,
    }
    const { rerender } = render(<LessonForm submitLabel="Lưu bài học" onSubmit={vi.fn()} initialValue={initialValue} />)

    fireEvent.change(screen.getByLabelText('Tiêu đề bài học'), { target: { value: 'Bài mới' } })

    rerender(<LessonForm submitLabel="Lưu bài học" onSubmit={vi.fn()} initialValue={{ ...initialValue }} />)

    expect(screen.getByLabelText('Tiêu đề bài học')).toHaveValue('Bài mới')
  })
})
