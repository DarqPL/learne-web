import axios from 'axios'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { getApiErrorMessage } from '../../../lib/api/client'
import { getGrammarCheck, listGrammarChecks, submitGrammarCheck } from '../../../lib/api/grammarCheckApi'
import type { GrammarCheckErrorItem, GrammarCheckListItem, GrammarCheckResult, GrammarCheckStatus } from '../../../lib/api/types'
import { Alert, AlertDescription } from '../../../components/shadcn/ui/alert'
import { Badge } from '../../../components/shadcn/ui/badge'
import { Button } from '../../../components/shadcn/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/shadcn/ui/card'
import { Separator } from '../../../components/shadcn/ui/separator'
import { Field } from '../../../components/ui/Field'
import { Spinner } from '../../../components/ui/Spinner'
import { Textarea } from '../../../components/ui/Textarea'
import { formatStudentLearningDate } from './studentLearningUtils'

const MAX_INPUT_LENGTH = 2000

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
      <mark key={`error-${error.id}`} className="rounded bg-amber-100 px-1 text-amber-900 ring-1 ring-amber-200">
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
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'FAILED':
      return 'border-red-200 bg-red-50 text-red-700'
    case 'PENDING':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    default:
      return ''
  }
}

export function StudentGrammarCheckPage() {
  const mountedRef = useRef(false)
  const [inputText, setInputText] = useState('')
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<GrammarCheckResult | null>(null)
  const [history, setHistory] = useState<GrammarCheckListItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selectedCheckId, setSelectedCheckId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)

  async function refreshHistory() {
    setHistoryLoading(true)
    setHistoryError(null)

    try {
      const response = await listGrammarChecks({ page: 0, size: 10 })
      if (!mountedRef.current) return
      setHistory(response.data.content)
    } catch (error) {
      if (mountedRef.current) setHistoryError(getApiErrorMessage(error, 'Không thể tải lịch sử kiểm tra.'))
    } finally {
      if (mountedRef.current) setHistoryLoading(false)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    const historyTimer = window.setTimeout(() => void refreshHistory(), 0)

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

    setSubmitting(true)
    setFieldError(undefined)
    setErrorMessage(null)

    try {
      const response = await submitGrammarCheck({ inputText: trimmed })
      if (!mountedRef.current) return
      setResult(response.data)
      setSelectedCheckId(response.data.id)
      await refreshHistory()
    } catch (error) {
      if (mountedRef.current) setErrorMessage(buildSubmitErrorMessage(error))
    } finally {
      if (mountedRef.current) setSubmitting(false)
    }
  }

  async function handleSelectHistoryItem(id: number) {
    setSelectedCheckId(id)
    setErrorMessage(null)

    try {
      const response = await getGrammarCheck(id)
      if (!mountedRef.current) return
      setResult(response.data)
    } catch (error) {
      if (mountedRef.current) setErrorMessage(getApiErrorMessage(error, 'Không thể tải kết quả kiểm tra.'))
    }
  }

  const trimmedInputLength = inputText.trim().length
  const submitDisabled = submitting || trimmedInputLength === 0 || trimmedInputLength > MAX_INPUT_LENGTH
  const resultErrors = result ? sortErrors(result.errors) : []

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-indigo-100 py-0">
        <div className="bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-6">
          <Badge className="border-indigo-200 bg-indigo-100 text-indigo-700" variant="outline">
            AI Grammar Check
          </Badge>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Kiểm tra ngữ pháp AI</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
            Nhập đoạn văn tiếng Anh để AI phát hiện lỗi ngữ pháp, chính tả, dấu câu và đề xuất cách viết tự nhiên hơn.
          </p>
        </div>
      </Card>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Đoạn văn cần kiểm tra</CardTitle>
              <CardDescription>AI sẽ kiểm tra tối đa 2000 ký tự mỗi lần gửi.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
                <Field label="Nội dung" error={fieldError}>
                  <Textarea
                    className="min-h-44 resize-y"
                    disabled={submitting}
                    maxLength={MAX_INPUT_LENGTH + 200}
                    placeholder="Ví dụ: I want order pizza yesterday."
                    value={inputText}
                    onChange={(event) => {
                      setInputText(event.target.value)
                      if (fieldError) setFieldError(undefined)
                    }}
                  />
                </Field>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className={inputText.length > MAX_INPUT_LENGTH ? 'text-sm text-red-600' : 'text-sm text-gray-500'}>{inputText.length}/2000 ký tự</p>
                  <Button loading={submitting} disabled={submitDisabled} type="submit">
                    Kiểm tra ngữ pháp
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>Kết quả kiểm tra</CardTitle>
                  <CardDescription>{result ? `Mã kiểm tra #${result.id} • ${formatStudentLearningDate(result.createdAt)}` : 'Kết quả sẽ hiển thị sau khi gửi đoạn văn.'}</CardDescription>
                </div>
                {result ? <Badge className={getStatusBadgeClassName(result.status)} variant="outline">{formatStatus(result.status)}</Badge> : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {!result ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                  <p className="font-medium text-gray-900">Chưa có kết quả kiểm tra</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">Hãy nhập một đoạn văn tiếng Anh để AI phân tích lỗi và gợi ý chỉnh sửa.</p>
                </div>
              ) : result.status === 'FAILED' ? (
                <Alert variant="destructive">
                  <AlertDescription>{result.failureMessage || 'AI chưa thể hoàn tất kiểm tra này. Hãy thử gửi lại đoạn văn.'}</AlertDescription>
                </Alert>
              ) : result.errors.length === 0 ? (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5 text-sm font-medium text-emerald-800">Không phát hiện lỗi rõ ràng trong đoạn văn này.</div>
              ) : (
                <div className="space-y-5">
                  <div className="whitespace-pre-wrap rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-7 text-gray-800">{buildHighlightedText(result)}</div>
                  <Separator />
                  <div className="space-y-3">
                    {resultErrors.map((error) => (
                      <article key={error.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">#{error.sequenceOrder}</Badge>
                          <Badge className="border-amber-200 bg-amber-50 text-amber-700" variant="outline">
                            {formatErrorType(error.errorType)}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm text-gray-600">Lỗi: <span className="font-medium text-gray-900">{error.errorText}</span></p>
                        <p className="mt-2 text-sm text-gray-600">Gợi ý: <span className="font-medium text-emerald-700">{error.suggestion}</span></p>
                        <p className="mt-2 text-sm leading-6 text-gray-600">{error.explanation}</p>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử gần đây</CardTitle>
              <CardDescription>10 lần kiểm tra mới nhất của bạn.</CardDescription>
            </CardHeader>
            <CardContent>
              {historyError ? (
                <Alert variant="destructive">
                  <AlertDescription>{historyError}</AlertDescription>
                </Alert>
              ) : null}
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : history.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-600">Chưa có lịch sử kiểm tra. Kết quả mới sẽ xuất hiện tại đây.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      className={`w-full rounded-xl border p-3 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 ${
                        selectedCheckId === item.id ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-white'
                      }`}
                      type="button"
                      onClick={() => void handleSelectHistoryItem(item.id)}
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
                        <span>{item.errorCount} lỗi</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gợi ý sử dụng</CardTitle>
              <CardDescription>Cách nhận phản hồi chính xác hơn từ AI.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm leading-6 text-gray-600">
                <li>Viết một đoạn hoàn chỉnh thay vì chỉ nhập một vài từ rời rạc.</li>
                <li>Giữ nguyên lỗi bạn muốn kiểm tra để AI có thể đánh dấu đúng vị trí.</li>
                <li>Đọc phần giải thích trước khi áp dụng gợi ý để hiểu lý do sửa.</li>
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
