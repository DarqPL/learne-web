import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { getApiErrorMessage } from '../../../lib/api/client'
import {
  getMistakeReviewSession,
  submitMistakeReviewSession,
} from '../../../lib/api/mistakeReviewApi'
import type {
  MistakeReviewQuestion,
  MistakeReviewResult,
  MistakeReviewSessionResponse,
} from '../../../lib/api/types'
import { Alert, AlertDescription, AlertTitle } from '../../../components/shadcn/ui/alert'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../../components/shadcn/ui/breadcrumb'
import { Button } from '../../../components/shadcn/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/shadcn/ui/card'
import { Spinner } from '../../../components/shadcn/ui/spinner'
import { MistakeReviewQuestionCard } from './MistakeReviewQuestionCard'
import { MistakeReviewResultList } from './MistakeReviewResultList'
import {
  buildSubmitAnswers,
  formatScorePercent,
  getAnswerValue,
  getUnansweredQuestions,
  hasCompleteResult,
  hasInvalidQuestionData,
  type MistakeReviewAnswerState,
} from './mistakeReviewUtils'

function parsePositiveInteger(value: string | undefined) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function getHttpStatus(error: unknown) {
  if (typeof error !== 'object' || error === null || !('response' in error)) return null
  return (error as { response?: { status?: number } }).response?.status ?? null
}

function getSessionErrorMessage(error: unknown) {
  return getHttpStatus(error) === 404
    ? 'Không tìm thấy phiên ôn tập.'
    : getApiErrorMessage(error, 'Không thể tải phiên ôn tập.')
}

function buildResult(session: MistakeReviewSessionResponse): MistakeReviewResult | null {
  if (session.scorePercent === null) return null
  if (session.answers.length !== session.questionCount) return null
  if (!hasCompleteResult(session.questions, session.answers, session.questionCount)) return null
  return {
    sessionId: session.sessionId,
    questionCount: session.questionCount,
    scorePercent: session.scorePercent,
    answers: session.answers,
  }
}

export function StudentMistakeReviewSessionPage() {
  const { sessionId: sessionIdParam } = useParams()
  const sessionId = parsePositiveInteger(sessionIdParam)
  const navigate = useNavigate()
  const [session, setSession] = useState<MistakeReviewSessionResponse | null>(null)
  const [result, setResult] = useState<MistakeReviewResult | null>(null)
  const [answers, setAnswers] = useState<MistakeReviewAnswerState>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'answering' | 'result' | 'error'>('answering')
  const requestVersion = useRef(0)
  const mountedRef = useRef(false)

  const applySession = useCallback((nextSession: MistakeReviewSessionResponse) => {
    setSession(nextSession)
    setError(null)

    if (nextSession.questionCount === 0) {
      setMode('error')
      setError('Phiên ôn tập không có câu hỏi.')
      return
    }

    if (nextSession.answers.length === 0 && nextSession.scorePercent === null) {
      setMode('answering')
      setResult(null)
      setAnswers({})
      setCurrentQuestionIndex(0)
      return
    }

    const nextResult = buildResult(nextSession)
    if (nextResult === null) {
      setMode('error')
      setError('Dữ liệu phiên ôn tập không nhất quán.')
      return
    }

    setMode('result')
    setResult(nextResult)
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const version = ++requestVersion.current
    let cancelled = false

    void (async () => {
      if (sessionId === null) {
        await Promise.resolve()
        if (cancelled || version !== requestVersion.current) return
        setLoading(false)
        setMode('error')
        setError('Không tìm thấy phiên ôn tập.')
        return
      }

      setLoading(true)
      setError(null)
      setResult(null)
      setAnswers({})
      setCurrentQuestionIndex(0)
      try {
        const response = await getMistakeReviewSession(sessionId)
        if (cancelled || version !== requestVersion.current) return
        applySession(response.data)
      } catch (err) {
        if (cancelled || version !== requestVersion.current) return
        setMode('error')
        setError(getSessionErrorMessage(err))
      } finally {
        if (!cancelled && version === requestVersion.current) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [applySession, sessionId])

  async function loadSession(targetSessionId: number, requireResult: boolean) {
    setLoading(true)
    setError(null)
    try {
      const response = await getMistakeReviewSession(targetSessionId)
      if (!mountedRef.current) return
      if (requireResult) {
        const nextResult = buildResult(response.data)
        setSession(response.data)
        if (nextResult === null) {
          setMode('error')
          setError('Phiên này đã được nộp nhưng không tải được kết quả.')
          return
        }
        setResult(nextResult)
        setMode('result')
        return
      }
      applySession(response.data)
    } catch (err) {
      if (!mountedRef.current) return
      setMode('error')
      setError(
        requireResult
          ? 'Phiên này đã được nộp nhưng không tải được kết quả.'
          : getSessionErrorMessage(err),
      )
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  function retrySession() {
    const targetSessionId = session?.sessionId ?? sessionId
    if (targetSessionId === null) return
    void loadSession(targetSessionId, false)
  }

  function updateAnswer(questionId: number, nextAnswer: MistakeReviewAnswerState[number]) {
    setAnswers((current) => ({ ...current, [questionId]: nextAnswer }))
    setError(null)
  }

  async function handleSubmit() {
    if (!session || submitting) return

    const invalidQuestion = session.questions.find(hasInvalidQuestionData)
    if (invalidQuestion) {
      setError('Câu hỏi này không có đáp án để chọn.')
      return
    }

    const unanswered = getUnansweredQuestions(session.questions, answers)
    if (unanswered.length > 0) {
      const firstUnansweredIndex = session.questions.findIndex(
        (question) => question.questionId === unanswered[0].questionId,
      )
      if (firstUnansweredIndex >= 0) setCurrentQuestionIndex(firstUnansweredIndex)
      setError('Vui lòng trả lời tất cả câu hỏi trước khi nộp bài.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const response = await submitMistakeReviewSession(session.sessionId, {
        answers: buildSubmitAnswers(session.questions, answers),
      })
      if (!mountedRef.current) return
      if (!hasCompleteResult(session.questions, response.data.answers, response.data.questionCount)) {
        setMode('error')
        setError('Dữ liệu kết quả ôn tập không nhất quán.')
        return
      }
      setResult(response.data)
      setMode('result')
    } catch (err) {
      if (!mountedRef.current) return
      if (getHttpStatus(err) === 409) {
        await loadSession(session.sessionId, true)
        return
      }
      setError(getApiErrorMessage(err, 'Không thể nộp bài ôn tập.'))
    } finally {
      if (mountedRef.current) setSubmitting(false)
    }
  }

  const currentQuestion: MistakeReviewQuestion | null = session?.questions[currentQuestionIndex] ?? null
  const progressPercent =
    session && session.questionCount > 0
      ? Math.round(((currentQuestionIndex + 1) / session.questionCount) * 100)
      : 0
  const isLastQuestion = session ? currentQuestionIndex >= session.questions.length - 1 : false

  if (loading && session === null) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (mode === 'error') {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <XCircle aria-hidden="true" />
          <AlertTitle>Không thể mở phiên ôn tập</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/student/mistake-review">Về danh sách ôn tập</Link>
          </Button>
          {sessionId !== null ? (
            <Button onClick={retrySession}>Thử lại</Button>
          ) : null}
        </div>
      </div>
    )
  }

  if (mode === 'result' && result && session) {
    return (
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/student">Trang chủ</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/student/mistake-review">Ôn tập lỗi sai</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Kết quả</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-indigo-50">
          <CardHeader>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Kết quả ôn tập</p>
            <CardTitle className="text-3xl text-slate-950">{formatScorePercent(result.scorePercent)}</CardTitle>
            <p className="text-sm text-slate-600">
              {result.answers.filter((answer) => answer.correct).length}/{result.questionCount} câu đúng
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => navigate('/student/mistake-review')}>Ôn tập tiếp</Button>
            <Button variant="outline" asChild>
              <Link to="/student/courses">Về khóa học</Link>
            </Button>
          </CardContent>
        </Card>

        <MistakeReviewResultList questions={session.questions} answers={result.answers} />
      </div>
    )
  }

  if (!session || !currentQuestion) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <XCircle aria-hidden="true" />
          <AlertTitle>Không thể mở phiên ôn tập</AlertTitle>
          <AlertDescription>Dữ liệu phiên ôn tập không nhất quán.</AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link to="/student/mistake-review">Về danh sách ôn tập</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/student">Trang chủ</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/student/mistake-review">Ôn tập lỗi sai</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Phiên ôn tập</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-950">Ôn tập lỗi sai</h1>
            <p className="mt-1 text-sm text-slate-600">
              Câu {currentQuestionIndex + 1}/{session.questionCount}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/student/mistake-review">
              <ArrowLeft aria-hidden="true" />
              Về danh sách
            </Link>
          </Button>
        </div>

        <div
          className="h-2 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
          aria-label="Tiến độ phiên ôn tập"
        >
          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </section>

      {error ? (
        <Alert variant="destructive">
          <XCircle aria-hidden="true" />
          <AlertTitle>Chưa thể nộp bài</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <MistakeReviewQuestionCard
        question={currentQuestion}
        answer={getAnswerValue(answers, currentQuestion.questionId)}
        onChange={(nextAnswer) => updateAnswer(currentQuestion.questionId, nextAnswer)}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Button
          variant="outline"
          disabled={currentQuestionIndex === 0 || submitting}
          onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))}
        >
          Trước
        </Button>
        <Button
          loading={submitting}
          onClick={() => {
            if (isLastQuestion) {
              void handleSubmit()
            } else {
              setCurrentQuestionIndex((index) => Math.min(session.questions.length - 1, index + 1))
            }
          }}
        >
          {isLastQuestion ? (
            <>
              <CheckCircle2 aria-hidden="true" />
              Nộp bài
            </>
          ) : (
            'Tiếp'
          )}
        </Button>
      </div>
    </div>
  )
}
