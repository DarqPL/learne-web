import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../lib/api/client'
import { getStudentQuizAttempt } from '../../../lib/api/studentLearningApi'
import type { StudentQuizAnswerResult, StudentQuizAttemptResult } from '../../../lib/api/types'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { studentQuestionTypeLabels } from './studentLearningLabels'
import { formatScorePercent, getResultTone } from './studentQuizUtils'

function parsePositiveInteger(value: string | undefined) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function getProgressPercent(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

function getAnswerDisplay(answer: StudentQuizAnswerResult) {
  if (answer.selectedOptionText?.trim()) return answer.selectedOptionText
  if (answer.selectedOptionId !== null) return `Lựa chọn #${answer.selectedOptionId}`
  if (answer.answerText?.trim()) return answer.answerText
  return 'Không có câu trả lời'
}

function getCorrectAnswerDisplay(answer: StudentQuizAnswerResult) {
  if (answer.correctOptionText?.trim()) return answer.correctOptionText
  if (answer.correctAnswer?.trim()) return answer.correctAnswer
  if (answer.correctOptionId !== null) return `Lựa chọn #${answer.correctOptionId}`
  return 'Không có đáp án hiển thị'
}

function StatCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      {detail ? <p className="mt-1 text-xs font-medium text-gray-500">{detail}</p> : null}
    </div>
  )
}

export function StudentQuizResultPage() {
  const navigate = useNavigate()
  const { attemptId: attemptIdParam } = useParams()
  const attemptId = parsePositiveInteger(attemptIdParam)
  const [result, setResult] = useState<StudentQuizAttemptResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    if (attemptId === null) {
      return () => {
        cancelled = true
      }
    }

    void (async () => {
      setResult(null)
      setError(null)
      try {
        const response = await getStudentQuizAttempt(attemptId)
        if (!cancelled) setResult(response.data)
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải kết quả bài học.'))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [attemptId])

  if (attemptId === null) {
    return (
      <div role="alert">
        <Alert>Không tìm thấy kết quả bài học.</Alert>
      </div>
    )
  }

  if (error && !result) {
    return (
      <div role="alert">
        <Alert>{error}</Alert>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  const tone = getResultTone(result.passed)
  const progressPercent = getProgressPercent(result.progress.enrollmentProgressPercent)

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Kết quả bài học</p>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">{formatScorePercent(result.scorePercent)}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className={`rounded-full px-3 py-1 ${tone.className}`}>{tone.label}</span>
                <span className="rounded-full bg-white px-3 py-1 text-gray-700 shadow-sm">Lượt làm #{result.attemptId}</span>
                <span className="rounded-full bg-white px-3 py-1 text-gray-700 shadow-sm">Bài học #{result.lessonId}</span>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600">{tone.message}</p>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
              <Button variant="secondary" onClick={() => navigate(`/student/enrollments/${result.enrollmentId}/lessons/${result.lessonId}`)}>
                Quay lại bài học
              </Button>
              <Button onClick={() => navigate(`/student/enrollments/${result.enrollmentId}/lessons/${result.lessonId}/quiz`)}>Làm lại quiz</Button>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-gray-700">Tiến độ khóa học</span>
              <span className="font-semibold text-gray-900">{progressPercent}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-white"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
              aria-label="Tiến độ khóa học sau khi nộp quiz"
            >
              <div className="h-full rounded-full bg-indigo-600" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="XP nhận được" value={result.earnedXp} detail="Từ lượt làm này" />
        <StatCard label="Tổng XP" value={result.stats.totalXp} detail="Tích lũy của bạn" />
        <StatCard label="Chuỗi hiện tại" value={result.stats.currentStreakDays} detail="ngày liên tiếp" />
        <StatCard label="Chuỗi dài nhất" value={result.stats.longestStreakDays} detail="ngày" />
        <StatCard label="Tiến độ" value={`${progressPercent}%`} detail="khóa học" />
      </div>

      {result.passed && result.earnedXp === 0 ? (
        <div role="alert">
          <Alert variant="info">XP chỉ được trao cho lần đầu tiên bạn vượt qua bài học thành công.</Alert>
        </div>
      ) : null}

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Xem lại câu trả lời</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">Chi tiết chấm điểm</h2>
          </div>
          <span className="text-sm font-medium text-gray-500">{result.answers.length} câu hỏi</span>
        </div>

        <div className="mt-6 space-y-4">
          {result.answers.length === 0 ? (
            <p className="text-sm text-gray-600">Chưa có câu trả lời nào để hiển thị.</p>
          ) : (
            result.answers.map((answer, index) => {
              const answerDisplay = getAnswerDisplay(answer)
              const correctAnswerDisplay = getCorrectAnswerDisplay(answer)
              return (
                <article key={answer.questionId} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className={answer.correct ? 'rounded-full bg-green-100 px-3 py-1 text-green-700' : 'rounded-full bg-red-100 px-3 py-1 text-red-700'}>
                          {answer.correct ? 'Đúng' : 'Chưa đúng'}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-gray-700">{studentQuestionTypeLabels[answer.type]}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-gray-700">Câu {index + 1}</span>
                      </div>
                      <h3 className="mt-4 whitespace-pre-wrap text-lg font-semibold text-gray-900">{answer.questionText}</h3>
                    </div>
                    <div className="shrink-0 rounded-xl bg-white px-3 py-2 text-right shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Điểm</p>
                      <p className="text-sm font-bold text-gray-900">{formatScorePercent(answer.scorePercent)}</p>
                      <p className="text-xs font-medium text-gray-500">+{answer.earnedXp} XP</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Câu trả lời của bạn</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-gray-900">{answerDisplay}</p>
                    </div>
                    <div className="rounded-xl bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Đáp án đúng</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-gray-900">{correctAnswerDisplay}</p>
                    </div>
                  </div>

                  {answer.feedback || answer.explanation ? (
                    <div className="mt-4 space-y-3">
                      {answer.feedback ? (
                        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Phản hồi</p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-indigo-900">{answer.feedback}</p>
                        </div>
                      ) : null}
                      {answer.explanation ? (
                        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Giải thích</p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-900">{answer.explanation}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
