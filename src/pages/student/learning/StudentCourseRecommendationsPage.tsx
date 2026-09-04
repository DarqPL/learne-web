import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../../lib/api/client'
import { generateCourseRecommendations, getCurrentCourseRecommendations } from '../../../lib/api/studentLearningApi'
import type { CourseRecommendationPath } from '../../../lib/api/types'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { studentCourseTypeLabels } from './studentLearningLabels'
import { formatStudentLearningDate } from './studentLearningUtils'

function formatScore(value: number) {
  if (!Number.isFinite(value)) return 0
  const percent = value <= 1 ? value * 100 : value
  return Math.min(100, Math.max(0, Math.round(percent)))
}

function isCurrentRecommendationsMissingError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404
}

function getCourseTypeLabel(type: string) {
  return type in studentCourseTypeLabels ? studentCourseTypeLabels[type as keyof typeof studentCourseTypeLabels] : type
}

export function StudentCourseRecommendationsPage() {
  const mountedRef = useRef(false)
  const [path, setPath] = useState<CourseRecommendationPath | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      setLoading(true)
      setError(null)
      setInfo(null)
      try {
        const response = await getCurrentCourseRecommendations()
        if (cancelled) return
        setPath(response.data)
      } catch (err) {
        if (cancelled) return
        setPath(null)
        if (isCurrentRecommendationsMissingError(err)) {
          setInfo('Bạn chưa có danh sách khóa học AI đề xuất. Hãy tạo đề xuất sau khi hoàn thành hoặc bỏ qua bài kiểm tra đầu vào.')
        } else {
          setError(getApiErrorMessage(err, 'Không thể tải khóa học AI đề xuất.'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleGenerate() {
    if (generating) return

    setGenerating(true)
    setError(null)
    setInfo(null)
    try {
      const response = await generateCourseRecommendations({ maxItems: 8 })
      if (!mountedRef.current) return
      setPath(response.data)
      setInfo('Danh sách khóa học AI đề xuất đã được cập nhật.')
    } catch (err) {
      if (mountedRef.current) setError(getApiErrorMessage(err, 'Không thể tạo khóa học AI đề xuất. Hãy thử lại sau.'))
    } finally {
      if (mountedRef.current) setGenerating(false)
    }
  }

  const sortedItems = path ? [...path.items].sort((left, right) => left.sequenceOrder - right.sequenceOrder) : []

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                AI course recommendations
              </span>
              <h1 className="mt-4 text-3xl font-bold text-gray-900">Khóa học AI đề xuất</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
                AI phân tích bài kiểm tra đầu vào và dữ liệu học tập để ưu tiên khóa học phù hợp với kỹ năng cần cải thiện.
              </p>
            </div>

            <Button loading={generating} disabled={loading || generating} onClick={() => void handleGenerate()}>
              {path ? 'Tạo lại đề xuất' : 'Tạo đề xuất AI'}
            </Button>
          </div>

          {path ? (
            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <dt className="text-xs text-gray-500">Ngày tạo</dt>
                <dd className="mt-1 font-semibold text-gray-900">{formatStudentLearningDate(path.generatedAt)}</dd>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <dt className="text-xs text-gray-500">Nguồn phân tích</dt>
                <dd className="mt-1 font-semibold text-gray-900">{path.source || 'Chưa có'}</dd>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <dt className="text-xs text-gray-500">Số khóa học đề xuất</dt>
                <dd className="mt-1 font-semibold text-gray-900">{sortedItems.length}</dd>
              </div>
            </dl>
          ) : null}
        </div>
      </section>

      {error ? (
        <div role="alert">
          <Alert>{error}</Alert>
        </div>
      ) : null}
      {info ? (
        <div role="alert">
          <Alert variant="info">{info}</Alert>
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : path === null ? (
        <section className="rounded-2xl border border-dashed border-indigo-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Chưa có khóa học AI đề xuất</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Nếu bạn đã hoàn thành hoặc bỏ qua bài kiểm tra đầu vào, hãy tạo đề xuất. Nếu chưa, hãy làm bài kiểm tra để AI có dữ liệu chính xác hơn.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Button loading={generating} disabled={generating} onClick={() => void handleGenerate()}>
              Tạo đề xuất AI
            </Button>
            <Link
              to="/student/placement-test"
              className="inline-flex items-center justify-center rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300"
            >
              Làm bài kiểm tra đầu vào
            </Link>
          </div>
        </section>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Điểm yếu AI phát hiện</p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900">Nên tập trung cải thiện</h2>
            {path.weaknesses.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {path.weaknesses.map((weakness) => (
                  <span key={weakness} className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700">
                    {weakness}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-gray-600">AI chưa ghi nhận điểm yếu cụ thể. Bạn vẫn có thể tham khảo các khóa học phù hợp bên dưới.</p>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Thứ tự đề xuất</p>
              <h2 className="mt-1 text-xl font-semibold text-gray-900">Khóa học nên bắt đầu</h2>
            </div>

            {sortedItems.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm leading-6 text-gray-600">Danh sách hiện chưa có khóa học đề xuất. Hãy tạo lại sau khi có thêm dữ liệu học tập.</p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {sortedItems.map((item) => {
                  const scorePercent = formatScore(item.score)
                  const actionTo = item.enrolled ? '/student/enrollments' : `/student/courses/${item.courseId}`
                  const actionLabel = item.enrolled && item.enrollmentStatus === 'ACTIVE' ? 'Tiếp tục khóa học' : item.enrolled ? 'Xem khóa đã đăng ký' : 'Xem khóa học'

                  return (
                    <article key={item.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-200">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">#{item.sequenceOrder}</span>
                            <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">{scorePercent}% phù hợp</span>
                            {item.enrolled ? <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">Đã đăng ký</span> : null}
                          </div>
                          <h3 className="mt-3 text-lg font-semibold text-gray-900">{item.courseTitle}</h3>
                          <p className="mt-1 line-clamp-3 text-sm text-gray-600">{item.description ?? 'Chưa có mô tả.'}</p>
                          <p className="mt-2 text-xs font-medium text-gray-500">Giảng viên: {item.teacherName}</p>
                        </div>
                        <div className="shrink-0 rounded-xl bg-violet-50 px-3 py-2 text-center">
                          <p className="text-xs font-medium text-violet-600">Điểm AI</p>
                          <p className="text-lg font-bold text-violet-800">{scorePercent}%</p>
                        </div>
                      </div>

                      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl bg-gray-50 p-3">
                          <dt className="text-xs text-gray-500">Trình độ</dt>
                          <dd className="mt-1 font-semibold text-gray-900">{item.level}</dd>
                        </div>
                        <div className="rounded-xl bg-gray-50 p-3">
                          <dt className="text-xs text-gray-500">Loại khóa học</dt>
                          <dd className="mt-1 font-semibold text-gray-900">{getCourseTypeLabel(item.type)}</dd>
                        </div>
                      </dl>

                      <p className="mt-4 rounded-xl bg-gray-50 p-3 text-sm leading-6 text-gray-700">
                        {item.reason || 'AI đề xuất khóa học này dựa trên kết quả kiểm tra đầu vào và dữ liệu học tập hiện có.'}
                      </p>

                      <Link
                        to={actionTo}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      >
                        {actionLabel}
                      </Link>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
