import { http } from './client'
import type {
  AiConversationDetail,
  AiConversationPage,
  AiConversationSummary,
  CreateAiConversationRequest,
  SendAiTutorMessageRequest,
  SendAiTutorMessageResponse,
} from './types'

const base = '/api/ai-tutor/conversations'

export function createAiConversation(request: CreateAiConversationRequest) {
  return http.post<AiConversationSummary>(base, request)
}

export function listAiConversations(params: { page?: number; size?: number } = { page: 0, size: 3 }) {
  return http.get<AiConversationPage>(base, { params })
}

export function getAiConversation(conversationId: number) {
  return http.get<AiConversationDetail>(`${base}/${conversationId}`)
}

export function sendAiTutorMessage(conversationId: number, request: SendAiTutorMessageRequest) {
  return http.post<SendAiTutorMessageResponse>(`${base}/${conversationId}/messages`, request)
}

export function archiveAiConversation(conversationId: number) {
  return http.post<AiConversationSummary>(`${base}/${conversationId}/archive`, {})
}
