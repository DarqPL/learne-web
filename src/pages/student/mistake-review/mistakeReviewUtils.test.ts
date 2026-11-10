import { describe, expect, it } from 'vitest'
import type { MistakeReviewQuestion } from '../../../lib/api/types'
import {
  buildSubmitAnswers,
  formatScorePercent,
  getQuestionTypePrompt,
  getUnansweredQuestions,
  hasCompleteResult,
  hasInvalidQuestionData,
  isOptionQuestion,
  isQuestionAnswered,
} from './mistakeReviewUtils'

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

describe('mistakeReviewUtils', () => {
  it('classifies option questions exactly like the backend', () => {
    expect(isOptionQuestion(makeQuestion())).toBe(true)
    expect(isOptionQuestion(makeQuestion({ questionType: 'TRUE_FALSE' }))).toBe(true)
    expect(isOptionQuestion(makeQuestion({ questionType: 'TRUE_FALSE', options: [] }))).toBe(false)
    expect(isOptionQuestion(makeQuestion({ questionType: 'FILL_BLANK', options: [] }))).toBe(false)
  })

  it('detects invalid multiple-choice questions without options', () => {
    expect(hasInvalidQuestionData(makeQuestion({ options: [] }))).toBe(true)
    expect(hasInvalidQuestionData(makeQuestion({ questionType: 'FILL_BLANK', options: [] }))).toBe(false)
  })

  it('validates answers by question type', () => {
    const optionQuestion = makeQuestion()
    const textQuestion = makeQuestion({ questionId: 2, questionType: 'FILL_BLANK', options: [] })

    expect(isQuestionAnswered(optionQuestion, { 1: { answerText: '', selectedOptionId: null } })).toBe(false)
    expect(isQuestionAnswered(optionQuestion, { 1: { answerText: '', selectedOptionId: 11 } })).toBe(true)
    expect(isQuestionAnswered(textQuestion, { 2: { answerText: '   ', selectedOptionId: null } })).toBe(false)
    expect(isQuestionAnswered(textQuestion, { 2: { answerText: ' Paris ', selectedOptionId: null } })).toBe(true)
  })

  it('returns unanswered questions in order', () => {
    const questions = [
      makeQuestion(),
      makeQuestion({ questionId: 2, questionType: 'FILL_BLANK', options: [] }),
    ]

    expect(getUnansweredQuestions(questions, { 1: { answerText: '', selectedOptionId: 11 } })).toEqual([questions[1]])
  })

  it('builds exact submit payloads for option and text questions', () => {
    const questions = [
      makeQuestion(),
      makeQuestion({ questionId: 2, questionType: 'FILL_BLANK', options: [] }),
    ]

    expect(
      buildSubmitAnswers(questions, {
        1: { answerText: 'ignored', selectedOptionId: 11 },
        2: { answerText: '  Paris  ', selectedOptionId: null },
      }),
    ).toEqual([
      { questionId: 1, selectedOptionId: 11, answerText: null },
      { questionId: 2, answerText: 'Paris', selectedOptionId: null },
    ])
  })

  it('checks complete result membership', () => {
    const questions = [makeQuestion(), makeQuestion({ questionId: 2 })]

    expect(
      hasCompleteResult(questions, [
        { questionId: 1, correct: true, scorePercent: 100, feedback: null, correctAnswer: 'Paris', explanation: null },
        { questionId: 2, correct: false, scorePercent: 0, feedback: null, correctAnswer: 'London', explanation: null },
      ], 2),
    ).toBe(true)

    expect(
      hasCompleteResult(questions, [
        { questionId: 1, correct: true, scorePercent: 100, feedback: null, correctAnswer: 'Paris', explanation: null },
      ], 2),
    ).toBe(false)

    expect(
      hasCompleteResult(questions, [
        { questionId: 1, correct: true, scorePercent: 100, feedback: null, correctAnswer: 'Paris', explanation: null },
        { questionId: 1, correct: true, scorePercent: 100, feedback: null, correctAnswer: 'Paris', explanation: null },
      ], 2),
    ).toBe(false)
  })

  it('formats scores and prompts', () => {
    expect(formatScorePercent(66.6)).toBe('67%')
    expect(formatScorePercent(Number.NaN)).toBe('0%')
    expect(getQuestionTypePrompt('MULTIPLE_CHOICE', 2)).toBe('Chọn một đáp án đúng.')
    expect(getQuestionTypePrompt('TRUE_FALSE', 2)).toBe('Chọn Đúng hoặc Sai.')
    expect(getQuestionTypePrompt('TRUE_FALSE', 0)).toBe('Nhập câu trả lời.')
    expect(getQuestionTypePrompt('FILL_BLANK', 0)).toBe('Điền đáp án phù hợp vào chỗ trống.')
  })
})
