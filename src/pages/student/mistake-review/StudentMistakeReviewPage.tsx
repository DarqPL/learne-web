import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, ChevronLeft, ChevronRight, Loader2, RotateCcw, XCircle } from 'lucide-react'
import { getApiErrorMessage } from '../../../lib/api/client'
import {
  createMistakeReviewSession,
  listMistakeReviewQuestions,
} from '../../../lib/api/mistakeReviewApi'
import type { MistakeReviewQuestion } from '../../../lib/api/types'
import { Alert, AlertDescription, AlertTitle } from '../../../components/shadcn/ui/alert'
import { Badge } from '../../../components/shadcn/ui/badge'
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
import { studentQuestionTypeLabels } from '../learning/studentLearningLabels'

const PAGE_SIZE = 20

export function StudentMistakeReviewPage() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<MistakeReviewQuestion[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [page, setPage] = useState(0)
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([undefined])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const requestVersion = useRef(0)
  const createVersion = useRef(0)
  const creatingRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => () => {
    mountedRef.current = false
  }, [])

  useEffect(() => {
    const version = ++requestVersion.current
    let cancelled = false
    setLoading(true)
    setError(null)

    void (async () => {
      try {
        const response = await listMistakeReviewQuestions({ size: PAGE_SIZE })
        if (!cancelled && version === requestVersion.current) {
          setQuestions(response.data.content)
          setNextCursor(response.data.nextCursor)
          setHasNext(response.data.hasNext)
          setPage(0)
          setCursorStack([undefined])
        }
      } catch (err) {
        if (!cancelled && version === requestVersion.current) {
          setError(getApiErrorMessage(err, 'Không thể tải danh sách câu hỏi cần ôn.'))
          setQuestions([])
        }
      } finally {
        if (!cancelled && version === requestVersion.current) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [reloadKey])

  async function loadQuestionsPage(cursor: string | undefined, targetPage: number) {
    const version = ++requestVersion.current
    setLoading(true)
    setError(null)
    try {
      const response = await listMistakeReviewQuestions({
        size: PAGE_SIZE,
        ...(cursor ? { cursor } : {}),
      })
      if (version !== requestVersion.current) return
      setQuestions(response.data.content)
      setNextCursor(response.data.nextCursor)
      setHasNext(response.data.hasNext)
      setPage(targetPage)
    } catch (err) {
      if (version === requestVersion.current) {
        setError(getApiErrorMessage(err, 'Không thể tải danh sách câu hỏi cần ôn.'))
      }
    } finally {
      if (version === requestVersion.current) setLoading(false)
    }
  }

  function retryList() {
    setQuestions(null)
    setError(null)
    setLoading(true)
    setReloadKey((key) => key + 1)
  }

  async function handleStartReview() {
    if (creatingRef.current || loading) return
    creatingRef.current = true
    setCreating(true)
    setCreateError(null)
    const version = ++createVersion.current

    try {
      const response = await createMistakeReviewSession()
      if (!mountedRef.current || version !== createVersion.current) return
      if (response.data.sessionId === null) {
        setQuestions([])
        setNextCursor(null)
        setHasNext(false)
        setPage(0)
        setCursorStack([undefined])
        return
      }
      navigate(`/student/mistake-review/sessions/${response.data.sessionId}`)
    } catch (err) {
      if (mountedRef.current && version === createVersion.current) {
        setCreateError(getApiErrorMessage(err, 'Không thể bắt đầu phiên ôn tập.'))
      }
    } finally {
      creatingRef.current = false
      if (mountedRef.current && version === createVersion.current) setCreating(false)
    }
  }

  const hasQuestions = questions !== null && questions.length > 0

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/student">Trang chủ</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Ôn tập lỗi sai</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">Ôn tập lỗi sai</h1>
          <p className="max-w-2xl text-base leading-7 text-gray-600">
            Xem lại các câu bạn đã từng trả lời sai và luyện tập lại trong một phiên ngắn.
          </p>
        </div>
        <Button
          onClick={() => void handleStartReview()}
          disabled={loading || creating || !hasQuestions}
          loading={creating}
          className="w-full sm:w-auto"
        >
          <RotateCcw aria-hidden="true" />
          Ôn tập ngay
        </Button>
      </section>

      {createError ? (
        <Alert variant="destructive">
          <XCircle aria-hidden="true" />
          <AlertTitle>Không thể bắt đầu phiên ôn tập</AlertTitle>
          <AlertDescription>{createError}</AlertDescription>
          <div className="col-start-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => void handleStartReview()}>
              Thử lại
            </Button>
          </div>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <XCircle aria-hidden="true" />
          <AlertTitle>Không thể tải danh sách câu hỏi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <div className="col-start-2 mt-2">
            <Button variant="outline" size="sm" onClick={retryList}>
              Thử lại
            </Button>
          </div>
        </Alert>
      ) : null}

      {loading && questions === null ? (
        <Card className="border-slate-200 bg-white">
          <CardContent className="flex items-center justify-center gap-3 p-10 text-slate-600">
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            Đang tải câu hỏi cần ôn...
          </CardContent>
        </Card>
      ) : !error && questions !== null && questions.length === 0 ? (
        <Card className="border-dashed border-indigo-200 bg-white/95">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <BookOpen aria-hidden="true" className="size-6" />
            </span>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-slate-950">Bạn chưa có câu sai nào cần ôn</h2>
              <p className="max-w-lg text-sm leading-6 text-slate-600">
                Khi bạn trả lời sai trong bài học, câu hỏi sẽ xuất hiện ở đây để bạn luyện lại.
              </p>
            </div>
            <Button asChild>
              <Link to="/student/courses">Khám phá khóa học</Link>
            </Button>
          </CardContent>
        </Card>
      ) : !error && questions !== null ? (
        <>
          <div className="space-y-3">
            {questions.map((question) => (
              <Card key={question.questionId} className="border-slate-200 bg-white">
                <CardHeader className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {studentQuestionTypeLabels[question.questionType] ?? question.questionType}
                    </Badge>
                    {question.courseName || question.lessonTitle ? (
                      <span className="text-sm text-slate-600">
                        {[question.courseName, question.lessonTitle].filter(Boolean).join(' · ')}
                      </span>
                    ) : null}
                  </div>
                  <CardTitle className="whitespace-pre-wrap text-base leading-7 text-slate-950">
                    {question.questionText}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          <nav aria-label="Phân trang câu hỏi cần ôn" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p aria-live="polite" className="text-sm text-muted-foreground">
              Trang {page + 1} · {questions.length} câu hỏi trên trang này
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                aria-label="Trang trước"
                disabled={page === 0 || loading}
                onClick={() => void loadQuestionsPage(cursorStack[page - 1], page - 1)}
              >
                <ChevronLeft aria-hidden="true" />
                Trước
              </Button>
              <span className="text-sm text-muted-foreground" aria-live="polite">
                {page + 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                aria-label="Trang tiếp"
                disabled={!hasNext || !nextCursor || loading}
                onClick={() => {
                  if (!nextCursor) return
                  setCursorStack((current) => [...current.slice(0, page + 1), nextCursor])
                  void loadQuestionsPage(nextCursor, page + 1)
                }}
              >
                Tiếp
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </nav>
        </>
      ) : null}
    </div>
  )
}
