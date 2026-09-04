import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../../lib/api/client'
import {
  getPlacementAttempt,
  getPlacementStatus,
  startPlacement,
  submitPlacementAttempt,
} from '../../../lib/api/studentLearningApi'
import type { PlacementAttempt, PlacementQuestion, SubmitPlacementAnswer } from '../../../lib/api/types'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'

type PlacementAnswerState = Record<number, { answerText: string; selectedOptionId: number | null; selectedOptionIds: number[] }>

function getInitialAnswers(questions: PlacementQuestion[]): PlacementAnswerState {
  return questions.reduce<PlacementAnswerState>((nextAnswers, question) => {
    nextAnswers[question.id] = { answerText: '', selectedOptionId: null, selectedOptionIds: [] }
    return nextAnswers
  }, {})
}

function getAnswerValue(answers: PlacementAnswerState, questionId: number) {
  return answers[questionId] ?? { answerText: '', selectedOptionId: null, selectedOptionIds: [] }
}

function isMultipleSelectQuestion(question: PlacementQuestion) {
  return question.type === 'MULTIPLE_SELECT' || question.type === 'MULTIPLE_RESPONSE' || question.type === 'CHECKBOX'
}

function isOptionQuestion(question: PlacementQuestion) {
  return question.options.length > 0 && (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE' || isMultipleSelectQuestion(question))
}

function getQuestionTypeLabel(type: string) {
  switch (type) {
    case 'MULTIPLE_CHOICE':
      return 'Trắc nghiệm'
    case 'TRUE_FALSE':
      return 'Đúng / Sai'
    case 'MULTIPLE_SELECT':
    case 'MULTIPLE_RESPONSE':
    case 'CHECKBOX':
      return 'Chọn nhiều đáp án'
    case 'SHORT_ANSWER':
      return 'Trả lời ngắn'
    case 'TRANSLATION':
      return 'Dịch câu'
    case 'FILL_BLANK':
      return 'Điền đáp án'
    default:
      return type
  }
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, seconds)
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = safeSeconds % 60
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

function buildSubmitAnswers(questions: PlacementQuestion[], answers: PlacementAnswerState): SubmitPlacementAnswer[] {
  return questions
    .filter((question) => isQuestionAnswered(question, answers))
    .map((question) => {
      const answer = getAnswerValue(answers, question.id)
      if (isMultipleSelectQuestion(question)) {
        return { questionId: question.id, selectedOptionIds: answer.selectedOptionIds }
      }
      if (isOptionQuestion(question)) {
        return { questionId: question.id, selectedOptionId: answer.selectedOptionId ?? undefined }
      }
      return { questionId: question.id, answerText: answer.answerText.trim() }
    })
}

function isQuestionAnswered(question: PlacementQuestion, answers: PlacementAnswerState) {
  const answer = getAnswerValue(answers, question.id)
  if (isMultipleSelectQuestion(question)) return answer.selectedOptionIds.length > 0
  if (isOptionQuestion(question)) return answer.selectedOptionId !== null
  return answer.answerText.trim().length > 0
}

export function StudentPlacementTestPage() {
  const navigate = useNavigate()
  const mountedRef = useRef(false)
  const loadRunRef = useRef(0)
  const startAttemptRef = useRef<ReturnType<typeof startPlacement> | null>(null)
  const [attempt, setAttempt] = useState<PlacementAttempt | null>(null)
  const [answers, setAnswers] = useState<PlacementAnswerState>({})
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadRun = loadRunRef.current + 1
    loadRunRef.current = loadRun

    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const statusResponse = await getPlacementStatus()
        if (cancelled || loadRunRef.current !== loadRun) return

        let attemptResponse: Awaited<ReturnType<typeof startPlacement>>
        if (statusResponse.data.activeAttemptId) {
          attemptResponse = await getPlacementAttempt(statusResponse.data.activeAttemptId)
        } else {
          if (!startAttemptRef.current) {
            startAttemptRef.current = startPlacement().catch((err) => {
              startAttemptRef.current = null
              throw err
            })
          }
          attemptResponse = await startAttemptRef.current
        }
        if (cancelled || loadRunRef.current !== loadRun) return
        const sortedQuestions = [...attemptResponse.data.questions].sort((left, right) => left.sequenceOrder - right.sequenceOrder)
        const nextAttempt = { ...attemptResponse.data, questions: sortedQuestions }
        setAttempt(nextAttempt)
        setAnswers(getInitialAnswers(sortedQuestions))
        setRemainingSeconds(Math.max(0, nextAttempt.remainingSeconds))
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải bài kiểm tra đầu vào.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!attempt || submitting || remainingSeconds <= 0) return

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((currentSeconds) => {
        if (currentSeconds <= 1) {
          window.clearInterval(intervalId)
          return 0
        }
        return currentSeconds - 1
      })
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [attempt, remainingSeconds, submitting])

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

  function toggleSelectedOption(questionId: number, selectedOptionId: number) {
    setAnswers((currentAnswers) => {
      const currentAnswer = getAnswerValue(currentAnswers, questionId)
      const selectedOptionIds = currentAnswer.selectedOptionIds.includes(selectedOptionId)
        ? currentAnswer.selectedOptionIds.filter((optionId) => optionId !== selectedOptionId)
        : [...currentAnswer.selectedOptionIds, selectedOptionId]
      return {
        ...currentAnswers,
        [questionId]: { ...currentAnswer, selectedOptionIds },
      }
    })
  }

  async function handleSubmit() {
    if (!attempt || submitting) return

    const timerExpired = remainingSeconds <= 0
    const unansweredQuestion = attempt.questions.find((question) => !isQuestionAnswered(question, answers))
    if (!timerExpired && unansweredQuestion) {
      setError('Vui lòng trả lời tất cả câu hỏi trước khi nộp bài.')
      document.getElementById(`placement-question-${unansweredQuestion.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await submitPlacementAttempt(attempt.id, { answers: buildSubmitAnswers(attempt.questions, answers) })
      if (mountedRef.current) navigate('/student/course-recommendations')
    } catch (err) {
      if (mountedRef.current) setError(getApiErrorMessage(err, 'Không thể nộp bài kiểm tra đầu vào.'))
    } finally {
      if (mountedRef.current) setSubmitting(false)
    }
  }

  if (error && !attempt) {
    return (
      <div role="alert">
        <Alert>{error}</Alert>
      </div>
    )
  }

  if (loading || !attempt) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  const questionCount = attempt.questions.length
  const answeredCount = attempt.questions.filter((question) => isQuestionAnswered(question, answers)).length
  const progressPercent = questionCount === 0 ? 0 : Math.round((answeredCount / questionCount) * 100)
  const timerExpired = remainingSeconds <= 0

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Placement test</p>
              <h1 className="mt-2 text-2xl font-bold text-gray-900">Bài kiểm tra đầu vào</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
                Hoàn thành 20 câu hỏi để AI phân tích năng lực hiện tại và đề xuất khóa học phù hợp nhất.
              </p>
            </div>
            <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Thời gian còn lại</p>
              <p className={`mt-1 text-2xl font-bold ${timerExpired ? 'text-red-700' : 'text-violet-800'}`}>{formatDuration(remainingSeconds)}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-gray-700">Tiến độ trả lời</span>
              <span className="font-semibold text-gray-900">
                {answeredCount}/{questionCount}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
              <div className="h-full rounded-full bg-indigo-600" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div role="alert">
          <Alert>{error}</Alert>
        </div>
      ) : null}
      {timerExpired ? (
        <div role="alert">
          <Alert>Thời gian làm bài đã hết. Vui lòng nộp các câu trả lời hiện tại.</Alert>
        </div>
      ) : null}

      {questionCount === 0 ? (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-600">Bài kiểm tra hiện chưa có câu hỏi.</p>
          <Link className="mt-4 inline-flex items-center justify-center rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800" to="/student">
            Quay lại dashboard
          </Link>
        </section>
      ) : (
        <div className="space-y-4">
          {attempt.questions.map((question, index) => {
            const labelId = `placement-question-${question.id}`
            const answer = getAnswerValue(answers, question.id)
            const multipleSelect = isMultipleSelectQuestion(question)
            const optionQuestion = isOptionQuestion(question)

            return (
              <section key={question.id} id={labelId} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">Câu {index + 1}</span>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">{getQuestionTypeLabel(question.type)}</span>
                      <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-700">{question.skill}</span>
                    </div>
                    {question.knowledgePoint ? <p className="mt-3 text-xs font-medium text-gray-500">{question.knowledgePoint}</p> : null}
                    <h2 className="mt-2 whitespace-pre-wrap text-lg font-bold text-gray-900">{question.questionText}</h2>
                  </div>
                </div>

                <div className="mt-5">
                  {optionQuestion ? (
                    <div className="space-y-3" role={multipleSelect ? 'group' : 'radiogroup'} aria-labelledby={labelId}>
                      {question.options.map((option) => {
                        const selected = multipleSelect ? answer.selectedOptionIds.includes(option.id) : answer.selectedOptionId === option.id
                        return (
                          <button
                            key={option.id}
                            type="button"
                            role={multipleSelect ? 'checkbox' : 'radio'}
                            className={`w-full rounded-xl border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                              selected ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-gray-50'
                            }`}
                            aria-checked={selected}
                            onClick={() => (multipleSelect ? toggleSelectedOption(question.id, option.id) : updateSelectedOption(question.id, option.id))}
                          >
                            <span className="text-sm font-semibold text-gray-900">{option.optionText}</span>
                          </button>
                        )
                      })}
                    </div>
                  ) : question.type === 'TRANSLATION' || question.type === 'SHORT_ANSWER' ? (
                    <textarea
                      className="min-h-32 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      aria-labelledby={labelId}
                      value={answer.answerText}
                      onChange={(event) => updateTextAnswer(question.id, event.target.value)}
                      placeholder="Nhập câu trả lời của bạn"
                    />
                  ) : (
                    <input
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      aria-labelledby={labelId}
                      value={answer.answerText}
                      onChange={(event) => updateTextAnswer(question.id, event.target.value)}
                      placeholder="Nhập đáp án của bạn"
                    />
                  )}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link className="inline-flex items-center justify-center rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300" to="/student">
          Quay lại dashboard
        </Link>
        <Button loading={submitting} disabled={questionCount === 0} onClick={() => void handleSubmit()}>
          Nộp bài
        </Button>
      </div>
    </div>
  )
}
