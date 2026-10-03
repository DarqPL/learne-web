import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StudentAiTutorPage } from './StudentAiTutorPage'
import {
  getAiConversation,
  listAiConversations,
} from '../../../lib/api/aiTutorApi'

vi.mock('../../../lib/api/aiTutorApi', () => ({
  archiveAiConversation: vi.fn(),
  createAiConversation: vi.fn(),
  getAiConversation: vi.fn(),
  listAiConversations: vi.fn(),
  sendAiTutorMessage: vi.fn(),
}))

const mockedListAiConversations = vi.mocked(listAiConversations)
const mockedGetAiConversation = vi.mocked(getAiConversation)

const summary = {
  id: 1,
  title: 'Test conversation',
  practiceType: 'FREE_CHAT',
  status: 'ACTIVE',
  messagePreview: 'Hello preview',
  lastMessageAt: '2026-09-01T10:00:00Z',
  cleanupWarnAt: '2026-10-01T10:00:00Z',
  archiveAfter: '2026-11-01T10:00:00Z',
  cleanupWarning: false,
}

const detail = {
  id: 1,
  title: 'Test conversation',
  practiceType: 'FREE_CHAT',
  status: 'ACTIVE',
  startedAt: '2026-09-01T09:00:00Z',
  lastMessageAt: '2026-09-01T10:00:00Z',
  cleanupWarnAt: '2026-10-01T10:00:00Z',
  archiveAfter: '2026-11-01T10:00:00Z',
  deleteAfter: null,
  cleanupWarning: false,
  messages: [
    {
      id: 10,
      senderType: 'USER',
      message: 'Hi',
      createdAt: '2026-09-01T10:00:00Z',
      feedback: null,
    },
    {
      id: 11,
      senderType: 'AI',
      message: 'Hello!',
      createdAt: '2026-09-01T10:01:00Z',
      feedback: null,
    },
  ],
}

// The page loads the conversation list and detail through two sequential awaits,
// which can exceed the 1s default wait under parallel test load.
const asyncTimeout = 5000

describe('StudentAiTutorPage chat focus', () => {
  function renderPage() {
    return render(
      <MemoryRouter>
        <StudentAiTutorPage />
      </MemoryRouter>,
    )
  }

  const originalScrollIntoView = HTMLElement.prototype.scrollIntoView
  const originalFocus = HTMLElement.prototype.focus
  let scrollIntoViewMock: ReturnType<typeof vi.fn>
  let focusMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockedListAiConversations.mockReset()
    mockedGetAiConversation.mockReset()
    mockedListAiConversations.mockResolvedValue({
      data: {
        content: [summary],
        page: 0,
        size: 3,
        totalElements: 1,
        totalPages: 1,
      },
    } as Awaited<ReturnType<typeof listAiConversations>>)
    mockedGetAiConversation.mockResolvedValue({
      data: detail,
    } as Awaited<ReturnType<typeof getAiConversation>>)

    scrollIntoViewMock = vi.fn()
    focusMock = vi.fn()
    HTMLElement.prototype.scrollIntoView =
      scrollIntoViewMock as unknown as typeof HTMLElement.prototype.scrollIntoView
    HTMLElement.prototype.focus =
      focusMock as unknown as typeof HTMLElement.prototype.focus
  })

  afterEach(() => {
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView
    HTMLElement.prototype.focus = originalFocus
  })

  it('scrolls to chat and focuses composer after selecting a conversation', async () => {
    renderPage()

    const conversationButton = await screen.findByRole(
      'button',
      { name: /Test conversation/i },
      { timeout: asyncTimeout },
    )
    fireEvent.click(conversationButton)

    await waitFor(
      () => {
        expect(mockedGetAiConversation).toHaveBeenCalledWith(1)
      },
      { timeout: asyncTimeout },
    )

    await waitFor(
      () => {
        expect(scrollIntoViewMock).toHaveBeenCalled()
      },
      { timeout: asyncTimeout },
    )
    await waitFor(
      () => {
        expect(focusMock).toHaveBeenCalled()
      },
      { timeout: asyncTimeout },
    )
  })

  it('shows breadcrumb Trang chu link to /student and AI Tutor page', async () => {
    renderPage()

    const breadcrumb = await screen.findByRole('navigation', { name: 'breadcrumb' }, { timeout: asyncTimeout })
    expect(breadcrumb).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Trang chủ' })).toHaveAttribute('href', '/student')
    expect(screen.getByText('AI Tutor')).toBeInTheDocument()
  })

  it('bounds message list inside scrollable area so page does not stretch', async () => {
    renderPage()

    const conversationButton = await screen.findByRole(
      'button',
      { name: /Test conversation/i },
      { timeout: asyncTimeout },
    )
    fireEvent.click(conversationButton)

    const aiMessage = await screen.findByText('Hello!', undefined, { timeout: asyncTimeout })
    expect(aiMessage).toBeInTheDocument()

    const scroller = screen.getByTestId('ai-tutor-message-scroller')
    expect(scroller.className).toMatch(/overflow-y-auto/)
    expect(scroller.className).toMatch(/max-h-|h-\[/)
  })
})
