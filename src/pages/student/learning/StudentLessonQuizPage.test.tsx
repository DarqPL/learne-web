import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StudentLessonQuizPage } from './StudentLessonQuizPage'
import { getStudentLessonQuiz } from '../../../lib/api/studentLearningApi'
import type { StudentQuiz } from '../../../lib/api/types'

vi.mock('../../../lib/api/studentLearningApi', () => ({
  getStudentLessonQuiz: vi.fn(),
  submitStudentLessonQuiz: vi.fn(),
}))

const mockedGetStudentLessonQuiz = vi.mocked(getStudentLessonQuiz)

function quizApiResponse(data: StudentQuiz): Awaited<ReturnType<typeof getStudentLessonQuiz>> {
  return { data } as Awaited<ReturnType<typeof getStudentLessonQuiz>>
}

function makeQuiz(): StudentQuiz {
  return {
    enrollmentId: 10,
    lessonId: 20,
    lessonTitle: 'Lesson 20 Quiz',
    lessonContent: null,
    audioUrl: null,
    audioPublicId: null,
    passPercent: 70,
    bestScorePercent: null,
    alreadyPassed: false,
    questions: [
      {
        id: 1,
        type: 'MULTIPLE_CHOICE',
        questionText: 'What is the capital of France?',
        knowledgePoint: null,
        difficulty: null,
        xpReward: 10,
        orderIndex: 1,
        targetText: null,
        options: [
          { id: 11, optionText: 'Paris', orderIndex: 1 },
          { id: 12, optionText: 'London', orderIndex: 2 },
        ],
      },
    ],
  }
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/student/enrollments/:enrollmentId/lessons/:lessonId/quiz" element={<StudentLessonQuizPage />} />
        <Route path="/student/enrollments/:enrollmentId/lessons/:lessonId" element={<div>Lesson route</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('StudentLessonQuizPage back navigation polish', () => {
  beforeEach(() => {
    mockedGetStudentLessonQuiz.mockReset()
  })

  it('shows back button with icon and without phase or technical markers', async () => {
    mockedGetStudentLessonQuiz.mockResolvedValue(quizApiResponse(makeQuiz()))

    renderAt('/student/enrollments/10/lessons/20/quiz')

    const backButton = await screen.findByRole('button', { name: /Quay lại bài học/i })
    expect(backButton).toBeInTheDocument()

    const icon = backButton.querySelector('svg')
    expect(icon).not.toBeNull()
    expect(icon).toHaveAttribute('aria-hidden', 'true')

    expect(document.body.textContent).not.toMatch(/phase/i)
    expect(document.body.textContent).not.toMatch(/#\d/)
  })
})
