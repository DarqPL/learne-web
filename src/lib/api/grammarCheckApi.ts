import { http } from './client'
import type { GrammarCheckPage, GrammarCheckResult, SubmitGrammarCheckRequest } from './types'

const base = '/api/grammar-checks'

export function submitGrammarCheck(request: SubmitGrammarCheckRequest) {
  return http.post<GrammarCheckResult>(base, request)
}

export function listGrammarChecks(params: { page?: number; size?: number } = { page: 0, size: 10 }) {
  return http.get<GrammarCheckPage>(base, { params })
}

export function getGrammarCheck(checkId: number) {
  return http.get<GrammarCheckResult>(`${base}/${checkId}`)
}
