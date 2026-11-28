import axios from 'axios'
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  FileText,
  History,
  ListChecks,
  Loader2,
  MessageSquareText,
  ScanText,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../../lib/api/client'
import { getGrammarCheck, listGrammarChecks, submitGrammarCheck } from '../../../lib/api/grammarCheckApi'
import type { GrammarCheckErrorItem, GrammarCheckListItem, GrammarCheckResult, GrammarCheckStatus } from '../../../lib/api/types'
import { Alert, AlertDescription } from '../../../components/shadcn/ui/alert'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/shadcn/ui/card'
import { Separator } from '../../../components/shadcn/ui/separator'
import { Field } from '../../../components/ui/Field'
import { Textarea } from '../../../components/ui/Textarea'
import { formatStudentLearningDate } from './studentLearningUtils'

const MAX_INPUT_LENGTH = 2000

const errorTypeStyles: Record<GrammarCheckErrorItem['errorType'], { badge: string; icon: string; marker: string }> = {
  GRAMMAR: { badge: 'bg-taxonomy-1 text-taxonomy-1-foreground', icon: 'bg-taxonomy-1 text-taxonomy-1-foreground', marker: 'bg-taxonomy-1 text-taxonomy-1-foreground ring-taxonomy-1-foreground/30' },
  SPELLING: { badge: 'bg-taxonomy-2 text-taxonomy-2-foreground', icon: 'bg-taxonomy-2 text-taxonomy-2-foreground', marker: 'bg-taxonomy-2 text-taxonomy-2-foreground ring-taxonomy-2-foreground/30' },
  PUNCTUATION: { badge: 'bg-taxonomy-6 text-taxonomy-6-foreground', icon: 'bg-taxonomy-6 text-taxonomy-6-foreground', marker: 'bg-taxonomy-6 text-taxonomy-6-foreground ring-taxonomy-6-foreground/30' },
  WORD_CHOICE: { badge: 'bg-taxonomy-5 text-taxonomy-5-foreground', icon: 'bg-taxonomy-5 text-taxonomy-5-foreground', marker: 'bg-taxonomy-5 text-taxonomy-5-foreground ring-taxonomy-5-foreground/30' },
  STYLE: { badge: 'bg-taxonomy-8 text-taxonomy-8-foreground', icon: 'bg-taxonomy-8 text-taxonomy-8-foreground', marker: 'bg-taxonomy-8 text-taxonomy-8-foreground ring-taxonomy-8-foreground/30' },
  OTHER: { badge: 'bg-muted text-foreground', icon: 'bg-muted text-foreground', marker: 'bg-muted text-foreground ring-border' },
}

function formatStatus(status: GrammarCheckStatus) {
  switch (status) {
    case 'SUCCEEDED':
      return 'Hoàn tất'
    case 'FAILED':
      return 'Thất bại'
    case 'PENDING':
      return 'Đang xử lý'
    default:
      return status
  }
}

function formatErrorType(type: GrammarCheckErrorItem['errorType']) {
  switch (type) {
    case 'GRAMMAR':
      return 'Ngữ pháp'
    case 'SPELLING':
      return 'Chính tả'
    case 'PUNCTUATION':
      return 'Dấu câu'
    case 'WORD_CHOICE':
      return 'Dùng từ'
    case 'STYLE':
      return 'Văn phong'
    case 'OTHER':
      return 'Khác'
    default:
      return type
  }
}

function getFailureCheckId(error: unknown) {
  if (!axios.isAxiosError(error)) return null

  const data = error.response?.data as { checkId?: unknown } | undefined
  return typeof data?.checkId === 'number' ? data.checkId : null
}

function sortErrors(errors: GrammarCheckErrorItem[]) {
  return [...errors].sort((left, right) => {
    if (left.startPos !== right.startPos) return left.startPos - right.startPos
    if (left.endPos !== right.endPos) return left.endPos - right.endPos
    return left.sequenceOrder - right.sequenceOrder
  })
}

function buildHighlightedText(result: GrammarCheckResult): ReactNode[] {
  const inputText = result.inputText
  const nodes: ReactNode[] = []
  let cursor = 0

  for (const error of sortErrors(result.errors)) {
    const validRange = error.startPos >= 0 && error.endPos > error.startPos && error.endPos <= inputText.length
    const overlapsPreviousRange = error.startPos < cursor

    if (!validRange || overlapsPreviousRange) continue


    if (error.startPos > cursor) {
      nodes.push(<span key={`text-${cursor}-${error.startPos}`}>{inputText.slice(cursor, error.startPos)}</span>)
    }

    nodes.push(
      <mark key={`error-${error.id}`} className={`rounded px-1 ring-1 ${errorTypeStyles[error.errorType].marker}`}>
        {inputText.slice(error.startPos, error.endPos)}
      </mark>,
    )
    cursor = error.endPos
  }

  if (cursor < inputText.length) {
    nodes.push(<span key={`text-${cursor}-end`}>{inputText.slice(cursor)}</span>)
  }

  return nodes.length > 0 ? nodes : [inputText]
}

function buildSubmitErrorMessage(error: unknown) {
  const message = getApiErrorMessage(error, 'Không thể kiểm tra ngữ pháp. Hãy thử lại sau.')
  const checkId = getFailureCheckId(error)
  return checkId === null ? message : `${message} Mã kiểm tra: #${checkId}`
}

function getStatusBadgeClassName(status: GrammarCheckStatus) {
  switch (status) {
    case 'SUCCEEDED':
      return 'border-success/40 bg-success-background text-success-foreground'
    case 'FAILED':
      return 'border-destructive/30 bg-destructive/10 text-destructive'
    case 'PENDING':
      return 'border-warning/40 bg-warning-background text-warning-foreground'
    default:
      return ''
  }
}

function getErrorTypeStyle(type: GrammarCheckErrorItem['errorType']) {
  return errorTypeStyles[type]
}

export function StudentGrammarCheckPage() {
  const mountedRef = useRef(false)
  const resultRequestIdRef = useRef(0)
  const historyRequestIdRef = useRef(0)
  const [inputText, setInputText] = useState('')
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<GrammarCheckResult | null>(null)
  const [history, setHistory] = useState<GrammarCheckListItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selectedCheckId, setSelectedCheckId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)

  async function loadHistory() {
    const requestId = historyRequestIdRef.current + 1
    historyRequestIdRef.current = requestId

    setHistoryLoading(true)
    setHistoryError(null)

    try {
      const response = await listGrammarChecks({ page: 0, size: 3 })
      if (!mountedRef.current || historyRequestIdRef.current !== requestId) return
      setHistory(response.data.content)
    } catch (error) {
      if (mountedRef.current && historyRequestIdRef.current === requestId) setHistoryError(getApiErrorMessage(error, 'Không thể tải lịch sử kiểm tra.'))
    } finally {
      if (mountedRef.current && historyRequestIdRef.current === requestId) setHistoryLoading(false)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    const historyTimer = window.setTimeout(() => void loadHistory(), 0)

    return () => {
      window.clearTimeout(historyTimer)
      mountedRef.current = false
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmed = inputText.trim()
    if (!trimmed) {
      setFieldError('Vui lòng nhập đoạn văn cần kiểm tra.')
      return
    }
    if (trimmed.length > MAX_INPUT_LENGTH) {
      setFieldError('Đoạn văn không được vượt quá 2000 ký tự.')
      return
    }

    const requestId = resultRequestIdRef.current + 1
    resultRequestIdRef.current = requestId

    setSubmitting(true)
    setFieldError(undefined)
    setErrorMessage(null)

    try {
      const response = await submitGrammarCheck({ inputText: trimmed })
      if (!mountedRef.current || resultRequestIdRef.current !== requestId) return
      setResult(response.data)
      setSelectedCheckId(response.data.id)
      await loadHistory()
    } catch (error) {
      const checkId = getFailureCheckId(error)

      if (mountedRef.current && resultRequestIdRef.current === requestId) setErrorMessage(buildSubmitErrorMessage(error))

      if (checkId !== null) {
        try {
          const response = await getGrammarCheck(checkId)
          if (mountedRef.current && resultRequestIdRef.current === requestId) {
            setResult(response.data)
            setSelectedCheckId(checkId)
          }
        } catch {
          // Keep the submit error visible if the persisted failed result cannot be loaded.
        }

        await loadHistory()
      }
    } finally {
      if (mountedRef.current) setSubmitting(false)
    }
  }

  async function handleSelectHistoryItem(id: number) {
    const requestId = resultRequestIdRef.current + 1
    resultRequestIdRef.current = requestId

    setSelectedCheckId(id)
    setErrorMessage(null)

    try {
      const response = await getGrammarCheck(id)
      if (!mountedRef.current || resultRequestIdRef.current !== requestId) return
      setResult(response.data)
    } catch (error) {
      if (mountedRef.current && resultRequestIdRef.current === requestId) setErrorMessage(getApiErrorMessage(error, 'Không thể tải kết quả kiểm tra.'))
    }
  }

  const trimmedInputLength = inputText.trim().length
  const submitDisabled = submitting || trimmedInputLength === 0 || trimmedInputLength > MAX_INPUT_LENGTH
  const resultErrors = result ? sortErrors(result.errors) : []

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
            <BreadcrumbPage>Kiểm tra ngữ pháp</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Card className="relative overflow-hidden border-border py-0 shadow-sm">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-36 w-36 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="relative bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                <WandSparkles className="h-7 w-7" />
              </div>
              <div>
                <Badge variant="secondary">
                  <Sparkles className="h-3 w-3" /> AI Grammar Check
                </Badge>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Kiểm tra ngữ pháp AI</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Nhập đoạn văn tiếng Anh để AI quét lỗi, tô sáng vị trí cần sửa và giải thích vì sao câu nên được viết tự nhiên hơn.
                </p>
              </div>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-3 lg:w-[420px] lg:grid-cols-1">
              <Badge className="justify-start px-3 py-2 shadow-sm" variant="info">
                <ScanText className="h-3.5 w-3.5" /> Tô sáng lỗi theo vị trí
              </Badge>
              <Badge className="justify-start px-3 py-2 shadow-sm" variant="success">
                <BookOpenCheck className="h-3.5 w-3.5" /> Gợi ý sửa dễ hiểu
              </Badge>
              <Badge className="justify-start px-3 py-2 shadow-sm" variant="taxonomy2">
                <ShieldCheck className="h-3.5 w-3.5" /> Lưu lịch sử luyện viết
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareText className="h-5 w-5 text-primary" /> Đoạn văn cần kiểm tra
              </CardTitle>
              <CardDescription>AI sẽ kiểm tra tối đa 2000 ký tự mỗi lần gửi.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
                <Field label="Nội dung" error={fieldError}>
                  <Textarea
                    className="min-h-48 resize-y border-border bg-muted/70 text-base leading-7 focus-visible:bg-card"
                    disabled={submitting}
                    maxLength={MAX_INPUT_LENGTH}
                    placeholder="Ví dụ: I want order pizza yesterday."
                    value={inputText}
                    onChange={(event) => {
                      setInputText(event.target.value)
                      if (fieldError) setFieldError(undefined)
                    }}
                  />
                </Field>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className={inputText.length > MAX_INPUT_LENGTH ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>{inputText.length}/2000 ký tự</p>
                  <Button loading={submitting} disabled={submitDisabled} type="submit">
                    {submitting ? null : <WandSparkles className="h-4 w-4" />}
                    Kiểm tra ngữ pháp
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-primary" /> Kết quả kiểm tra
                  </CardTitle>
                  <CardDescription>{result ? `Mã kiểm tra #${result.id} • ${formatStudentLearningDate(result.createdAt)}` : 'Kết quả sẽ hiển thị sau khi gửi đoạn văn.'}</CardDescription>
                </div>
                {result ? <Badge className={getStatusBadgeClassName(result.status)} variant="outline">{formatStatus(result.status)}</Badge> : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {!result ? (
                <div className="rounded-xl border border-dashed border-border bg-muted p-6 text-center">
                  <ScanText className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 font-medium text-foreground">Chưa có kết quả kiểm tra</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Hãy nhập một đoạn văn tiếng Anh để AI phân tích lỗi và gợi ý chỉnh sửa.</p>
                </div>
              ) : result.status === 'FAILED' ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{result.failureMessage || 'AI chưa thể hoàn tất kiểm tra này. Hãy thử gửi lại đoạn văn.'}</AlertDescription>
                </Alert>
              ) : result.status === 'PENDING' ? (
                <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning-background p-5 text-sm font-medium text-warning-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Lần kiểm tra này đang được xử lý. Vui lòng thử mở lại sau ít phút.</span>
                </div>
              ) : result.errors.length === 0 ? (
                <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success-background p-5 text-sm font-medium text-success-foreground">
                  <CheckCircle2 className="h-5 w-5" /> Không phát hiện lỗi rõ ràng trong đoạn văn này.
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-xl border border-border bg-muted p-4">
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <FileText className="h-4 w-4" /> Đoạn văn đã đánh dấu
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-7 text-foreground">{buildHighlightedText(result)}</div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    {resultErrors.map((error) => {
                      const style = getErrorTypeStyle(error.errorType)
                      return (
                      <article key={error.id} className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
                        <div className="flex gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.icon}`}>
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">#{error.sequenceOrder}</Badge>
                          <Badge className={style.badge} variant="outline">
                            {formatErrorType(error.errorType)}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">Lỗi: <span className="font-medium text-foreground">{error.errorText}</span></p>
                        <p className="mt-2 text-sm text-muted-foreground">Gợi ý: <span className="font-medium text-success">{error.suggestion}</span></p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{error.explanation}</p>
                          </div>
                        </div>
                      </article>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" /> Lịch sử gần đây
                  </CardTitle>
                  <CardDescription>3 lần kiểm tra gần nhất của bạn.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {historyError ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{historyError}</AlertDescription>
                </Alert>
              ) : null}
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : !historyError && history.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border bg-muted p-4 text-sm leading-6 text-muted-foreground">Chưa có lịch sử kiểm tra. Kết quả mới sẽ xuất hiện tại đây.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      className={`w-full rounded-xl border p-3 text-left transition-colors hover:border-ring/50 hover:bg-muted disabled:pointer-events-none disabled:opacity-60 ${
                        selectedCheckId === item.id ? 'border-primary bg-primary/10' : 'border-border bg-card'
                      }`}
                      type="button"
                      aria-pressed={selectedCheckId === item.id}
                      aria-busy={submitting}
                      disabled={submitting}
                      onClick={() => void handleSelectHistoryItem(item.id)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-foreground">#{item.id}</span>
                        <Badge className={getStatusBadgeClassName(item.status)} variant="outline">
                          {formatStatus(item.status)}
                        </Badge>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">{item.inputPreview || 'Không có nội dung xem trước.'}</p>
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span>{formatStudentLearningDate(item.createdAt)}</span>
                        <span className="inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {item.errorCount} lỗi</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <Button asChild variant="outline" className="w-full">
                <Link to="/student/grammar-check/history">
                  Xem toàn bộ lịch sử <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpenCheck className="h-5 w-5 text-success" /> Gợi ý sử dụng
              </CardTitle>
              <CardDescription>Cách nhận phản hồi chính xác hơn từ AI.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-success" /> Viết một đoạn hoàn chỉnh thay vì chỉ nhập một vài từ rời rạc.</li>
                <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-success" /> Giữ nguyên lỗi bạn muốn kiểm tra để AI có thể đánh dấu đúng vị trí.</li>
                <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-success" /> Đọc phần giải thích trước khi áp dụng gợi ý để hiểu lý do sửa.</li>
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
