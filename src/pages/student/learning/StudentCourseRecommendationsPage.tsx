import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bot, CalendarClock, Info, ListChecks, Loader2, Sparkles, XCircle } from 'lucide-react'
import { getApiErrorMessage } from '../../../lib/api/client'
import { generateCourseRecommendations, getCurrentCourseRecommendations } from '../../../lib/api/studentLearningApi'
import type { CourseRecommendationPath } from '../../../lib/api/types'
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
import { Card, CardContent, CardFooter, CardHeader } from '../../../components/shadcn/ui/card'
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
    <div className="flex min-w-0 flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/student/courses">Khóa học</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>AI đề xuất</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">Khóa học AI đề xuất</h1>
            <p className="mt-1 text-base leading-7 text-gray-600">
              AI phân tích bài kiểm tra đầu vào và dữ liệu học tập để ưu tiên khóa học phù hợp với kỹ năng cần cải thiện.
            </p>
            {path ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                  <CalendarClock aria-hidden="true" />
                  <span>Ngày tạo {formatStudentLearningDate(path.generatedAt)}</span>
                </Badge>
                <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700">
                  <Bot aria-hidden="true" />
                  <span>Nguồn phân tích {path.source || 'Chưa có'}</span>
                </Badge>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  <ListChecks aria-hidden="true" />
                  <span>{sortedItems.length} khóa học đề xuất</span>
                </Badge>
              </div>
            ) : null}
          </div>
          <Button loading={generating} disabled={loading || generating} onClick={() => void handleGenerate()} className="shrink-0">
            {path ? 'Tạo lại đề xuất' : 'Tạo đề xuất AI'}
          </Button>
        </div>
      </section>

      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <XCircle aria-hidden="true" data-icon="inline-start" />
          <AlertTitle>Đã xảy ra lỗi</AlertTitle>
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      ) : null}
      {info ? (
        <Alert className="border-indigo-200 bg-indigo-50 text-indigo-800">
          <Info aria-hidden="true" data-icon="inline-start" />
          <AlertTitle>Thông tin đề xuất</AlertTitle>
          <AlertDescription className="text-indigo-700">{info}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <Card className="border-dashed border-indigo-200 bg-white/90 shadow-sm">
          <CardContent className="flex items-center gap-4 p-6 text-gray-600">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Loader2 aria-hidden="true" className="size-5 animate-spin" />
            </span>
            <div>
              <p className="font-medium text-gray-900">Đang tải đề xuất khóa học</p>
              <p className="text-sm text-gray-500">Hệ thống đang lấy các khóa học AI đề xuất cho bạn.</p>
            </div>
          </CardContent>
        </Card>
      ) : path === null ? (
        <Card className="border-dashed border-gray-200 bg-white text-center shadow-sm">
          <CardContent className="flex flex-col items-center gap-0 p-8">
            <h2 className="mt-4 text-lg font-semibold text-gray-950">Chưa có khóa học AI đề xuất</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-gray-600">
              Nếu bạn đã hoàn thành hoặc bỏ qua bài kiểm tra đầu vào, hãy tạo đề xuất. Nếu chưa, hãy làm bài kiểm tra để AI có dữ liệu chính xác hơn.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <Button loading={generating} disabled={generating} onClick={() => void handleGenerate()}>
                Tạo đề xuất AI
              </Button>
              <Button variant="outline" asChild>
                <Link to="/student/placement-test">Làm bài kiểm tra đầu vào</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-4">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-violet-600 text-white">
                <Sparkles aria-hidden="true" className="size-4" />
              </span>
              <h2 className="text-base font-semibold text-gray-950">Nên tập trung luyện tập</h2>
            </div>
            {path.weaknesses.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {path.weaknesses.map((weakness) => (
                  <Badge key={weakness} variant="outline" className="border-violet-200 bg-white/80 text-violet-700">
                    {weakness}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-gray-600">AI chưa ghi nhận điểm yếu cụ thể. Bạn vẫn có thể tham khảo các khóa học phù hợp bên dưới.</p>
            )}
            <p className="text-xs leading-5 text-gray-500">Dựa trên {path.source || 'kết quả học tập gần đây'}.</p>
          </div>

          <section className="flex min-w-0 flex-col gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Thứ tự đề xuất</p>
              <h2 className="mt-1 text-xl font-semibold text-gray-950">Khóa học nên bắt đầu</h2>
            </div>

            {sortedItems.length === 0 ? (
              <Card className="border-dashed border-gray-200 bg-white shadow-sm">
                <CardContent className="p-6">
                  <p className="text-sm leading-6 text-gray-600">Danh sách hiện chưa có khóa học đề xuất. Hãy tạo lại sau khi có thêm dữ liệu học tập.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid min-w-0 items-stretch gap-5 sm:grid-cols-2">
                {sortedItems.map((item) => {
                  const scorePercent = formatScore(item.score)

                  return (
                    <Card
                      key={item.id}
                      className="h-full flex flex-col gap-2.5 overflow-hidden border-gray-200 bg-white p-4 transition-colors hover:border-indigo-200 hover:shadow-sm"
                    >
                      <CardHeader className="flex flex-col gap-2.5 p-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                            {item.level}
                          </Badge>
                          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                            {getCourseTypeLabel(item.type)}
                          </Badge>
                          {item.enrolled ? <Badge className="bg-emerald-600 text-white">Đã đăng ký</Badge> : null}
                        </div>
                        <div className="flex min-w-0 flex-col gap-1">
                          <h3 className="text-lg font-semibold tracking-tight text-gray-950">{item.courseTitle}</h3>
                          <p className="text-xs leading-5 text-gray-500">Giảng viên: {item.teacherName}</p>
                        </div>
                        <Badge variant="outline" className="w-fit border-violet-200 bg-violet-50 text-violet-700">
                          <span>Độ phù hợp</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-lg font-bold text-violet-700">{scorePercent}%</span>
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-0">
                        <p className="line-clamp-2 text-sm leading-6 text-gray-600">
                          {item.reason || 'AI đề xuất khóa học này dựa trên kết quả kiểm tra đầu vào và dữ liệu học tập hiện có.'}
                        </p>
                      </CardContent>
                      <CardFooter className="mt-auto p-0 pt-1">
                        <Button asChild className="w-full">
                          <Link to={`/student/courses/${item.courseId}`}>
                            Xem khóa học
                            <ArrowRight aria-hidden="true" data-icon="inline-end" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
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
