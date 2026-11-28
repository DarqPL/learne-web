import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/ui/alert'
import { Badge } from '@/components/shadcn/ui/badge'
import { Button } from '@/components/shadcn/ui/button'
import { CourseCoverImage } from '../../../components/course/CourseCoverImage'
import { getApiErrorMessage } from '../../../lib/api/client'
import {
  approveCourseCoverReview,
  getCourseCoverReview,
  listPendingCourseCoverReviews,
  rejectCourseCoverReview,
} from '../../../lib/api/adminReviewApi'
import type { AdminCourseCoverReviewDetail, AdminCourseCoverReviewSummary } from '../../../lib/api/types'

function isConflict(error: unknown) {
  return (error as { response?: { status?: number } }).response?.status === 409
}

export function AdminCourseCoverReviewPanel() {
  const [reviews, setReviews] = useState<AdminCourseCoverReviewSummary[] | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<AdminCourseCoverReviewDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject' | 'load-more' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)
  const mountedRef = useRef(false)
  const detailRequestIdRef = useRef(0)

  const loadDetail = useCallback(async (reviewId: number) => {
    const requestId = detailRequestIdRef.current + 1
    detailRequestIdRef.current = requestId
    setSelectedId(reviewId)
    setDetail(null)
    setLoadingDetail(true)
    try {
      const response = await getCourseCoverReview(reviewId)
      if (mountedRef.current && detailRequestIdRef.current === requestId) setDetail(response.data)
    } catch (loadError) {
      if (mountedRef.current && detailRequestIdRef.current === requestId) {
        setError(getApiErrorMessage(loadError, 'Không thể tải thông tin ảnh bìa cần duyệt.'))
      }
    } finally {
      if (mountedRef.current && detailRequestIdRef.current === requestId) setLoadingDetail(false)
    }
  }, [])

  const loadQueue = async (cursor?: string | null, selectFirst = false) => {
    try {
      const response = await listPendingCourseCoverReviews(
        cursor ? { cursor } : undefined,
      )
      if (!mountedRef.current) return
      setReviews((current) => cursor ? [...(current ?? []), ...response.data.content] : response.data.content)
      setNextCursor(response.data.nextCursor)
      setError(null)
      if (selectFirst && response.data.content[0]) {
        await loadDetail(response.data.content[0].id)
      } else if (selectFirst) {
        setSelectedId(null)
        setDetail(null)
      }
    } catch (loadError) {
      if (mountedRef.current) {
        setError(getApiErrorMessage(loadError, 'Không thể tải ảnh bìa chờ duyệt.'))
        if (!cursor) setReviews([])
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true
    void listPendingCourseCoverReviews()
      .then((response) => {
        if (!mountedRef.current) return
        setReviews(response.data.content)
        setNextCursor(response.data.nextCursor)
        setError(null)
        const firstReview = response.data.content[0]
        if (firstReview) {
          return loadDetail(firstReview.id)
        }
        setSelectedId(null)
        setDetail(null)
      })
      .catch((loadError: unknown) => {
        if (!mountedRef.current) return
        setError(getApiErrorMessage(loadError, 'Không thể tải ảnh bìa chờ duyệt.'))
        setReviews([])
      })
    return () => {
      mountedRef.current = false
      detailRequestIdRef.current += 1
    }
  }, [loadDetail])

  const handleApprove = async () => {
    if (!detail || action) return
    setAction('approve')
    setError(null)
    setInfo(null)
    try {
      await approveCourseCoverReview(detail.id)
      setInfo('Đã duyệt ảnh bìa khóa học.')
      await loadQueue(null, true)
    } catch (approveError) {
      setError(getApiErrorMessage(approveError, 'Không thể duyệt ảnh bìa khóa học.'))
      if (isConflict(approveError)) await loadQueue(null, true)
    } finally {
      setAction(null)
    }
  }

  const handleReject = async () => {
    if (!detail || action) return
    if (!reason.trim()) {
      setReasonError('Vui lòng nhập lý do từ chối.')
      return
    }
    setAction('reject')
    setError(null)
    setInfo(null)
    setReasonError(null)
    try {
      await rejectCourseCoverReview(detail.id, { reason: reason.trim() })
      setInfo('Đã từ chối ảnh bìa khóa học.')
      setReason('')
      setShowRejectForm(false)
      await loadQueue(null, true)
    } catch (rejectError) {
      setError(getApiErrorMessage(rejectError, 'Không thể từ chối ảnh bìa khóa học.'))
      if (isConflict(rejectError)) await loadQueue(null, true)
    } finally {
      setAction(null)
    }
  }

  const busy = action !== null

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Ảnh bìa khóa học chờ duyệt</h2>
        {reviews !== null ? <p className="mt-1 text-sm text-muted-foreground">{reviews.length} đề xuất đang tải</p> : null}
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Không thể xử lý ảnh bìa</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {info ? (
        <Alert>
          <AlertTitle>Thành công</AlertTitle>
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
        <aside className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
          {reviews === null ? (
            <p className="py-4 text-sm text-muted-foreground">Đang tải ảnh bìa chờ duyệt...</p>
          ) : reviews.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">Không có ảnh bìa nào đang chờ duyệt.</p>
          ) : (
            reviews.map((review) => (
              <button
                key={review.id}
                type="button"
                aria-current={selectedId === review.id ? 'true' : undefined}
                disabled={busy}
                className={`rounded-lg border p-3 text-left ${
                  selectedId === review.id ? 'border-ring bg-accent text-accent-foreground' : 'border-border hover:border-ring/50 hover:bg-muted'
                }`}
                onClick={() => {
                  setError(null)
                  setInfo(null)
                  setShowRejectForm(false)
                  void loadDetail(review.id)
                }}
              >
                <span className="block truncate text-sm font-medium text-foreground">{review.courseName}</span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">{review.teacherName}</span>
                <span className="mt-2 block text-xs text-muted-foreground">{new Date(review.submittedAt).toLocaleString('vi-VN')}</span>
              </button>
            ))
          )}
          {nextCursor ? (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setAction('load-more')
                void loadQueue(nextCursor).finally(() => setAction(null))
              }}
            >
              Tải thêm ảnh bìa
            </Button>
          ) : null}
        </aside>

        <section className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-card p-5">
          {loadingDetail ? (
            <p className="text-sm text-muted-foreground">Đang tải đề xuất ảnh bìa...</p>
          ) : detail ? (
            <>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">{detail.courseName}</h3>
                  <Badge variant="outline">Chờ duyệt</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{detail.teacherName} · {detail.teacherEmail}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <h4 className="text-sm font-semibold text-foreground">Ảnh bìa hiện tại</h4>
                  <CourseCoverImage
                    courseName={detail.courseName}
                    imageUrl={detail.currentCoverImageUrl}
                    imageAlt={`Ảnh bìa khóa học hiện tại cho ${detail.courseName}`}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <h4 className="text-sm font-semibold text-foreground">Ảnh bìa đề xuất</h4>
                  <CourseCoverImage
                    courseName={detail.courseName}
                    imageUrl={detail.proposedCoverImageUrl}
                    imageAlt={`Ảnh bìa đề xuất cho ${detail.courseName}`}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-y border-border py-3">
                <Button type="button" disabled={busy} onClick={() => void handleApprove()}>
                  Duyệt ảnh bìa
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  aria-expanded={showRejectForm}
                  onClick={() => {
                    setShowRejectForm((current) => !current)
                    setReasonError(null)
                  }}
                >
                  Từ chối ảnh bìa
                </Button>
              </div>
              {showRejectForm ? (
                <div className="flex flex-col gap-2">
                  <label htmlFor="cover-rejection-reason" className="text-sm font-medium">Lý do từ chối ảnh bìa</label>
                  <textarea
                    id="cover-rejection-reason"
                    rows={3}
                    value={reason}
                    disabled={busy}
                    onChange={(event) => {
                      setReason(event.target.value)
                      setReasonError(null)
                    }}
                    className="rounded-md border border-border p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  {reasonError ? <p role="alert" className="text-sm text-destructive">{reasonError}</p> : null}
                  <div className="flex justify-end">
                    <Button type="button" variant="destructive" disabled={busy} onClick={() => void handleReject()}>
                      {action === 'reject' ? 'Đang từ chối...' : 'Xác nhận từ chối'}
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Chọn một đề xuất để xem ảnh cần duyệt.</p>
          )}
        </section>
      </div>
    </div>
  )
}
