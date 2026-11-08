import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StudentMistakeReviewPage } from './StudentMistakeReviewPage'
import {
  createMistakeReviewSession,
  listMistakeReviewQuestions,
} from '../../../lib/api/mistakeReviewApi'
import type { MistakeReviewQuestion } from '../../../lib/api/types'

vi.mock('../../../lib/api/mistakeReviewApi', () => ({
  createMistakeReviewSession: vi.fn(),
  listMistakeReviewQuestions: vi.fn(),
}))

const mockedList = vi.mocked(listMistakeReviewQuestions)
const mockedCreate = vi.mocked(createMistakeReviewSession)

function makeQuestion(overrides: Partial<MistakeReviewQuestion> = {}): MistakeReviewQuestion {
  return {
    questionId: 1,
    questionText: 'What is the capital of France?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      { id: 11, text: 'Paris', order: 1 },
      { id: 12, text: 'London', order: 2 },
    ],
    courseId: 10,
    courseName: 'English B1',
    lessonId: 20,
    lessonTitle: 'Lesson 1',
    ...overrides,
  }
}

function listResponse(
  content: MistakeReviewQuestion[],
  nextCursor: string | null = null,
  hasNext = false,
): Awaited<ReturnType<typeof listMistakeReviewQuestions>> {
  return { data: { content, nextCursor, hasNext, size: content.length } } as unknown as Awaited<
    ReturnType<typeof listMistakeReviewQuestions>
  >
}

function createResponse(sessionId: number | null): Awaited<ReturnType<typeof createMistakeReviewSession>> {
  return { data: { sessionId, questionCount: sessionId === null ? 0 : 1, questions: [] } } as unknown as Awaited<
    ReturnType<typeof createMistakeReviewSession>
  >
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/student/mistake-review']}>
      <Routes>
        <Route path="/student/mistake-review" element={<StudentMistakeReviewPage />} />
        <Route path="/student/mistake-review/sessions/:sessionId" element={<div>Session route</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('StudentMistakeReviewPage', () => {
  beforeEach(() => {
    mockedList.mockReset()
    mockedCreate.mockReset()
  })

  it('renders review questions with type and lesson context', async () => {
    mockedList.mockResolvedValue(listResponse([makeQuestion()]))

    renderPage()

    expect(await screen.findByText('What is the capital of France?')).toBeInTheDocument()
    expect(screen.getByText('Trắc nghiệm')).toBeInTheDocument()
    expect(screen.getByText('English B1 · Lesson 1')).toBeInTheDocument()
  })

  it('shows the empty state when the pool is empty', async () => {
    mockedList.mockResolvedValue(listResponse([]))

    renderPage()

    expect(await screen.findByText('Bạn chưa có câu sai nào cần ôn')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Khám phá khóa học' })).toHaveAttribute('href', '/student/courses')
  })

  it('shows an error and retries the list fetch', async () => {
    mockedList
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(listResponse([makeQuestion()]))

    renderPage()

    expect(await screen.findByText('Không thể tải danh sách câu hỏi cần ôn.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))

    expect(await screen.findByText('What is the capital of France?')).toBeInTheDocument()
    expect(mockedList).toHaveBeenCalledTimes(2)
  })

  it('loads the next cursor page', async () => {
    mockedList
      .mockResolvedValueOnce(listResponse([makeQuestion()], 'next-page', true))
      .mockResolvedValueOnce(listResponse([makeQuestion({ questionId: 2, questionText: 'Second question' })]))

    renderPage()

    await screen.findByText('What is the capital of France?')
    fireEvent.click(screen.getByRole('button', { name: 'Trang tiếp' }))

    expect(await screen.findByText('Second question')).toBeInTheDocument()
    expect(mockedList).toHaveBeenLastCalledWith({ size: 20, cursor: 'next-page' })
  })

  it('creates a session and navigates to it', async () => {
    mockedList.mockResolvedValue(listResponse([makeQuestion()]))
    mockedCreate.mockResolvedValue(createResponse(42))

    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Ôn tập ngay' }))

    expect(await screen.findByText('Session route')).toBeInTheDocument()
    expect(mockedCreate).toHaveBeenCalledTimes(1)
  })

  it('shows the empty state when session creation returns no session', async () => {
    mockedList.mockResolvedValue(listResponse([makeQuestion()]))
    mockedCreate.mockResolvedValue(createResponse(null))

    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Ôn tập ngay' }))

    expect(await screen.findByText('Bạn chưa có câu sai nào cần ôn')).toBeInTheDocument()
    expect(screen.queryByText('Session route')).not.toBeInTheDocument()
  })

  it('retries session creation after an error', async () => {
    mockedList.mockResolvedValue(listResponse([makeQuestion()]))
    mockedCreate
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(createResponse(42))

    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Ôn tập ngay' }))

    expect(await screen.findByText('Không thể bắt đầu phiên ôn tập.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))

    expect(await screen.findByText('Session route')).toBeInTheDocument()
    expect(mockedCreate).toHaveBeenCalledTimes(2)
  })

  it('does not create duplicate sessions on double click', async () => {
    mockedList.mockResolvedValue(listResponse([makeQuestion()]))
    let resolveCreate!: (value: Awaited<ReturnType<typeof createMistakeReviewSession>>) => void
    mockedCreate.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve
      }),
    )

    renderPage()

    const startButton = await screen.findByRole('button', { name: 'Ôn tập ngay' })
    fireEvent.click(startButton)
    fireEvent.click(startButton)

    await waitFor(() => expect(mockedCreate).toHaveBeenCalledTimes(1))
    resolveCreate(createResponse(42))
  })
})
