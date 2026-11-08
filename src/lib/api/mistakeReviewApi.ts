import { http } from './client'
import type {
  CursorPage,
  MistakeReviewCreateResponse,
  MistakeReviewQuestion,
  MistakeReviewResult,
  MistakeReviewSessionResponse,
  MistakeReviewSubmitRequest,
} from './types'

const base = '/api/student/mistake-review'

export interface MistakeReviewQuestionFilters {
  size?: number
  cursor?: string
}

export function listMistakeReviewQuestions(params?: MistakeReviewQuestionFilters) {
  return http.get<CursorPage<MistakeReviewQuestion>>(`${base}/questions`, { params })
}

export function createMistakeReviewSession() {
  return http.post<MistakeReviewCreateResponse>(`${base}/sessions`)
}

export function getMistakeReviewSession(sessionId: number) {
  return http.get<MistakeReviewSessionResponse>(`${base}/sessions/${sessionId}`)
}

export function submitMistakeReviewSession(sessionId: number, request: MistakeReviewSubmitRequest) {
  return http.post<MistakeReviewResult>(`${base}/sessions/${sessionId}/submit`, request)
}
