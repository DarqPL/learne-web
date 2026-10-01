import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StudentLearningPathPage } from './StudentLearningPathPage'
import { generateStudentLearningPath, getCurrentStudentLearningPath } from '../../../lib/api/studentLearningApi'
import type { StudentLearningPath } from '../../../lib/api/types'

vi.mock('../../../lib/api/studentLearningApi', () => ({
  generateStudentLearningPath: vi.fn(),
  getCurrentStudentLearningPath: vi.fn(),
}))

const mockedGetCurrentStudentLearningPath = vi.mocked(getCurrentStudentLearningPath)
const mockedGenerateStudentLearningPath = vi.mocked(generateStudentLearningPath)

function pathApiResponse(data: StudentLearningPath): Awaited<ReturnType<typeof getCurrentStudentLearningPath>> {
  return { data } as Awaited<ReturnType<typeof getCurrentStudentLearningPath>>
}

function makePath(): StudentLearningPath {
  return {
    id: 1,
    status: 'READY',
    generatedAt: '2026-01-01T00:00:00.000Z',
    source: 'AI',
    weaknesses: ['Past simple'],
    items: [
      {
        id: 10,
        enrollmentId: 5,
        lessonId: 20,
        lessonTitle: 'Lesson Alpha Name',
        courseId: 100,
        courseTitle: 'Course Alpha',
        teacherId: 7,
        teacherName: 'Teacher One',
        sequenceOrder: 1,
        reason: 'AI suggests this lesson.',
        score: 0.8,
        completed: false,
      },
    ],
  }
}

function renderLearningPathPage() {
  return render(
    <MemoryRouter>
      <StudentLearningPathPage />
    </MemoryRouter>,
  )
}

describe('StudentLearningPathPage technical copy', () => {
  beforeEach(() => {
    mockedGetCurrentStudentLearningPath.mockReset()
    mockedGenerateStudentLearningPath.mockReset()
  })

  it('renders title and lesson name without technical sequence markers or phase copy', async () => {
    mockedGetCurrentStudentLearningPath.mockResolvedValue(pathApiResponse(makePath()))

    renderLearningPathPage()

    expect(await screen.findByRole('heading', { name: 'Lộ trình học cá nhân' })).toBeInTheDocument()
    expect(await screen.findByText('Lesson Alpha Name')).toBeInTheDocument()
    expect(screen.queryByText('#1')).not.toBeInTheDocument()
    expect(screen.queryByText(/phase/i)).not.toBeInTheDocument()
  })

  it('renders match score label instead of AI score copy', async () => {
    mockedGetCurrentStudentLearningPath.mockResolvedValue(pathApiResponse(makePath()))

    renderLearningPathPage()

    expect(await screen.findByText('Độ phù hợp')).toBeInTheDocument()
    expect(screen.queryByText('Điểm AI')).not.toBeInTheDocument()
    expect(await screen.findByText('80%')).toBeInTheDocument()
  })

  it('shows breadcrumb Khóa học / Lộ trình học with slim hero', async () => {
    mockedGetCurrentStudentLearningPath.mockResolvedValue(pathApiResponse(makePath()))

    renderLearningPathPage()

    const breadcrumb = await screen.findByRole('navigation', { name: 'breadcrumb' })
    expect(breadcrumb).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Khóa học' })).toHaveAttribute('href', '/student/courses')
    expect(screen.getByText('Lộ trình học')).toBeInTheDocument()

    const heading = await screen.findByRole('heading', { name: 'Lộ trình học cá nhân' })
    expect(heading).toHaveClass('text-3xl')
    expect(heading).toHaveClass('tracking-tight')
    expect(screen.getByText(/AI phân tích/i)).toBeInTheDocument()
  })

  it('renders compact recommendation cards matching catalog language', async () => {
    mockedGetCurrentStudentLearningPath.mockResolvedValue(pathApiResponse(makePath()))

    renderLearningPathPage()

    const lessonHeading = await screen.findByRole('heading', { name: 'Lesson Alpha Name' })
    expect(lessonHeading).toBeInTheDocument()

    const card = lessonHeading.closest('[data-slot="card"]')
    expect(card).not.toBeNull()
    expect(card).toHaveClass('h-full')
    expect(card).toHaveClass('flex')
    expect(card).toHaveClass('flex-col')

    const reason = screen.getByText('AI suggests this lesson.')
    expect(reason).toHaveClass('line-clamp-2')

    const matchLabel = screen.getByText('Độ phù hợp')
    const matchBadge = matchLabel.closest('[data-slot="badge"]')
    expect(matchBadge).not.toBeNull()
    expect(matchBadge).toHaveClass('bg-violet-50')

    expect(await screen.findByText('80%')).toBeInTheDocument()

    const action = screen.getByRole('link', { name: /Vào bài học/i })
    expect(action).toHaveTextContent(/Vào bài học/)
    expect(action.className).not.toMatch(/bg-indigo-600/)
  })
})
