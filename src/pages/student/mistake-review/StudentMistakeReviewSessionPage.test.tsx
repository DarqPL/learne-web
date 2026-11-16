import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
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

function NavigationButton({ to, label }: { to: string; label: string }) {
  const navigate = useNavigate()
  return (
    <button type="button" onClick={() => navigate(to)}>
      {label}
    </button>
  )
}

function renderSessionWithNavigation(initialId: number, nextId: number) {
  return render(
    <MemoryRouter initialEntries={[`/student/mistake-review/sessions/${initialId}`]}>
      <NavigationButton
        to={`/student/mistake-review/sessions/${nextId}`}
        label={`Đi tới phiên ${nextId}`}
      />
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

  it('shows an error for a session without questions', async () => {
    mockedGet.mockResolvedValue(
      sessionResponse(makeSession({ questionCount: 0, questions: [], answers: [] })),
    )

    renderSession()

    expect(await screen.findByText('Phiên ôn tập không có câu hỏi.')).toBeInTheDocument()
  })

  it('shows an error for an inconsistent session response', async () => {
    mockedGet.mockResolvedValue(
      sessionResponse(makeSession({ scorePercent: 100, answers: [] })),
    )

    renderSession()

    expect(await screen.findByText('Dữ liệu phiên ôn tập không nhất quán.')).toBeInTheDocument()
  })

  it('falls back to a generic message when submission fails for a non-409 reason', async () => {
    mockedGet.mockResolvedValue(sessionResponse(makeSession()))
    mockedSubmit.mockRejectedValue(new Error('network'))

    renderSession()

    fireEvent.click(await screen.findByLabelText('Paris'))
    fireEvent.click(screen.getByRole('button', { name: 'Nộp bài' }))

    expect(await screen.findByText('Không thể nộp bài ôn tập.')).toBeInTheDocument()
  })

  it('shows an error for an incomplete submit response', async () => {
    mockedGet.mockResolvedValue(sessionResponse(makeSession()))
    mockedSubmit.mockResolvedValue(
      submitResponse({ sessionId: 42, questionCount: 2, scorePercent: 50, answers: [makeAnswer()] }),
    )

    renderSession()

    fireEvent.click(await screen.findByLabelText('Paris'))
    fireEvent.click(screen.getByRole('button', { name: 'Nộp bài' }))

    expect(await screen.findByText('Dữ liệu kết quả ôn tập không nhất quán.')).toBeInTheDocument()
  })

  it('jumps back to the first unanswered question when submitting a multi-question session', async () => {
    const firstQuestion = makeQuestion()
    const secondQuestion = makeQuestion({
      questionId: 2,
      questionText: 'What is the capital of Spain?',
      options: [
        { id: 21, text: 'Paris', order: 1 },
        { id: 22, text: 'Madrid', order: 2 },
      ],
    })
    mockedGet.mockResolvedValue(
      sessionResponse(
        makeSession({
          questionCount: 2,
          questions: [firstQuestion, secondQuestion],
          scorePercent: null,
          answers: [],
        }),
      ),
    )

    renderSession()

    expect(await screen.findByText(firstQuestion.questionText)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp' }))
    expect(await screen.findByText(secondQuestion.questionText)).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Paris'))
    fireEvent.click(screen.getByRole('button', { name: 'Nộp bài' }))

    expect(
      await screen.findByText('Vui lòng trả lời tất cả câu hỏi trước khi nộp bài.'),
    ).toBeInTheDocument()
    expect(screen.getByText(firstQuestion.questionText)).toBeInTheDocument()
  })

  it('ignores a stale submit failure after the route session id changes', async () => {
    mockedGet.mockImplementation(async (sessionId) =>
      sessionId === 43
        ? sessionResponse(
            makeSession({
              sessionId: 43,
              questions: [
                makeQuestion({
                  questionId: 2,
                  questionText: 'What is the capital of Spain?',
                  options: [
                    { id: 21, text: 'Paris', order: 1 },
                    { id: 22, text: 'Madrid', order: 2 },
                  ],
                }),
              ],
            }),
          )
        : sessionResponse(makeSession()),
    )

    let rejectSubmit: ((reason?: unknown) => void) | null = null
    mockedSubmit.mockImplementation(
      () =>
        new Promise<Awaited<ReturnType<typeof submitMistakeReviewSession>>>((_resolve, reject) => {
          rejectSubmit = reject
        }),
    )

    renderSessionWithNavigation(42, 43)

    fireEvent.click(await screen.findByLabelText('Paris'))
    fireEvent.click(screen.getByRole('button', { name: 'Nộp bài' }))
    await waitFor(() => expect(mockedSubmit).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByRole('button', { name: 'Đi tới phiên 43' }))

    expect(await screen.findByText('What is the capital of Spain?')).toBeInTheDocument()

    await act(async () => {
      rejectSubmit?.(new Error('network'))
      await Promise.resolve()
    })

    expect(screen.queryByText('Không thể nộp bài ôn tập.')).not.toBeInTheDocument()
    expect(screen.getByText('What is the capital of Spain?')).toBeInTheDocument()
  })

  it('renders the result score as an h1 and the detail heading as an h2', async () => {
    mockedGet.mockResolvedValue(sessionResponse(makeSession()))
    mockedSubmit.mockResolvedValue(
      submitResponse({ sessionId: 42, questionCount: 1, scorePercent: 100, answers: [makeAnswer()] }),
    )

    renderSession()

    fireEvent.click(await screen.findByLabelText('Paris'))
    fireEvent.click(screen.getByRole('button', { name: 'Nộp bài' }))

    expect(await screen.findByRole('heading', { level: 1, name: '100%' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Chi tiết từng câu' })).toBeInTheDocument()
  })
})
