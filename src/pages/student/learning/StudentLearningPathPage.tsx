import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Info, Loader2, XCircle } from 'lucide-react'
import { getApiErrorMessage } from '../../../lib/api/client'
import { generateStudentLearningPath, getCurrentStudentLearningPath } from '../../../lib/api/studentLearningApi'
import type { StudentLearningPath } from '../../../lib/api/types'
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
            <BreadcrumbPage>Lộ trình học</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">Lộ trình học cá nhân</h1>
            <p className="mt-1 text-base leading-7 text-gray-600">
              AI phân tích kết quả học tập để ưu tiên các bài học nên ôn lại, giúp bạn tập trung vào kỹ năng còn yếu trước khi tiếp tục.
            </p>
            {path ? (
              <p className="mt-2 text-xs leading-5 text-gray-500">
                Ngày tạo {formatStudentLearningDate(path.generatedAt)} · Nguồn phân tích {path.source || 'Chưa có'} ·{' '}
                {sortedItems.length} bài đề xuất
              </p>
            ) : null}
          </div>
          <Button loading={generating} disabled={loading || generating} onClick={() => void handleGenerate()} className="shrink-0">
            {path ? 'Tạo lại lộ trình' : 'Tạo lộ trình AI'}
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
          <AlertTitle>Thông tin lộ trình học</AlertTitle>
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
              <p className="font-medium text-gray-900">Đang tải lộ trình học</p>
              <p className="text-sm text-gray-500">Hệ thống đang lấy các bài học AI đề xuất cho bạn.</p>
            </div>
          </CardContent>
        </Card>
      ) : path === null ? (
        <Card className="border-dashed border-gray-200 bg-white text-center shadow-sm">
          <CardContent className="flex flex-col items-center gap-0 p-8">
            <h2 className="mt-4 text-lg font-semibold text-gray-950">Chưa có lộ trình để hiển thị</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-gray-600">
              Khi bạn tạo lộ trình, các bài học ưu tiên sẽ xuất hiện tại đây.
            </p>
            <Button loading={generating} disabled={generating} onClick={() => void handleGenerate()} className="mt-5">
              Tạo lộ trình AI
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Điểm yếu AI phát hiện</p>
                <h2 className="mt-1 text-lg font-semibold text-gray-950">Nên tập trung luyện tập</h2>
              </div>
              {path.weaknesses.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {path.weaknesses.map((weakness) => (
                    <Badge key={weakness} variant="outline" className="border-violet-200 bg-violet-50 text-violet-700">
                      {weakness}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-gray-600">AI chưa ghi nhận điểm yếu cụ thể. Hãy tiếp tục làm quiz để dữ liệu đề xuất chính xác hơn.</p>
              )}
            </CardContent>
          </Card>

          <section className="flex min-w-0 flex-col gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Thứ tự đề xuất</p>
              <h2 className="mt-1 text-xl font-semibold text-gray-950">Bài học trong lộ trình</h2>
            </div>

            {sortedItems.length === 0 ? (
              <Card className="border-dashed border-gray-200 bg-white shadow-sm">
                <CardContent className="p-6">
                  <p className="text-sm leading-6 text-gray-600">Lộ trình hiện chưa có bài học đề xuất. Hãy tạo lại sau khi có thêm kết quả học tập.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid min-w-0 items-stretch gap-5 sm:grid-cols-2">
                {sortedItems.map((item) => {
                  const scorePercent = formatScore(item.score)

                  return (
                    <Card
                      key={item.id}
                      className="h-full flex flex-col gap-3 overflow-hidden border-gray-200 bg-white p-5 transition-colors hover:border-indigo-200 hover:shadow-sm"
                    >
                      <CardHeader className="flex flex-col gap-3 p-0">
                        <div className="flex flex-wrap gap-2">
                          {item.completed ? (
                            <Badge className="bg-emerald-600 text-white">Đã hoàn thành</Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                              Chưa hoàn thành
                            </Badge>
                          )}
                          <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700">
                            <span>Độ phù hợp</span>
                            <span aria-hidden="true">·</span>
                            <span>{scorePercent}%</span>
                          </Badge>
                        </div>
                        <div className="flex min-w-0 flex-col gap-1">
                          <h3 className="text-lg font-semibold tracking-tight text-gray-950">{item.lessonTitle}</h3>
                          <p className="text-sm text-gray-600">{item.courseTitle}</p>
                          <p className="text-xs leading-5 text-gray-500">Giảng viên: {item.teacherName}</p>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <p className="line-clamp-2 text-sm leading-6 text-gray-600">
                          {item.reason || 'AI đề xuất bài học này dựa trên tiến độ học tập gần đây.'}
                        </p>
                      </CardContent>
                      <CardFooter className="mt-auto p-0 pt-1">
                        {item.completed ? (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
                            Đã hoàn thành
                          </span>
                        ) : item.enrollmentId === null ? (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-400">
                            Chưa có enrollment hợp lệ
                          </span>
                        ) : (
                          <Link
                            to={`/student/enrollments/${item.enrollmentId}/lessons/${item.lessonId}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-700 transition-colors hover:text-indigo-800 [&_svg]:size-4"
                          >
                            Vào bài học
                            <ArrowRight aria-hidden="true" data-icon="inline-end" />
                          </Link>
                        )}
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
