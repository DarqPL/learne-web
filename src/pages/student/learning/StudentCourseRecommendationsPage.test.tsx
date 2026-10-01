import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StudentCourseRecommendationsPage } from './StudentCourseRecommendationsPage'
import {
  generateCourseRecommendations,
  getCurrentCourseRecommendations,
} from '../../../lib/api/studentLearningApi'
import type { CourseRecommendationPath } from '../../../lib/api/types'

vi.mock('../../../lib/api/studentLearningApi', () => ({
  generateCourseRecommendations: vi.fn(),
  getCurrentCourseRecommendations: vi.fn(),
}))

const mockedGetCurrent = vi.mocked(getCurrentCourseRecommendations)
const mockedGenerate = vi.mocked(generateCourseRecommendations)

function apiResponse(data: CourseRecommendationPath): Awaited<ReturnType<typeof getCurrentCourseRecommendations>> {
  return { data } as Awaited<ReturnType<typeof getCurrentCourseRecommendations>>
}

function makePath(): CourseRecommendationPath {
  return {
    id: 1,
    status: 'READY',
    generatedAt: '2026-01-01T00:00:00.000Z',
    source: 'AI placement test',
    weaknesses: ['Past simple'],
    items: [
      {
        id: 10,
        courseId: 100,
        courseTitle: 'Course Alpha Name',
        description: 'Alpha description.',
        type: 'GRAMMAR',
        level: 'A1',
        teacherId: 7,
        teacherName: 'Teacher One',
        enrolled: false,
        enrollmentStatus: null,
        sequenceOrder: 1,
        reason: 'AI suggests this course for past simple.',
        score: 0.85,
      },
    ],
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <StudentCourseRecommendationsPage />
    </MemoryRouter>,
  )
}

describe('StudentCourseRecommendationsPage learning-path sync', () => {
  beforeEach(() => {
    mockedGetCurrent.mockReset()
    mockedGenerate.mockReset()
  })

  it('shows breadcrumb Trang chu / AI de xuat with slim hero', async () => {
    mockedGetCurrent.mockResolvedValue(apiResponse(makePath()))

    renderPage()

    const breadcrumb = await screen.findByRole('navigation', { name: 'breadcrumb' })
    expect(breadcrumb).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Trang chủ' })).toHaveAttribute('href', '/student')
    expect(screen.getByText('AI đề xuất')).toBeInTheDocument()

    const heading = await screen.findByRole('heading', { name: 'Khóa học AI đề xuất' })
    expect(heading).toHaveClass('text-3xl')
    expect(heading).toHaveClass('tracking-tight')
    expect(screen.getByText(/AI phân tích/i)).toBeInTheDocument()
  })

  it('renders weaknesses as compact AI insight strip with chips and source line', async () => {
    mockedGetCurrent.mockResolvedValue(apiResponse(makePath()))

    renderPage()

    const title = await screen.findByText('Nên tập trung luyện tập')
    expect(title).toBeInTheDocument()

    const strip = title.closest('div.rounded-2xl, section.rounded-2xl') ?? title.parentElement?.parentElement
    expect(strip).not.toBeNull()
    expect(strip?.className).toMatch(/rounded-2xl/)
    expect(strip?.className).toMatch(/border-violet|from-violet|via-violet|violet/)

    const chip = await screen.findByText('Past simple')
    expect(chip).toBeInTheDocument()
    expect(chip.closest('[data-slot="badge"]')).not.toBeNull()

    const chipsWrap = chip.closest('div')
    expect(chipsWrap?.className).toMatch(/flex-wrap/)

    expect(screen.getByText(/Dựa trên/i)).toBeInTheDocument()
  })

  it('renames AI score to match label Do phu hop', async () => {
    mockedGetCurrent.mockResolvedValue(apiResponse(makePath()))

    renderPage()

    expect(await screen.findByText('Độ phù hợp')).toBeInTheDocument()
    expect(screen.queryByText('Điểm AI')).not.toBeInTheDocument()
    expect(await screen.findByText('85%')).toBeInTheDocument()
  })

  it('renders single primary action per card to course detail', async () => {
    mockedGetCurrent.mockResolvedValue(apiResponse(makePath()))

    renderPage()

    const courseHeading = await screen.findByRole('heading', { name: 'Course Alpha Name' })
    expect(courseHeading).toBeInTheDocument()

    const card = courseHeading.closest('[data-slot="card"]')
    expect(card).not.toBeNull()
    expect(card).toHaveClass('h-full')
    expect(card).toHaveClass('flex')
    expect(card).toHaveClass('flex-col')

    const reason = screen.getByText('AI suggests this course for past simple.')
    expect(reason).toHaveClass('line-clamp-2')

    const matchLabel = screen.getByText('Độ phù hợp')
    const matchBadge = matchLabel.closest('[data-slot="badge"]')
    expect(matchBadge).not.toBeNull()
    expect(matchBadge).toHaveClass('bg-violet-50')

    const actions = screen.getAllByRole('link', { name: /Xem khóa học/i })
    expect(actions).toHaveLength(1)
    expect(actions[0]).toHaveAttribute('href', '/student/courses/100')
    expect(actions[0]).toHaveAttribute('data-slot', 'button')
    expect(actions[0].className).toMatch(/w-full/)
  })

  it('keeps placement-test link and empty state', async () => {
    mockedGetCurrent.mockRejectedValue({ response: { status: 404 } })

    renderPage()

    expect(await screen.findByRole('link', { name: /bài kiểm tra đầu vào/i })).toHaveAttribute(
      'href',
      '/student/placement-test',
    )
    expect(await screen.findByText(/Chưa có khóa học AI đề xuất/i)).toBeInTheDocument()
  })
})
