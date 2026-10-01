import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StudentLearningPathPage } from './StudentLearningPathPage'
import { generateStudentLearningPath, getCurrentStudentLearningPath } from '../../../lib/api/studentLearningApi'
import { formatStudentLearningDate } from './studentLearningUtils'
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

  it('renders prominent learning path metadata stats as badges', async () => {
    const path = makePath()
    mockedGetCurrentStudentLearningPath.mockResolvedValue(pathApiResponse(path))

    renderLearningPathPage()

    await screen.findByText('Lesson Alpha Name')

    const expectedDate = formatStudentLearningDate(path.generatedAt)

    const createdStat = screen.getByText(
      (_, element) =>
        element?.tagName === 'SPAN' &&
        !element.hasAttribute('data-slot') &&
        element?.textContent === `Ngày tạo ${expectedDate}`,
    )
    expect(createdStat).toBeInTheDocument()
    expect(createdStat.closest('[data-slot="badge"]')).not.toBeNull()
    expect(createdStat.closest('[data-slot="badge"]')).toHaveClass('bg-indigo-50')

    expect(screen.queryByText(/Nguồn phân tích/)).not.toBeInTheDocument()

    const countStat = screen.getByText(
      (_, element) =>
        element?.tagName === 'SPAN' &&
        !element.hasAttribute('data-slot') &&
        element?.textContent === `${path.items.length} bài đề xuất`,
    )
    expect(countStat).toBeInTheDocument()
    expect(countStat.closest('[data-slot="badge"]')).not.toBeNull()
    expect(countStat.closest('[data-slot="badge"]')).toHaveClass('bg-emerald-50')

    expect(
      screen.queryByText(
        (_, element) =>
          element?.tagName === 'P' &&
          (element?.textContent?.includes('Ngày tạo') ?? false) &&
          (element?.textContent?.includes('bài đề xuất') ?? false),
      ),
    ).not.toBeInTheDocument()
  })
})

describe('StudentLearningPathPage AI insight redesign', () => {
  beforeEach(() => {
    mockedGetCurrentStudentLearningPath.mockReset()
    mockedGenerateStudentLearningPath.mockReset()
  })

  function makeTwoItemPath(): StudentLearningPath {
    const base = makePath()
    return {
      ...base,
      weaknesses: ['Past simple', 'Present perfect'],
      items: [
        { ...base.items[0], id: 10, lessonTitle: 'Lesson Alpha Name', sequenceOrder: 1, score: 0.8, completed: false, enrollmentId: 5, lessonId: 20 },
        {
          ...base.items[0],
          id: 11,
          lessonTitle: 'Lesson Beta Name',
          courseTitle: 'Course Beta',
          teacherName: 'Teacher Two',
          sequenceOrder: 2,
          reason: 'Second reason.',
          score: 0.65,
          completed: false,
          enrollmentId: 6,
          lessonId: 21,
        },
      ],
    }
  }

  it('renders weaknesses as compact AI insight strip with chips and source line', async () => {
    mockedGetCurrentStudentLearningPath.mockResolvedValue(pathApiResponse(makeTwoItemPath()))

    renderLearningPathPage()

    const title = await screen.findByText('Nên tập trung luyện tập')
    expect(title).toBeInTheDocument()

    const strip = title.closest('div.rounded-2xl, section.rounded-2xl')
      ?? title.parentElement?.parentElement
    expect(strip).not.toBeNull()
    expect(strip?.className).toMatch(/rounded-2xl/)
    expect(strip?.className).toMatch(/border-violet|from-violet|via-violet|violet/)

    for (const weakness of ['Past simple', 'Present perfect']) {
      const chip = await screen.findByText(weakness)
      expect(chip).toBeInTheDocument()
      expect(chip.closest('[data-slot="badge"]')).not.toBeNull()
    }

    const chipsWrap = screen.getByText('Past simple').closest('div')
    expect(chipsWrap?.className).toMatch(/flex-wrap/)
    expect(chipsWrap?.className).toMatch(/gap-1\.5/)

    expect(screen.getByText(/Dựa trên/i)).toBeInTheDocument()
  })

  it('does not render roadmap priority numbers', async () => {
    mockedGetCurrentStudentLearningPath.mockResolvedValue(pathApiResponse(makeTwoItemPath()))

    renderLearningPathPage()

    await screen.findByText('Lesson Alpha Name')
    expect(screen.queryByText('01')).not.toBeInTheDocument()
    expect(screen.queryByText('02')).not.toBeInTheDocument()
    expect(screen.queryByText('#1')).not.toBeInTheDocument()
  })

  it('renders primary Button action and prominent match percent with tighter cards', async () => {
    mockedGetCurrentStudentLearningPath.mockResolvedValue(pathApiResponse(makeTwoItemPath()))

    renderLearningPathPage()

    const lessonHeading = await screen.findByRole('heading', { name: 'Lesson Alpha Name' })
    const card = lessonHeading.closest('[data-slot="card"]')
    expect(card).not.toBeNull()
    expect(card).toHaveClass('p-4')
    expect(card?.className).toMatch(/gap-2\.5/)

    const matchValue = await screen.findByText('80%')
    expect(matchValue).toBeInTheDocument()
    expect(matchValue.className).toMatch(/text-lg/)
    expect(matchValue.className).toMatch(/font-bold/)
    expect(matchValue.className).toMatch(/violet/)
    expect(screen.getAllByText('Độ phù hợp')[0]).toBeInTheDocument()

    const reason = screen.getByText('AI suggests this lesson.')
    expect(reason).toHaveClass('line-clamp-2')

    const actions = screen.getAllByRole('link', { name: /Vào bài học/i })
    expect(actions).toHaveLength(2)
    const action = actions[0]
    expect(action).toHaveAttribute('data-slot', 'button')
    expect(action.className).toMatch(/w-full/)
  })

  it('keeps short empty line when no weaknesses', async () => {
    const path = makePath()
    path.weaknesses = []
    mockedGetCurrentStudentLearningPath.mockResolvedValue(pathApiResponse(path))

    renderLearningPathPage()

    await screen.findByText('Lesson Alpha Name')
    expect(
      screen.getByText(/AI chưa ghi nhận điểm yếu cụ thể/i),
    ).toBeInTheDocument()
  })
})
