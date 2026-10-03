import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StudentEnrollmentProgressPage } from './StudentEnrollmentProgressPage'
import { getStudentEnrollment } from '../../../lib/api/studentLearningApi'
import type { StudentEnrollmentProgress } from '../../../lib/api/types'

vi.mock('../../../lib/api/studentLearningApi', () => ({
  getStudentEnrollment: vi.fn(),
}))

const mockedGetStudentEnrollment = vi.mocked(getStudentEnrollment)

function enrollmentApiResponse(data: StudentEnrollmentProgress): Awaited<ReturnType<typeof getStudentEnrollment>> {
  return { data } as Awaited<ReturnType<typeof getStudentEnrollment>>
}

function makeEnrollment(): StudentEnrollmentProgress {
  return {
    enrollmentId: 10,
    status: 'ACTIVE',
    progressPercent: 50,
    completedLessonCount: 1,
    totalLessonCount: 2,
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
            title: 'Lesson Unlocked',
            content: null,
            audioUrl: null,
            audioPublicId: null,
            skillType: 'GRAMMAR',
            orderIndex: 1,
            status: 'UNLOCKED',
            progressPercent: 0,
            startedAt: null,
            completedAt: null,
          },
        ],
      },
      {
        id: 2,
        name: 'Topic Two',
        orderIndex: 2,
        lessons: [
          {
            lessonId: 21,
            title: 'Lesson Locked',
            content: null,
            audioUrl: null,
            audioPublicId: null,
            skillType: 'LISTENING',
            orderIndex: 1,
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

function renderProgressPage() {
  return render(
    <MemoryRouter initialEntries={['/student/enrollments/10']}>
      <Routes>
        <Route path="/student/enrollments/:id" element={<StudentEnrollmentProgressPage />} />
        <Route
          path="/student/enrollments/:enrollmentId/lessons/:lessonId"
          element={<div>Lesson detail route</div>}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('StudentEnrollmentProgressPage catalog sync breadcrumb and slim hero', () => {
  beforeEach(() => {
    mockedGetStudentEnrollment.mockReset()
  })

  it('shows breadcrumb Khoá học / Khóa học đã đăng ký / course name and slim hero', async () => {
    mockedGetStudentEnrollment.mockResolvedValue(enrollmentApiResponse(makeEnrollment()))

    renderProgressPage()

    expect(await screen.findByRole('heading', { name: 'English B1' })).toBeInTheDocument()

    const breadcrumb = screen.getByRole('navigation', { name: 'breadcrumb' })
    expect(breadcrumb).toBeInTheDocument()
    const catalogLink = screen.getByRole('link', { name: 'Khóa học' })
    expect(catalogLink).toHaveAttribute('href', '/student/courses')
    const enrollmentsLink = screen.getByRole('link', { name: 'Khóa học đã đăng ký' })
    expect(enrollmentsLink).toHaveAttribute('href', '/student/enrollments')
    expect(screen.getAllByText('English B1')).toHaveLength(2)
  })
})

describe('StudentEnrollmentProgressPage accordion navigation', () => {
  beforeEach(() => {
    mockedGetStudentEnrollment.mockReset()
  })

  it('renders topic names as accordion triggers', async () => {
    mockedGetStudentEnrollment.mockResolvedValue(enrollmentApiResponse(makeEnrollment()))

    renderProgressPage()

    expect(await screen.findByRole('button', { name: /Topic One/i })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Topic Two/i })).toBeInTheDocument()
  })

  it('navigates to lesson detail when clicking an unlocked lesson', async () => {
    mockedGetStudentEnrollment.mockResolvedValue(enrollmentApiResponse(makeEnrollment()))

    renderProgressPage()

    fireEvent.click(await screen.findByRole('button', { name: /Vào bài học/i }))

    expect(await screen.findByText('Lesson detail route')).toBeInTheDocument()
  })

  it('disables the action for locked lessons', async () => {
    mockedGetStudentEnrollment.mockResolvedValue(enrollmentApiResponse(makeEnrollment()))

    renderProgressPage()

    fireEvent.click(await screen.findByRole('button', { name: /Topic Two/i }))

    const lockedAction = await screen.findByRole('button', { name: /Chưa mở khóa/i })
    expect(lockedAction).toBeDisabled()
  })
})
