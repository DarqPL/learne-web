import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StudentMistakeReviewSessionPage } from './StudentMistakeReviewSessionPage'
import {
  getMistakeReviewSession,
  submitMistakeReviewSession,
} from '../../../lib/api/mistakeReviewApi'
import type {
  MistakeReviewAnswerResult,
  MistakeReviewQuestion,
  MistakeReviewSessionResponse,
} from '../../../lib/api/types'

vi.mock('../../../lib/api/mistakeReviewApi', () => ({
  getMistakeReviewSession: vi.fn(),
  submitMistakeReviewSession: vi.fn(),
}))

const mockedGet = vi.mocked(getMistakeReviewSession)
const mockedSubmit = vi.mocked(submitMistakeReviewSession)

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

function makeAnswer(overrides: Partial<MistakeReviewAnswerResult> = {}): MistakeReviewAnswerResult {
  return {
    questionId: 1,
    correct: true,
    scorePercent: 100,
    feedback: 'Chính xác.',
    correctAnswer: 'Paris',
    explanation: 'Paris là thủ đô của Pháp.',
    ...overrides,
  }
}

function makeSession(overrides: Partial<MistakeReviewSessionResponse> = {}): MistakeReviewSessionResponse {
  return {
    sessionId: 42,
    questionCount: 1,
    questions: [makeQuestion()],
    scorePercent: null,
    answers: [],
    ...overrides,
  }
}

function sessionResponse(data: MistakeReviewSessionResponse): Awaited<ReturnType<typeof getMistakeReviewSession>> {
  return { data } as Awaited<ReturnType<typeof getMistakeReviewSession>>
}

function submitResponse(
  data: { sessionId: number; questionCount: number; scorePercent: number; answers: MistakeReviewAnswerResult[] },
): Awaited<ReturnType<typeof submitMistakeReviewSession>> {
  return { data } as Awaited<ReturnType<typeof submitMistakeReviewSession>>
}

function renderSession(path = '/student/mistake-review/sessions/42') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/student/mistake-review/sessions/:sessionId" element={<StudentMistakeReviewSessionPage />} />
        <Route path="/student/mistake-review" element={<div>Review list</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('StudentMistakeReviewSessionPage', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedSubmit.mockReset()
  })

  it('renders the first question with context and progress', async () => {
    mockedGet.mockResolvedValue(sessionResponse(makeSession()))

    renderSession()

    expect(await screen.findByText('What is the capital of France?')).toBeInTheDocument()
    expect(screen.getByText('English B1 · Lesson 1')).toBeInTheDocument()
    expect(screen.getByText('Câu 1/1')).toBeInTheDocument()
  })

  it('blocks submission when a question is unanswered', async () => {
    mockedGet.mockResolvedValue(sessionResponse(makeSession()))

    renderSession()

    fireEvent.click(await screen.findByRole('button', { name: 'Nộp bài' }))

    expect(await screen.findByText('Vui lòng trả lời tất cả câu hỏi trước khi nộp bài.')).toBeInTheDocument()
    expect(mockedSubmit).not.toHaveBeenCalled()
  })

  it('submits an option answer and renders the result', async () => {
    mockedGet.mockResolvedValue(sessionResponse(makeSession()))
    mockedSubmit.mockResolvedValue(
      submitResponse({ sessionId: 42, questionCount: 1, scorePercent: 100, answers: [makeAnswer()] }),
    )

    renderSession()

    fireEvent.click(await screen.findByLabelText('Paris'))
    fireEvent.click(screen.getByRole('button', { name: 'Nộp bài' }))

    await waitFor(() =>
      expect(mockedSubmit).toHaveBeenCalledWith(42, {
        answers: [{ questionId: 1, selectedOptionId: 11, answerText: null }],
      }),
    )
    expect(await screen.findByText('Đúng')).toBeInTheDocument()
    expect(screen.getByText('Paris')).toBeInTheDocument()
    expect(screen.getByText('Chính xác.')).toBeInTheDocument()
    expect(screen.getByText('Paris là thủ đô của Pháp.')).toBeInTheDocument()
  })

  it('submits a trimmed text answer', async () => {
    mockedGet.mockResolvedValue(
      sessionResponse(
        makeSession({
          questions: [makeQuestion({ questionType: 'FILL_BLANK', options: [] })],
        }),
      ),
    )
    mockedSubmit.mockResolvedValue(
      submitResponse({ sessionId: 42, questionCount: 1, scorePercent: 100, answers: [makeAnswer()] }),
    )

    renderSession()

    fireEvent.change(await screen.findByLabelText('Câu trả lời của bạn'), { target: { value: '  Paris  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Nộp bài' }))

    await waitFor(() =>
      expect(mockedSubmit).toHaveBeenCalledWith(42, {
        answers: [{ questionId: 1, answerText: 'Paris', selectedOptionId: null }],
      }),
    )
  })

  it('renders a submitted session from GET', async () => {
    mockedGet.mockResolvedValue(
      sessionResponse(
        makeSession({
          scorePercent: 100,
          answers: [makeAnswer()],
        }),
      ),
    )

    renderSession()

    expect(await screen.findByText('Đúng')).toBeInTheDocument()
    expect(screen.getByText('Chính xác.')).toBeInTheDocument()
  })

  it('shows a 404 message', async () => {
    mockedGet.mockRejectedValue({ response: { status: 404 } })

    renderSession()

    expect(await screen.findByText('Không tìm thấy phiên ôn tập.')).toBeInTheDocument()
  })

  it('retries the session fetch after a load error', async () => {
    mockedGet
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(sessionResponse(makeSession()))

    renderSession()

    expect(await screen.findByText('Không thể tải phiên ôn tập.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))

    expect(await screen.findByText('What is the capital of France?')).toBeInTheDocument()
    expect(mockedGet).toHaveBeenCalledTimes(2)
  })

  it('shows an error when a 409 refetch has no complete result', async () => {
    mockedGet.mockResolvedValue(sessionResponse(makeSession()))
    mockedSubmit.mockRejectedValue({ response: { status: 409 } })

    renderSession()

    fireEvent.click(await screen.findByLabelText('Paris'))
    fireEvent.click(screen.getByRole('button', { name: 'Nộp bài' }))

    expect(await screen.findByText('Phiên này đã được nộp nhưng không tải được kết quả.')).toBeInTheDocument()
    expect(mockedGet).toHaveBeenCalledTimes(2)
  })

  it('refetches and renders the result after a 409', async () => {
    mockedGet
      .mockResolvedValueOnce(sessionResponse(makeSession()))
      .mockResolvedValueOnce(sessionResponse(makeSession({ scorePercent: 100, answers: [makeAnswer()] })))
    mockedSubmit.mockRejectedValue({ response: { status: 409 } })

    renderSession()

    fireEvent.click(await screen.findByLabelText('Paris'))
    fireEvent.click(screen.getByRole('button', { name: 'Nộp bài' }))

    expect(await screen.findByText('Chính xác.')).toBeInTheDocument()
    expect(mockedGet).toHaveBeenCalledTimes(2)
  })

  it('rejects an invalid session id without calling the API', async () => {
    renderSession('/student/mistake-review/sessions/not-a-number')

    expect(await screen.findByText('Không tìm thấy phiên ôn tập.')).toBeInTheDocument()
    expect(mockedGet).not.toHaveBeenCalled()
  })
})
