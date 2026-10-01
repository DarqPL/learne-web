import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../../lib/api/client'
import { generateStudentLearningPath, getCurrentStudentLearningPath } from '../../../lib/api/studentLearningApi'
import type { StudentLearningPath } from '../../../lib/api/types'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { formatStudentLearningDate } from './studentLearningUtils'

function formatScore(value: number) {
  if (!Number.isFinite(value)) return 0
  const percent = value <= 1 ? value * 100 : value
  return Math.min(100, Math.max(0, Math.round(percent)))
}

function isCurrentPathMissingError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404
}

export function StudentLearningPathPage() {
  const mountedRef = useRef(false)
  const [path, setPath] = useState<StudentLearningPath | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    mountedRef.current = true

    void (async () => {
      setLoading(true)
      setError(null)
      setInfo(null)
      try {
        const response = await getCurrentStudentLearningPath()
        if (cancelled) return
        setPath(response.data)
      } catch (err) {
        if (cancelled) return
        setPath(null)
        if (isCurrentPathMissingError(err)) {
          setInfo('Bạn chưa có lộ trình học AI. Tạo lộ trình để hệ thống đề xuất bài học phù hợp với điểm yếu hiện tại.')
        } else {
          setError(getApiErrorMessage(err, 'Không thể tải lộ trình học AI.'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
      mountedRef.current = false
    }
  }, [])

  async function handleGenerate() {
    if (generating) return

    setGenerating(true)
    setError(null)
    setInfo(null)
    try {
      const response = await generateStudentLearningPath({ maxItems: 8 })
      if (!mountedRef.current) return
      setPath(response.data)
      setInfo('Lộ trình học AI đã được cập nhật.')
    } catch (err) {
      if (!mountedRef.current) return
      setError(getApiErrorMessage(err, 'Không thể tạo lộ trình học AI. Hãy thử lại sau.'))
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
                AI learning path
              </span>
              <h1 className="mt-4 text-3xl font-bold text-gray-900">Lộ trình học cá nhân</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
                AI phân tích kết quả học tập để ưu tiên các bài học nên ôn lại, giúp bạn tập trung vào kỹ năng còn yếu trước khi tiếp tục.
              </p>
            </div>

            <Button loading={generating} disabled={loading || generating} onClick={() => void handleGenerate()}>
              {path ? 'Tạo lại lộ trình' : 'Tạo lộ trình AI'}
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
                <dt className="text-xs text-gray-500">Số bài đề xuất</dt>
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
          <p className="text-sm leading-6 text-gray-600">Chưa có lộ trình để hiển thị. Khi bạn tạo lộ trình, các bài học ưu tiên sẽ xuất hiện tại đây.</p>
          <Button className="mt-5" loading={generating} disabled={generating} onClick={() => void handleGenerate()}>
            Tạo lộ trình AI
          </Button>
        </section>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Điểm yếu AI phát hiện</p>
                <h2 className="mt-1 text-lg font-semibold text-gray-900">Nên tập trung luyện tập</h2>
              </div>
            </div>
            {path.weaknesses.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {path.weaknesses.map((weakness) => (
                  <span key={weakness} className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700">
                    {weakness}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-gray-600">AI chưa ghi nhận điểm yếu cụ thể. Hãy tiếp tục làm quiz để dữ liệu đề xuất chính xác hơn.</p>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Thứ tự đề xuất</p>
              <h2 className="mt-1 text-xl font-semibold text-gray-900">Bài học trong lộ trình</h2>
            </div>

            {sortedItems.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm leading-6 text-gray-600">Lộ trình hiện chưa có bài học đề xuất. Hãy tạo lại sau khi có thêm kết quả học tập.</p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {sortedItems.map((item) => {
                  const scorePercent = formatScore(item.score)

                  return (
                    <article key={item.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-200">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {item.completed ? (
                              <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">Đã hoàn thành</span>
                            ) : (
                              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Chưa hoàn thành</span>
                            )}
                          </div>
                          <h3 className="mt-3 text-lg font-semibold text-gray-900">{item.lessonTitle}</h3>
                          <p className="mt-1 text-sm text-gray-600">{item.courseTitle}</p>
                          <p className="mt-1 text-xs font-medium text-gray-500">Giảng viên: {item.teacherName}</p>
                        </div>
                        <div className="shrink-0 rounded-xl bg-violet-50 px-3 py-2 text-center">
                          <p className="text-xs font-medium text-violet-600">Độ phù hợp</p>
                          <p className="text-lg font-bold text-violet-800">{scorePercent}%</p>
                        </div>
                      </div>

                      <p className="mt-4 rounded-xl bg-gray-50 p-3 text-sm leading-6 text-gray-700">{item.reason || 'AI đề xuất bài học này dựa trên tiến độ học tập gần đây.'}</p>

                      {item.completed ? (
                        <Button className="mt-4 w-full" variant="secondary" disabled>
                          Đã hoàn thành
                        </Button>
                      ) : item.enrollmentId === null ? (
                        <Button className="mt-4 w-full" variant="secondary" disabled>
                          Chưa có enrollment hợp lệ
                        </Button>
                      ) : (
                        <Link
                          to={`/student/enrollments/${item.enrollmentId}/lessons/${item.lessonId}`}
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        >
                          Vào bài học
                        </Link>
                      )}
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
