import type { QuestionType, StudentQuizQuestion, SubmitQuizAnswerRequest } from '../../../lib/api/types'

export type QuizAnswerState = Record<number, { answerText: string; selectedOptionId: number | null }>

export function isPronunciationQuestion(question: StudentQuizQuestion) {
  return question.type === 'PRONUNCIATION'
}

export function isOptionQuestion(question: StudentQuizQuestion) {
  return question.type === 'MULTIPLE_CHOICE' || (question.type === 'TRUE_FALSE' && question.options.length > 0)
}

export function getQuestionTypePrompt(type: QuestionType) {
  switch (type) {
    case 'MULTIPLE_CHOICE':
      return 'Chọn một đáp án đúng.'
    case 'TRUE_FALSE':
      return 'Chọn Đúng hoặc Sai.'
    case 'FILL_BLANK':
      return 'Điền đáp án phù hợp vào chỗ trống.'
    case 'WORD_ORDER':
      return 'Sắp xếp các từ thành câu hoàn chỉnh.'
    case 'TRANSLATION':
      return 'Dịch câu theo yêu cầu.'
    case 'SHORT_ANSWER':
      return 'Viết câu trả lời ngắn.'
    case 'PRONUNCIATION':
      return 'Đọc và ghi nhớ mẫu phát âm. Phần ghi âm sẽ được bổ sung ở Phase AI.'
  }
}

export function getAnswerValue(answers: QuizAnswerState, questionId: number) {
  return answers[questionId] ?? { answerText: '', selectedOptionId: null }
}

export function isQuestionAnswered(question: StudentQuizQuestion, answers: QuizAnswerState) {
  if (isPronunciationQuestion(question)) return true
  const answer = getAnswerValue(answers, question.id)
  if (isOptionQuestion(question)) return answer.selectedOptionId !== null
  return answer.answerText.trim().length > 0
}

export function getUnansweredGradableQuestions(questions: StudentQuizQuestion[], answers: QuizAnswerState) {
  return questions.filter((question) => !isPronunciationQuestion(question) && !isQuestionAnswered(question, answers))
}

export function buildSubmitAnswers(questions: StudentQuizQuestion[], answers: QuizAnswerState): SubmitQuizAnswerRequest[] {
  return questions
    .filter((question) => !isPronunciationQuestion(question))
    .map((question) => {
      const answer = getAnswerValue(answers, question.id)
      return {
        questionId: question.id,
        answerText: isOptionQuestion(question) ? null : answer.answerText.trim(),
        selectedOptionId: isOptionQuestion(question) ? answer.selectedOptionId : null,
      }
    })
}

export function formatScorePercent(value: number) {
  if (!Number.isFinite(value)) return '0%'
  return `${Math.round(value)}%`
}

export function getResultTone(passed: boolean) {
  return passed
    ? { label: 'Đạt', className: 'bg-green-100 text-green-700', message: 'Bạn đã vượt qua bài học này.' }
    : { label: 'Chưa đạt', className: 'bg-amber-100 text-amber-700', message: 'Bạn cần đạt tối thiểu 70% để hoàn thành bài học.' }
}
