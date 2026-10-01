import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StudentQuizResultPage } from './StudentQuizResultPage'
import { getStudentQuizAttempt } from '../../../lib/api/studentLearningApi'
import type { StudentQuizAttemptResult } from '../../../lib/api/types'

vi.mock('../../../lib/api/studentLearningApi', () => ({
  getStudentQuizAttempt: vi.fn(),
}))

const mockedGetStudentQuizAttempt = vi.mocked(getStudentQuizAttempt)

function attemptApiResponse(data: StudentQuizAttemptResult): Awaited<ReturnType<typeof getStudentQuizAttempt>> {
  return { data } as Awaited<ReturnType<typeof getStudentQuizAttempt>>
}

function makeAttempt(): StudentQuizAttemptResult {
  return {
    attemptId: 99,
    enrollmentId: 10,
    lessonId: 20,
    scorePercent: 80,
    passed: true,
    earnedXp: 20,
    progress: {
      lessonStatus: 'COMPLETED',
      enrollmentProgressPercent: 50,
      unlockedNextLessonId: null,
    },
    stats: {
      totalXp: 120,
      currentStreakDays: 3,
      longestStreakDays: 5,
      lastActivityDate: null,
    },
    answers: [
      {
        questionId: 1,
        type: 'MULTIPLE_CHOICE',
        questionText: 'What is the capital of France?',
        answerText: null,
        selectedOptionId: 5,
        selectedOptionText: null,
        correct: false,
        scorePercent: 0,
        earnedXp: 0,
        gradingMethod: 'AUTO',
        feedback: 'Review feedback',
        correctAnswer: null,
        correctOptionId: null,
        correctOptionText: 'Paris',
        explanation: 'Paris is the capital.',
      },
    ],
  }
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/student/quiz-attempts/:attemptId" element={<StudentQuizResultPage />} />
        <Route path="/student/enrollments/:enrollmentId/lessons/:lessonId" element={<div>Lesson route</div>} />
        <Route path="/student/enrollments/:enrollmentId" element={<div>Progress route</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('StudentQuizResultPage cleanup', () => {
  beforeEach(() => {
    mockedGetStudentQuizAttempt.mockReset()
  })

  it('hides technical ids and shows continue CTAs', async () => {
    mockedGetStudentQuizAttempt.mockResolvedValue(attemptApiResponse(makeAttempt()))

    renderAt('/student/quiz-attempts/99')

    expect(await screen.findByText('Lựa chọn đã chọn')).toBeInTheDocument()
    expect(screen.queryByText('Lượt làm #99')).not.toBeInTheDocument()
    expect(screen.queryByText('Bài học #20')).not.toBeInTheDocument()
    expect(screen.queryByText('Lựa chọn #5')).not.toBeInTheDocument()

    expect(screen.getByRole('button', { name: /Quay lại bài học/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Quay lại lộ trình học/i })).toBeInTheDocument()
  })

  it('navigates back to the learning progress from the result page', async () => {
    mockedGetStudentQuizAttempt.mockResolvedValue(attemptApiResponse(makeAttempt()))

    renderAt('/student/quiz-attempts/99')

    fireEvent.click(await screen.findByRole('button', { name: /Quay lại lộ trình học/i }))

    expect(await screen.findByText('Progress route')).toBeInTheDocument()
  })
})
