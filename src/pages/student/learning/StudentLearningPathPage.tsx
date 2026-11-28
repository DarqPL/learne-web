import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarClock, Info, ListChecks,
Loader2, Sparkles, XCircle } from 'lucide-react'
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Lộ trình học cá nhân</h1>
            <p className="mt-1 text-base leading-7 text-muted-foreground">
              AI phân tích kết quả học tập để ưu tiên các bài học nên ôn lại, giúp bạn tập trung vào kỹ năng còn yếu trước khi tiếp tục.
            </p>
            {path ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <CalendarClock aria-hidden="true" />
                  <span>Ngày tạo {formatStudentLearningDate(path.generatedAt)}</span>
                </Badge>

                <Badge variant="success">
                  <ListChecks aria-hidden="true" />
                  <span>{sortedItems.length} bài đề xuất</span>
                </Badge>
              </div>
            ) : null}
          </div>
          <Button loading={generating} disabled={loading || generating} onClick={() => void handleGenerate()} className="shrink-0">
            {path ? 'Tạo lại lộ trình' : 'Tạo lộ trình AI'}
          </Button>
        </div>
      </section>

      {error ? (
        <Alert variant="destructive">
          <XCircle aria-hidden="true" data-icon="inline-start" />
          <AlertTitle>Đã xảy ra lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {info ? (
        <Alert variant="info">
          <Info aria-hidden="true" data-icon="inline-start" />
          <AlertTitle>Thông tin lộ trình học</AlertTitle>
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <Card className="border-dashed border-border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-6 text-muted-foreground">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Loader2 aria-hidden="true" className="size-5 animate-spin" />
            </span>
            <div>
              <p className="font-medium text-foreground">Đang tải lộ trình học</p>
              <p className="text-sm text-muted-foreground">Hệ thống đang lấy các bài học AI đề xuất cho bạn.</p>
            </div>
          </CardContent>
        </Card>
      ) : path === null ? (
        <Card className="border-dashed border-border bg-card text-center shadow-sm">
          <CardContent className="flex flex-col items-center gap-0 p-8">
            <h2 className="mt-4 text-lg font-semibold text-foreground">Chưa có lộ trình để hiển thị</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Khi bạn tạo lộ trình, các bài học ưu tiên sẽ xuất hiện tại đây.
            </p>
            <Button loading={generating} disabled={generating} onClick={() => void handleGenerate()} className="mt-5">
              Tạo lộ trình AI
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-info/30 bg-info-background p-4">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-info text-info-foreground">
                <Sparkles aria-hidden="true" className="size-4" />
              </span>
              <h2 className="text-base font-semibold text-foreground">Nên tập trung luyện tập</h2>
            </div>
            {path.weaknesses.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {path.weaknesses.map((weakness) => (
                  <Badge key={weakness} variant="taxonomy1">
                    {weakness}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">AI chưa ghi nhận điểm yếu cụ thể. Hãy tiếp tục làm quiz để dữ liệu đề xuất chính xác hơn.</p>
            )}
            <p className="text-xs leading-5 text-muted-foreground">Dựa trên {path.source || 'kết quả học tập gần đây'}.</p>
          </div>

          <section className="flex min-w-0 flex-col gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Thứ tự đề xuất</p>
              <h2 className="mt-1 text-xl font-semibold text-foreground">Bài học trong lộ trình</h2>
            </div>

            {sortedItems.length === 0 ? (
              <Card className="border-dashed border-border bg-card shadow-sm">
                <CardContent className="p-6">
                  <p className="text-sm leading-6 text-muted-foreground">Lộ trình hiện chưa có bài học đề xuất. Hãy tạo lại sau khi có thêm kết quả học tập.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid min-w-0 items-stretch gap-5 sm:grid-cols-2">
                {sortedItems.map((item) => {
                  const scorePercent = formatScore(item.score)

                  return (
                    <Card
                      key={item.id}
                      className="h-full flex flex-col gap-2.5 overflow-hidden border-border bg-card p-4 transition-colors hover:border-ring/50 hover:shadow-sm"
                    >
                      <CardHeader className="flex flex-col gap-2.5 p-0">
                        <div className="flex items-center justify-start gap-2">
                          {item.completed ? (
                            <Badge variant="success">Đã hoàn thành</Badge>
                          ) : (
                            <Badge variant="warning">
                              Chưa hoàn thành
                            </Badge>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-col gap-1">
                          <h3 className="text-lg font-semibold tracking-tight text-foreground">{item.lessonTitle}</h3>
                          <p className="text-sm text-muted-foreground">{item.courseTitle}</p>
                          <p className="text-xs leading-5 text-muted-foreground">Giảng viên: {item.teacherName}</p>
                        </div>
                        <Badge variant="info" className="w-fit">
                          <span>Độ phù hợp</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-lg font-bold text-info-foreground">{scorePercent}%</span>
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-0">
                        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {item.reason || 'AI đề xuất bài học này dựa trên tiến độ học tập gần đây.'}
                        </p>
                      </CardContent>
                      <CardFooter className="mt-auto p-0 pt-1">
                        {item.completed ? (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
                            Đã hoàn thành
                          </span>
                        ) : item.enrollmentId === null ? (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
                            Chưa có enrollment hợp lệ
                          </span>
                        ) : (
                          <Button asChild className="w-full">
                            <Link to={`/student/enrollments/${item.enrollmentId}/lessons/${item.lessonId}`}>
                              Vào bài học
                              <ArrowRight aria-hidden="true" data-icon="inline-end" />
                            </Link>
                          </Button>
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
