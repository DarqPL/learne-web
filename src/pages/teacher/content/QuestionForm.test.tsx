import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QuestionForm } from './QuestionForm'

describe('QuestionForm simplified', () => {
  it('does not render XP, difficulty, or knowledge-point inputs', () => {
    render(<QuestionForm submitLabel="Tạo câu hỏi" onSubmit={vi.fn()} />)

    expect(screen.queryByLabelText('XP')).not.toBeInTheDocument()
    expect(screen.queryByText('XP')).not.toBeInTheDocument()
    expect(screen.queryByText('Độ khó')).not.toBeInTheDocument()
    expect(screen.queryByText('Điểm kiến thức')).not.toBeInTheDocument()
  })

  it('submits a new question with defaults for xpReward, difficulty, and knowledgePoint', () => {
    const onSubmit = vi.fn()
    render(<QuestionForm submitLabel="Tạo câu hỏi" onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Câu hỏi'), { target: { value: 'What is this?' } })
    fireEvent.change(screen.getByLabelText('Nội dung lựa chọn 1'), { target: { value: 'Option A' } })
    fireEvent.change(screen.getByLabelText('Nội dung lựa chọn 2'), { target: { value: 'Option B' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ questionText: 'What is this?', xpReward: 0, difficulty: 'A1', knowledgePoint: '' }),
    )
  })

  it('preserves initial xpReward, difficulty, and knowledgePoint on edit', () => {
    const onSubmit = vi.fn()
    render(
      <QuestionForm
        submitLabel="Lưu câu hỏi"
        onSubmit={onSubmit}
        initialValue={{
          type: 'MULTIPLE_CHOICE',
          questionText: 'Existing?',
          explanation: '',
          correctAnswer: '',
          knowledgePoint: 'grammar-point',
          orderIndex: 0,
          difficulty: 'B2',
          xpReward: 15,
          options: [
            { optionText: 'Option A', correct: true, orderIndex: 0 },
            { optionText: 'Option B', correct: false, orderIndex: 1 },
          ],
        }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Lưu câu hỏi' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ questionText: 'Existing?', xpReward: 15, difficulty: 'B2', knowledgePoint: 'grammar-point' }),
    )
  })
})
