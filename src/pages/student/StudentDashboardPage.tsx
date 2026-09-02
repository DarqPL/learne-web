import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { getApiErrorMessage } from '../../lib/api/client'
import { generateStudentLearningPath, getNextLessonRecommendation } from '../../lib/api/studentLearningApi'
import type { NextLessonRecommendation } from '../../lib/api/types'
import { useAuth } from '../../lib/auth/auth-context'

function formatScore(value: number) {
  if (!Number.isFinite(value)) return 0
  const percent = value <= 1 ? value * 100 : value
  return Math.min(100, Math.max(0, Math.round(percent)))
}

export function StudentDashboardPage() {
  const { user } = useAuth()
  const mountedRef = useRef(false)
  const [recommendation, setRecommendation] = useState<NextLessonRecommendation | null>(null)
  const [loadingRecommendation, setLoadingRecommendation] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  async function loadNextRecommendation() {
    setLoadingRecommendation(true)
    try {
      const response = await getNextLessonRecommendation()
      if (!mountedRef.current) return
      setRecommendation(response.data ?? null)
    } catch {
      if (!mountedRef.current) return
      setRecommendation(null)
    } finally {
      if (mountedRef.current) setLoadingRecommendation(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    mountedRef.current = true

    void (async () => {
      setLoadingRecommendation(true)
      try {
        const response = await getNextLessonRecommendation()
        if (cancelled) return
        setRecommendation(response.data ?? null)
      } catch {
        if (cancelled) return
        setRecommendation(null)
      } finally {
        if (!cancelled) setLoadingRecommendation(false)
      }
    })()

    return () => {
      cancelled = true
      mountedRef.current = false
    }
  }, [])

  async function handleGenerateLearningPath() {
    if (generating) return

    setGenerating(true)
    setGenerationError(null)
    try {
      await generateStudentLearningPath({ maxItems: 8 })
      if (!mountedRef.current) return
      await loadNextRecommendation()
    } catch (err) {
      if (!mountedRef.current) return
      setGenerationError(getApiErrorMessage(err, 'AI đang tạm thời chưa sẵn sàng. Vui lòng thử lại sau.'))
    } finally {
      if (mountedRef.current) setGenerating(false)
    }
  }

  const scorePercent = recommendation ? formatScore(recommendation.score) : null

  return (
    <div className="space-y-6">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Dashboard Học viên</h1>
      <p className="text-gray-600">
        Chào mừng {user?.fullName}! Khám phá khóa học đã được duyệt và tiếp tục tiến độ học tập của bạn.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-200" to="/student/courses">
          <h2 className="font-semibold text-gray-900">Khám phá khóa học</h2>
          <p className="mt-2 text-sm text-gray-600">Xem các khóa học đã được duyệt và đăng ký học.</p>
        </Link>
        <Link className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-200" to="/student/enrollments">
          <h2 className="font-semibold text-gray-900">Khóa đã đăng ký</h2>
          <p className="mt-2 text-sm text-gray-600">Theo dõi tiến độ và tiếp tục bài học đang học.</p>
        </Link>
      </div>

      <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                AI đề xuất
              </span>
              <h2 className="mt-3 text-xl font-semibold text-gray-900">Bài học nên học tiếp</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                AI ưu tiên bài học phù hợp với lộ trình hiện tại để bạn tiếp tục đúng phần cần cải thiện nhất.
              </p>
            </div>
            <Link
              to="/student/learning-path"
              className="inline-flex items-center justify-center rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              Xem lộ trình AI
            </Link>
          </div>

          {generationError ? (
            <div className="mt-5" role="alert">
              <Alert>{generationError}</Alert>
            </div>
          ) : null}

          {loadingRecommendation ? (
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-indigo-100 bg-white p-4 text-sm text-indigo-700">
              <Spinner />
              Đang tìm bài học phù hợp...
            </div>
          ) : recommendation && scorePercent !== null ? (
            <article className="mt-6 rounded-2xl border border-white bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">AI match</span>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{scorePercent}% phù hợp</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-gray-900">{recommendation.lessonTitle}</h3>
                  <p className="mt-1 text-sm text-gray-600">{recommendation.courseTitle}</p>
                  <p className="mt-1 text-xs font-medium text-gray-500">Giảng viên: {recommendation.teacherName}</p>
                </div>
                <div className="shrink-0 rounded-xl bg-violet-50 px-4 py-3 text-center">
                  <p className="text-xs font-medium text-violet-600">Điểm AI</p>
                  <p className="text-2xl font-bold text-violet-800">{scorePercent}%</p>
                </div>
              </div>

              <p className="mt-4 rounded-xl bg-gray-50 p-3 text-sm leading-6 text-gray-700">
                {recommendation.reason || 'AI đề xuất bài học này dựa trên tiến độ học tập gần đây.'}
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={`/student/enrollments/${recommendation.enrollmentId}/lessons/${recommendation.lessonId}`}
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  Học bài này
                </Link>
                <Link
                  to="/student/learning-path"
                  className="inline-flex items-center justify-center rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  Xem toàn bộ lộ trình
                </Link>
              </div>
            </article>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-indigo-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900">Chưa có đề xuất tiếp theo</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Tạo lộ trình AI để hệ thống chọn bài học phù hợp với kết quả học tập gần đây của bạn.
              </p>
              <Button className="mt-4" loading={generating} disabled={generating} onClick={() => void handleGenerateLearningPath()}>
                Tạo lộ trình AI
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
