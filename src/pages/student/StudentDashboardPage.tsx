import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { getApiErrorMessage } from '../../lib/api/client'
import { getCurrentCourseRecommendations, getPlacementStatus, skipPlacement } from '../../lib/api/studentLearningApi'
import type { CourseRecommendationPath, PlacementStatus } from '../../lib/api/types'
import { useAuth } from '../../lib/auth/auth-context'

export function StudentDashboardPage() {
  const { user } = useAuth()
  const mountedRef = useRef(false)
  const [placementStatus, setPlacementStatus] = useState<PlacementStatus | null>(null)
  const [recommendations, setRecommendations] = useState<CourseRecommendationPath | null>(null)
  const [loadingAiCard, setLoadingAiCard] = useState(true)
  const [skipping, setSkipping] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)

  useEffect(() => {
    mountedRef.current = true
    void Promise.allSettled([getPlacementStatus(), getCurrentCourseRecommendations()])
      .then(([statusResult, recommendationsResult]) => {
        if (!mountedRef.current) return

        if (statusResult.status === 'fulfilled') {
          setPlacementStatus(statusResult.value.data)
        } else {
          setPlacementStatus(null)
        }

        setRecommendations(recommendationsResult.status === 'fulfilled' ? recommendationsResult.value.data : null)
      })
      .finally(() => {
        if (mountedRef.current) setLoadingAiCard(false)
      })

    return () => {
      mountedRef.current = false
    }
  }, [])

  async function handleSkipPlacement() {
    if (skipping) return

    setSkipping(true)
    setCardError(null)
    try {
      const response = await skipPlacement()
      if (!mountedRef.current) return
      setPlacementStatus(response.data)
    } catch (err) {
      if (!mountedRef.current) return
      setCardError(getApiErrorMessage(err, 'Không thể bỏ qua bài kiểm tra đầu vào. Vui lòng thử lại sau.'))
    } finally {
      if (mountedRef.current) setSkipping(false)
    }
  }

  const recommendationCount = recommendations?.items.length ?? 0
  const shouldTakePlacement = placementStatus === null || (!placementStatus.placementCompleted && !placementStatus.skipped)

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
              <h2 className="mt-3 text-xl font-semibold text-gray-900">Khóa học phù hợp với bạn</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                Làm bài kiểm tra đầu vào để AI hiểu trình độ và đề xuất khóa học nên bắt đầu trước.
              </p>
            </div>
            <Link
              to="/student/course-recommendations"
              className="inline-flex items-center justify-center rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              AI đề xuất khóa học
            </Link>
          </div>

          {cardError ? (
            <div className="mt-5" role="alert">
              <Alert>{cardError}</Alert>
            </div>
          ) : null}

          {loadingAiCard ? (
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-indigo-100 bg-white p-4 text-sm text-indigo-700">
              <Spinner />
              Đang kiểm tra dữ liệu cá nhân hóa...
            </div>
          ) : shouldTakePlacement ? (
            <div className="mt-6 rounded-2xl border border-dashed border-indigo-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900">Bắt đầu bằng bài kiểm tra đầu vào</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Hoàn thành 20 câu hỏi để AI xác định điểm mạnh, điểm yếu và đề xuất khóa học phù hợp nhất với trình độ hiện tại.
              </p>
              {placementStatus?.reason ? <p className="mt-2 text-xs font-medium text-indigo-700">{placementStatus.reason}</p> : null}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/student/placement-test"
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  Làm bài kiểm tra đầu vào
                </Link>
                <Button variant="secondary" loading={skipping} disabled={skipping} onClick={() => void handleSkipPlacement()}>
                  Bỏ qua
                </Button>
              </div>
            </div>
          ) : recommendationCount > 0 ? (
            <article className="mt-6 rounded-2xl border border-white bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">AI match</span>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{recommendationCount} khóa học</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-gray-900">Khóa học AI đề xuất đã sẵn sàng</h3>
                  <p className="mt-1 text-sm text-gray-600">Xem danh sách khóa học được xếp theo mức phù hợp với điểm yếu của bạn.</p>
                </div>
                <div className="shrink-0 rounded-xl bg-violet-50 px-4 py-3 text-center">
                  <p className="text-xs font-medium text-violet-600">Đề xuất</p>
                  <p className="text-2xl font-bold text-violet-800">{recommendationCount}</p>
                </div>
              </div>

              <p className="mt-4 rounded-xl bg-gray-50 p-3 text-sm leading-6 text-gray-700">
                {recommendations?.weaknesses.length
                  ? `AI phát hiện bạn nên tập trung: ${recommendations.weaknesses.join(', ')}.`
                  : 'AI đã phân tích dữ liệu hiện có để đề xuất khóa học phù hợp.'}
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/student/course-recommendations"
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  Xem khóa học AI đề xuất
                </Link>
                <Link
                  to="/student/courses"
                  className="inline-flex items-center justify-center rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  Khám phá khóa học
                </Link>
              </div>
            </article>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-indigo-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900">Chưa có khóa học AI đề xuất</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Bạn có thể xem trang đề xuất để tạo danh sách khóa học cá nhân hóa, hoặc khám phá toàn bộ khóa học đã duyệt.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/student/course-recommendations"
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  Xem khóa học AI đề xuất
                </Link>
                <Link
                  to="/student/courses"
                  className="inline-flex items-center justify-center rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  Khám phá khóa học
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
