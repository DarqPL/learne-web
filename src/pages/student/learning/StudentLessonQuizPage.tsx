import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../lib/api/client'
import { getStudentLessonQuiz, submitStudentLessonQuiz } from '../../../lib/api/studentLearningApi'
import type { StudentQuiz, StudentQuizQuestion } from '../../../lib/api/types'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { LessonAudioPlayer } from './LessonAudioPlayer'
import { studentQuestionTypeLabels } from './studentLearningLabels'
import {
  buildSubmitAnswers,
  formatScorePercent,
  getAnswerValue,
  getQuestionTypePrompt,
  getUnansweredGradableQuestions,
  isOptionQuestion,
  isPronunciationQuestion,
  type QuizAnswerState,
} from './studentQuizUtils'

function parsePositiveInteger(value: string | undefined) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function getQuestionProgressPercent(currentQuestionIndex: number, questionCount: number) {
  if (questionCount <= 0) return 0
  return Math.round(((currentQuestionIndex + 1) / questionCount) * 100)
}

function getInitialAnswers(questions: StudentQuizQuestion[]): QuizAnswerState {
  return questions.reduce<QuizAnswerState>((nextAnswers, question) => {
    nextAnswers[question.id] = { answerText: '', selectedOptionId: null }
    return nextAnswers
  }, {})
}

export function StudentLessonQuizPage() {
  const navigate = useNavigate()
  const { enrollmentId: enrollmentIdParam, lessonId: lessonIdParam } = useParams()
  const enrollmentId = parsePositiveInteger(enrollmentIdParam)
  const lessonId = parsePositiveInteger(lessonIdParam)
  const mountedRef = useRef(false)
  const currentParamsRef = useRef({ enrollmentId, lessonId })
  const [quiz, setQuiz] = useState<StudentQuiz | null>(null)
  const [answers, setAnswers] = useState<QuizAnswerState>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useLayoutEffect(() => {
    currentParamsRef.current = { enrollmentId, lessonId }
  }, [enrollmentId, lessonId])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    if (enrollmentId === null || lessonId === null) {
      return () => {
        cancelled = true
      }
    }

    void (async () => {
      setQuiz(null)
      setAnswers({})
      setCurrentQuestionIndex(0)
      setError(null)
      setSubmitting(false)
      try {
        const response = await getStudentLessonQuiz(enrollmentId, lessonId)
        if (cancelled) return
        setQuiz(response.data)
        setAnswers(getInitialAnswers(response.data.questions))
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải bài kiểm tra.'))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enrollmentId, lessonId])

  function updateTextAnswer(questionId: number, answerText: string) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: { ...getAnswerValue(currentAnswers, questionId), answerText },
    }))
  }

  function updateSelectedOption(questionId: number, selectedOptionId: number) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: { ...getAnswerValue(currentAnswers, questionId), selectedOptionId },
    }))
  }

  async function handleSubmit() {
    if (quiz === null || enrollmentId === null || lessonId === null || submitting) return

    const gradableQuestionCount = quiz.questions.filter((question) => !isPronunciationQuestion(question)).length
    if (gradableQuestionCount === 0) {
      setError('Quiz này chưa có câu hỏi tính điểm.')
      return
    }

    const unansweredQuestions = getUnansweredGradableQuestions(quiz.questions, answers)
    if (unansweredQuestions.length > 0) {
      const firstUnansweredIndex = quiz.questions.findIndex((question) => question.id === unansweredQuestions[0].id)
      if (firstUnansweredIndex >= 0) setCurrentQuestionIndex(firstUnansweredIndex)
      setError('Vui lòng trả lời tất cả câu hỏi trước khi nộp bài.')
      return
    }

    const currentEnrollmentId = enrollmentId
    const currentLessonId = lessonId
    setSubmitting(true)
    setError(null)
    try {
      const response = await submitStudentLessonQuiz(currentEnrollmentId, currentLessonId, {
        answers: buildSubmitAnswers(quiz.questions, answers),
      })
      if (!mountedRef.current) return
      const currentParams = currentParamsRef.current
      if (currentParams.enrollmentId !== currentEnrollmentId || currentParams.lessonId !== currentLessonId) return
      navigate(`/student/quiz-attempts/${response.data.attemptId}`)
    } catch (err) {
      if (!mountedRef.current) return
      const currentParams = currentParamsRef.current
      if (currentParams.enrollmentId !== currentEnrollmentId || currentParams.lessonId !== currentLessonId) return
      setError(getApiErrorMessage(err, 'Không thể nộp bài kiểm tra.'))
    } finally {
      if (mountedRef.current) {
        const currentParams = currentParamsRef.current
        if (currentParams.enrollmentId === currentEnrollmentId && currentParams.lessonId === currentLessonId) setSubmitting(false)
      }
    }
  }

  if (enrollmentId === null || lessonId === null) {
    return (
      <div role="alert">
        <Alert>Không tìm thấy bài kiểm tra.</Alert>
      </div>
    )
  }

  if (error && !quiz) {
    return (
      <div role="alert">
        <Alert>{error}</Alert>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  const questionCount = quiz.questions.length
  const currentQuestion = quiz.questions[currentQuestionIndex] ?? null
  const currentQuestionLabelId = currentQuestion ? `student-quiz-question-${currentQuestion.id}` : undefined
  const gradableQuestionCount = quiz.questions.filter((question) => !isPronunciationQuestion(question)).length
  const progressPercent = getQuestionProgressPercent(currentQuestionIndex, questionCount)
  const isFirstQuestion = currentQuestionIndex === 0
  const isLastQuestion = currentQuestionIndex >= questionCount - 1

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Bài kiểm tra</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">{quiz.lessonTitle}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">Điểm đạt {formatScorePercent(quiz.passPercent)}</span>
              {quiz.bestScorePercent !== null ? (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">Tốt nhất {formatScorePercent(quiz.bestScorePercent)}</span>
              ) : null}
              {quiz.alreadyPassed ? <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">Đã vượt qua</span> : null}
            </div>
          </div>

          <Button variant="secondary" onClick={() => navigate(`/student/enrollments/${quiz.enrollmentId}/lessons/${quiz.lessonId}`)}>
            Quay lại bài học
          </Button>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-gray-700">Tiến độ câu hỏi</span>
            <span className="font-semibold text-gray-900">
              {questionCount === 0 ? 0 : currentQuestionIndex + 1}/{questionCount}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-gray-100"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            aria-label="Tiến độ làm bài kiểm tra"
          >
            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </section>

      {error ? (
        <div role="alert">
          <Alert>{error}</Alert>
        </div>
      ) : null}
      {gradableQuestionCount === 0 ? (
        <div role="alert">
          <Alert variant="info">Quiz này chưa có câu hỏi tính điểm.</Alert>
        </div>
      ) : null}

      <LessonAudioPlayer audioUrl={quiz.audioUrl} title="Audio cho bài kiểm tra nghe" />

      {questionCount === 0 || currentQuestion === null ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600">Bài học này chưa có câu hỏi.</p>
        </section>
      ) : (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">{studentQuestionTypeLabels[currentQuestion.type]}</span>
                {currentQuestion.difficulty ? <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">{currentQuestion.difficulty}</span> : null}
              </div>
              <p className="mt-4 text-sm font-semibold text-indigo-600">{getQuestionTypePrompt(currentQuestion.type)}</p>
              <h2 id={currentQuestionLabelId} className="mt-2 whitespace-pre-wrap text-xl font-bold text-gray-900">
                {currentQuestion.questionText}
              </h2>
            </div>
          </div>

          <div className="mt-6">
            {isPronunciationQuestion(currentQuestion) ? (
              <div className="rounded-2xl bg-gray-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nội dung luyện đọc</p>
                <p className="mt-2 whitespace-pre-wrap text-lg font-semibold text-gray-900">{currentQuestion.targetText?.trim() ? currentQuestion.targetText : currentQuestion.questionText}</p>
                <p className="mt-4 text-sm leading-6 text-gray-600">Phase 7 chưa hỗ trợ ghi âm và chấm điểm phát âm. Câu hỏi này không tính vào phần nộp bài.</p>
              </div>
            ) : isOptionQuestion(currentQuestion) ? (
              <div className="space-y-3" role="radiogroup" aria-labelledby={currentQuestionLabelId}>
                {currentQuestion.options.map((option) => {
                  const selected = getAnswerValue(answers, currentQuestion.id).selectedOptionId === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      className={`w-full rounded-xl border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                        selected ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-gray-50'
                      }`}
                      aria-checked={selected}
                      onClick={() => updateSelectedOption(currentQuestion.id, option.id)}
                    >
                      <span className="text-sm font-semibold text-gray-900">{option.optionText}</span>
                    </button>
                  )
                })}
              </div>
            ) : currentQuestion.type === 'TRANSLATION' || currentQuestion.type === 'SHORT_ANSWER' ? (
              <textarea
                className="min-h-36 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                aria-labelledby={currentQuestionLabelId}
                value={getAnswerValue(answers, currentQuestion.id).answerText}
                onChange={(event) => updateTextAnswer(currentQuestion.id, event.target.value)}
                placeholder="Nhập câu trả lời của bạn"
              />
            ) : (
              <input
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                aria-labelledby={currentQuestionLabelId}
                value={getAnswerValue(answers, currentQuestion.id).answerText}
                onChange={(event) => updateTextAnswer(currentQuestion.id, event.target.value)}
                placeholder="Nhập đáp án của bạn"
              />
            )}
          </div>
        </section>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button variant="secondary" disabled={isFirstQuestion || submitting} onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))}>
          Quay lại
        </Button>
        {isLastQuestion ? (
          <Button loading={submitting} disabled={gradableQuestionCount === 0} onClick={() => void handleSubmit()}>
            Nộp bài
          </Button>
        ) : (
          <Button disabled={submitting} onClick={() => setCurrentQuestionIndex((index) => Math.min(questionCount - 1, index + 1))}>
            Tiếp tục
          </Button>
        )}
      </div>
    </div>
  )
}
