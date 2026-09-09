import { AlertTriangle, ArrowLeft, CheckCircle2, FileText, History, ListChecks, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../../lib/api/client'
import { getGrammarCheck, listGrammarChecks } from '../../../lib/api/grammarCheckApi'
import type { GrammarCheckErrorItem, GrammarCheckListItem, GrammarCheckPage, GrammarCheckResult, GrammarCheckStatus } from '../../../lib/api/types'
import { Alert, AlertDescription } from '../../../components/shadcn/ui/alert'
import { Badge } from '../../../components/shadcn/ui/badge'
import { Button } from '../../../components/shadcn/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/shadcn/ui/card'
import { Separator } from '../../../components/shadcn/ui/separator'
import { formatStudentLearningDate } from './studentLearningUtils'

const PAGE_SIZE = 10

const errorTypeStyles: Record<GrammarCheckErrorItem['errorType'], { badge: string; icon: string; marker: string }> = {
  GRAMMAR: { badge: 'border-violet-200 bg-violet-50 text-violet-700', icon: 'bg-violet-100 text-violet-700', marker: 'bg-violet-100 text-violet-900 ring-violet-200' },
  SPELLING: { badge: 'border-sky-200 bg-sky-50 text-sky-700', icon: 'bg-sky-100 text-sky-700', marker: 'bg-sky-100 text-sky-900 ring-sky-200' },
  PUNCTUATION: { badge: 'border-amber-200 bg-amber-50 text-amber-700', icon: 'bg-amber-100 text-amber-700', marker: 'bg-amber-100 text-amber-900 ring-amber-200' },
  WORD_CHOICE: { badge: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: 'bg-emerald-100 text-emerald-700', marker: 'bg-emerald-100 text-emerald-900 ring-emerald-200' },
  STYLE: { badge: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700', icon: 'bg-fuchsia-100 text-fuchsia-700', marker: 'bg-fuchsia-100 text-fuchsia-900 ring-fuchsia-200' },
  OTHER: { badge: 'border-slate-200 bg-slate-50 text-slate-700', icon: 'bg-slate-100 text-slate-700', marker: 'bg-slate-100 text-slate-900 ring-slate-200' },
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

function getStatusBadgeClassName(status: GrammarCheckStatus) {
  switch (status) {
    case 'SUCCEEDED':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'FAILED':
      return 'border-red-200 bg-red-50 text-red-700'
    case 'PENDING':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    default:
      return ''
  }
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

function HistoryDetail({ result }: { result: GrammarCheckResult }) {
  const resultErrors = sortErrors(result.errors)

  if (result.status === 'FAILED') {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{result.failureMessage || 'AI chưa thể hoàn tất kiểm tra này.'}</AlertDescription>
      </Alert>
    )
  }

  if (result.status === 'PENDING') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 p-5 text-sm font-medium text-amber-800">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Lần kiểm tra này đang được xử lý. Vui lòng thử mở lại sau ít phút.</span>
      </div>
    )
  }

  if (result.errors.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-5 text-sm font-medium text-emerald-800">
        <CheckCircle2 className="h-5 w-5" /> Không phát hiện lỗi rõ ràng trong đoạn văn này.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <FileText className="h-4 w-4" /> Đoạn văn đã đánh dấu
        </div>
        <div className="whitespace-pre-wrap text-sm leading-7 text-gray-800">{buildHighlightedText(result)}</div>
      </div>
      <Separator />
      <div className="space-y-3">
        {resultErrors.map((error) => {
          const style = errorTypeStyles[error.errorType]
          return (
            <article key={error.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
                  <p className="mt-3 text-sm text-gray-600">Lỗi: <span className="font-medium text-gray-900">{error.errorText}</span></p>
                  <p className="mt-2 text-sm text-gray-600">Gợi ý: <span className="font-medium text-emerald-700">{error.suggestion}</span></p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{error.explanation}</p>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export function StudentGrammarCheckHistoryPage() {
  const mountedRef = useRef(false)
  const listRequestIdRef = useRef(0)
  const detailRequestIdRef = useRef(0)
  const [page, setPage] = useState(0)
  const [historyPage, setHistoryPage] = useState<GrammarCheckPage | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [selectedCheckId, setSelectedCheckId] = useState<number | null>(null)
  const [detail, setDetail] = useState<GrammarCheckResult | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  async function loadDetail(id: number) {
    const requestId = detailRequestIdRef.current + 1
    detailRequestIdRef.current = requestId

    setSelectedCheckId(id)
    setDetailLoading(true)
    setDetailError(null)

    try {
      const response = await getGrammarCheck(id)
      if (!mountedRef.current || detailRequestIdRef.current !== requestId) return
      setDetail(response.data)
    } catch (error) {
      if (mountedRef.current && detailRequestIdRef.current === requestId) setDetailError(getApiErrorMessage(error, 'Không thể tải chi tiết kiểm tra.'))
    } finally {
      if (mountedRef.current && detailRequestIdRef.current === requestId) setDetailLoading(false)
    }
  }

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const requestId = listRequestIdRef.current + 1
    listRequestIdRef.current = requestId

    async function loadHistoryPage() {
      setHistoryLoading(true)
      setHistoryError(null)

      try {
        const response = await listGrammarChecks({ page, size: PAGE_SIZE })
        if (!mountedRef.current || listRequestIdRef.current !== requestId) return
        setHistoryPage(response.data)

        const firstItem = response.data.content[0]
        if (firstItem) {
          void loadDetail(firstItem.id)
        } else {
          setSelectedCheckId(null)
          setDetail(null)
        }
      } catch (error) {
        if (mountedRef.current && listRequestIdRef.current === requestId) setHistoryError(getApiErrorMessage(error, 'Không thể tải lịch sử kiểm tra.'))
      } finally {
        if (mountedRef.current && listRequestIdRef.current === requestId) setHistoryLoading(false)
      }
    }

    void loadHistoryPage()
  }, [page])

  const historyItems: GrammarCheckListItem[] = historyPage?.content ?? []
  const hasPrevious = page > 0
  const hasNext = historyPage ? page + 1 < historyPage.totalPages : false

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-indigo-100 py-0 shadow-sm">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="relative bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-5 sm:p-7">
          <Button asChild variant="outline" className="mb-5 border-indigo-200 bg-white/80 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800">
            <Link to="/student/grammar-check">
              <ArrowLeft className="h-4 w-4" /> Quay lại kiểm tra
            </Link>
          </Button>
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <History className="h-7 w-7" />
            </div>
            <div>
              <Badge className="border-indigo-200 bg-white/80 text-indigo-700" variant="outline">
                Lịch sử luyện viết
              </Badge>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">Toàn bộ lịch sử kiểm tra</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">Xem lại các lần AI đã phân tích, mở chi tiết lỗi và tiếp tục rút kinh nghiệm cho bài viết tiếp theo.</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-600" /> Danh sách kiểm tra
            </CardTitle>
            <CardDescription>{historyPage ? `${historyPage.totalElements} lần kiểm tra đã lưu` : '10 lần kiểm tra mỗi trang.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {historyError ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{historyError}</AlertDescription>
              </Alert>
            ) : null}
            {historyLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              </div>
            ) : historyItems.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-600">Chưa có lịch sử kiểm tra.</p>
            ) : (
              <div className="space-y-2">
                {historyItems.map((item) => (
                  <button
                    key={item.id}
                    className={`w-full rounded-xl border p-3 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 ${selectedCheckId === item.id ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-white'}`}
                    type="button"
                    onClick={() => void loadDetail(item.id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-gray-900">#{item.id}</span>
                      <Badge className={getStatusBadgeClassName(item.status)} variant="outline">
                        {formatStatus(item.status)}
                      </Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-5 text-gray-600">{item.inputPreview || 'Không có nội dung xem trước.'}</p>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-gray-500">
                      <span>{formatStudentLearningDate(item.createdAt)}</span>
                      <span className="inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {item.errorCount} lỗi</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between gap-3 border-t pt-4">
              <Button variant="outline" disabled={!hasPrevious || historyLoading} onClick={() => setPage((current) => Math.max(0, current - 1))}>
                Trước
              </Button>
              <span className="text-sm text-gray-500">Trang {page + 1}{historyPage ? ` / ${Math.max(historyPage.totalPages, 1)}` : ''}</span>
              <Button variant="outline" disabled={!hasNext || historyLoading} onClick={() => setPage((current) => current + 1)}>
                Sau
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-indigo-600" /> Chi tiết kết quả
                </CardTitle>
                <CardDescription>{detail ? `Mã kiểm tra #${detail.id} • ${formatStudentLearningDate(detail.createdAt)}` : 'Chọn một lần kiểm tra để xem chi tiết.'}</CardDescription>
              </div>
              {detail ? <Badge className={getStatusBadgeClassName(detail.status)} variant="outline">{formatStatus(detail.status)}</Badge> : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {detailError ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{detailError}</AlertDescription>
              </Alert>
            ) : null}
            {detailLoading ? (
              <div className="flex justify-center rounded-xl border border-slate-200 bg-slate-50 py-12">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              </div>
            ) : detail ? (
              <HistoryDetail result={detail} />
            ) : (
              <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 p-6 text-center">
                <History className="mx-auto h-8 w-8 text-indigo-500" />
                <p className="mt-3 font-medium text-gray-900">Chưa chọn kết quả</p>
                <p className="mt-2 text-sm leading-6 text-gray-600">Mở một mục trong lịch sử để xem lại lỗi và gợi ý.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
