import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StudentLessonDetailPage } from './StudentLessonDetailPage'
import { getStudentEnrollment, startStudentLesson } from '../../../lib/api/studentLearningApi'
import type { StudentEnrollmentProgress } from '../../../lib/api/types'

vi.mock('../../../lib/api/studentLearningApi', () => ({
  getStudentEnrollment: vi.fn(),
  startStudentLesson: vi.fn(),
}))

const mockedGetStudentEnrollment = vi.mocked(getStudentEnrollment)

function enrollmentApiResponse(data: StudentEnrollmentProgress): Awaited<ReturnType<typeof getStudentEnrollment>> {
  return { data } as Awaited<ReturnType<typeof getStudentEnrollment>>
}

function makeEnrollment(): StudentEnrollmentProgress {
  return {
    enrollmentId: 10,
    status: 'ACTIVE',
    progressPercent: 40,
    completedLessonCount: 1,
    totalLessonCount: 3,
    course: {
      id: 5,
      name: 'English B1',
      level: 'B1',
      type: 'COMPREHENSIVE',
      teacherId: 7,
      teacherName: 'Teacher One',
    },
    topics: [
      {
        id: 1,
        name: 'Topic One',
        orderIndex: 1,
        lessons: [
          {
            lessonId: 20,
            title: 'Lesson 20 Title',
            content: 'Content 20',
            audioUrl: null,
            audioPublicId: null,
            skillType: 'GRAMMAR',
            orderIndex: 1,
            status: 'COMPLETED',
            progressPercent: 100,
            startedAt: null,
            completedAt: null,
          },
          {
            lessonId: 21,
            title: 'Lesson 21 Title',
            content: 'Content 21',
            audioUrl: null,
            audioPublicId: null,
            skillType: 'GRAMMAR',
            orderIndex: 2,
            status: 'UNLOCKED',
            progressPercent: 0,
            startedAt: null,
            completedAt: null,
          },
          {
            lessonId: 22,
            title: 'Lesson 22 Title',
            content: 'Content 22',
            audioUrl: null,
            audioPublicId: null,
            skillType: 'GRAMMAR',
            orderIndex: 3,
            status: 'LOCKED',
            progressPercent: 0,
            startedAt: null,
            completedAt: null,
          },
        ],
      },
    ],
  }
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/student/enrollments/:enrollmentId/lessons/:lessonId" element={<StudentLessonDetailPage />} />
        <Route path="/student/enrollments/:enrollmentId" element={<div>Progress route</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('StudentLessonDetailPage catalog sync', () => {
  beforeEach(() => {
    mockedGetStudentEnrollment.mockReset()
    vi.mocked(startStudentLesson).mockReset()
  })

  it('shows breadcrumb, back link href, and slim hero without big dl stat cards', async () => {
    mockedGetStudentEnrollment.mockResolvedValue(enrollmentApiResponse(makeEnrollment()))

    renderAt('/student/enrollments/10/lessons/21')

    expect(await screen.findByRole('heading', { name: 'Lesson 21 Title' })).toBeInTheDocument()

    const breadcrumb = screen.getByRole('navigation', { name: 'breadcrumb' })
    expect(breadcrumb).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Khóa học' })).toHaveAttribute('href', '/student/courses')
    expect(screen.getByRole('link', { name: 'Khóa học đã đăng ký' })).toHaveAttribute('href', '/student/enrollments')

    const backLink = screen.getByRole('link', { name: /Quay lại lộ trình học/i })
    expect(backLink).toHaveAttribute('href', '/student/enrollments/10')

    const heading = screen.getByRole('heading', { name: 'Lesson 21 Title' })
    expect(heading.className).toMatch(/text-2xl/)

    expect(document.querySelector('dl')).not.toBeInTheDocument()

    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toBeInTheDocument()
    expect(progressbar.className).toMatch(/h-2/)

    const startButton = screen.getByRole('button', { name: /Bắt đầu học/i })
    expect(startButton.className).toMatch(/w-auto/)
  })
})

describe('StudentLessonDetailPage navigation', () => {
  beforeEach(() => {
    mockedGetStudentEnrollment.mockReset()
    vi.mocked(startStudentLesson).mockReset()
  })

  it('navigates to the next unlocked lesson from lesson 20', async () => {
    mockedGetStudentEnrollment.mockResolvedValue(enrollmentApiResponse(makeEnrollment()))

    renderAt('/student/enrollments/10/lessons/20')

    expect(await screen.findByRole('heading', { name: 'Lesson 20 Title' })).toBeInTheDocument()

    fireEvent.click(await screen.findByRole('button', { name: /Bài học tiếp theo/i }))

    expect(await screen.findByRole('heading', { name: 'Lesson 21 Title' })).toBeInTheDocument()
  })

  it('shows back fallback when the next lesson is locked', async () => {
    mockedGetStudentEnrollment.mockResolvedValue(enrollmentApiResponse(makeEnrollment()))

    renderAt('/student/enrollments/10/lessons/21')

    expect(await screen.findByRole('heading', { name: 'Lesson 21 Title' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Bài học tiếp theo/i })).not.toBeInTheDocument()

    const backButtons = await screen.findAllByRole('button', { name: /Quay lại lộ trình học/i })
    expect(backButtons.length).toBeGreaterThan(0)

    fireEvent.click(backButtons[backButtons.length - 1])

    expect(await screen.findByText('Progress route')).toBeInTheDocument()
  })
})
