import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from './client'
import {
  createMistakeReviewSession,
  getMistakeReviewSession,
  listMistakeReviewQuestions,
  submitMistakeReviewSession,
} from './mistakeReviewApi'

vi.mock('./client', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockedGet = vi.mocked(http.get)
const mockedPost = vi.mocked(http.post)

describe('mistakeReviewApi', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedPost.mockReset()
  })

  it('lists review questions with cursor params', () => {
    void listMistakeReviewQuestions({ size: 20, cursor: 'next-page' })

    expect(mockedGet).toHaveBeenCalledWith('/api/student/mistake-review/questions', {
      params: { size: 20, cursor: 'next-page' },
    })
  })

  it('creates a review session', () => {
    void createMistakeReviewSession()

    expect(mockedPost).toHaveBeenCalledWith('/api/student/mistake-review/sessions')
  })

  it('gets a review session by id', () => {
    void getMistakeReviewSession(42)

    expect(mockedGet).toHaveBeenCalledWith('/api/student/mistake-review/sessions/42')
  })

  it('submits a review session with answers', () => {
    const request = {
      answers: [{ questionId: 1, selectedOptionId: 11, answerText: null }],
    }

    void submitMistakeReviewSession(42, request)

    expect(mockedPost).toHaveBeenCalledWith('/api/student/mistake-review/sessions/42/submit', request)
  })
})
