import type {
  MistakeReviewAnswerResult,
  MistakeReviewQuestion,
  MistakeReviewSubmitAnswerRequest,
  QuestionType,
} from '../../../lib/api/types'

export type MistakeReviewAnswerState = Record<
  number,
  { answerText: string; selectedOptionId: number | null }
>

export function isOptionQuestion(question: MistakeReviewQuestion) {
  return (
    question.questionType === 'MULTIPLE_CHOICE' ||
    (question.questionType === 'TRUE_FALSE' && question.options.length > 0)
  )
}

export function hasInvalidQuestionData(question: MistakeReviewQuestion) {
  return question.questionType === 'MULTIPLE_CHOICE' && question.options.length === 0
}

export function getAnswerValue(answers: MistakeReviewAnswerState, questionId: number) {
  return answers[questionId] ?? { answerText: '', selectedOptionId: null }
}

export function isQuestionAnswered(question: MistakeReviewQuestion, answers: MistakeReviewAnswerState) {
  const answer = getAnswerValue(answers, question.questionId)
  if (isOptionQuestion(question)) return answer.selectedOptionId !== null
  return answer.answerText.trim().length > 0
}

export function getUnansweredQuestions(
  questions: MistakeReviewQuestion[],
  answers: MistakeReviewAnswerState,
) {
  return questions.filter((question) => !isQuestionAnswered(question, answers))
}

export function buildSubmitAnswers(
  questions: MistakeReviewQuestion[],
  answers: MistakeReviewAnswerState,
): MistakeReviewSubmitAnswerRequest[] {
  return questions.map((question) => {
    const answer = getAnswerValue(answers, question.questionId)
    return isOptionQuestion(question)
      ? { questionId: question.questionId, selectedOptionId: answer.selectedOptionId, answerText: null }
      : { questionId: question.questionId, answerText: answer.answerText.trim(), selectedOptionId: null }
  })
}

export function hasCompleteResult(
  questions: MistakeReviewQuestion[],
  answers: MistakeReviewAnswerResult[],
  questionCount: number,
) {
  if (questionCount <= 0) return false
  if (questions.length !== questionCount) return false
  if (answers.length !== questionCount) return false
  const questionIds = new Set(questions.map((question) => question.questionId))
  if (questionIds.size !== questionCount) return false
  const answeredIds = new Set(answers.map((answer) => answer.questionId))
  if (answeredIds.size !== questionCount) return false
  return answers.every((answer) => questionIds.has(answer.questionId))
}

export function formatScorePercent(value: number) {
  if (!Number.isFinite(value)) return '0%'
  return `${Math.round(value)}%`
}

export function getQuestionTypePrompt(type: QuestionType, optionsCount: number) {
  switch (type) {
    case 'MULTIPLE_CHOICE':
      return 'Chọn một đáp án đúng.'
    case 'TRUE_FALSE':
      return optionsCount > 0 ? 'Chọn Đúng hoặc Sai.' : 'Nhập câu trả lời.'
    case 'FILL_BLANK':
      return 'Điền đáp án phù hợp vào chỗ trống.'
    case 'WORD_ORDER':
      return 'Sắp xếp các từ thành câu hoàn chỉnh.'
    case 'TRANSLATION':
      return 'Dịch câu theo yêu cầu.'
    case 'SHORT_ANSWER':
      return 'Viết câu trả lời ngắn.'
    default:
      return 'Nhập câu trả lời.'
  }
}
