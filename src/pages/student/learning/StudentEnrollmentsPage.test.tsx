import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StudentEnrollmentsPage } from './StudentEnrollmentsPage'
import { listStudentEnrollments } from '../../../lib/api/studentLearningApi'
import type { StudentEnrollment } from '../../../lib/api/types'

vi.mock('../../../lib/api/studentLearningApi', () => ({
  listStudentEnrollments: vi.fn(),
}))

const mockedListStudentEnrollments = vi.mocked(listStudentEnrollments)

function enrollmentsApiResponse(
  data: StudentEnrollment[],
): Awaited<ReturnType<typeof listStudentEnrollments>> {
  return { data } as Awaited<ReturnType<typeof listStudentEnrollments>>
}

function makeEnrollment(id: number): StudentEnrollment {
  return {
    id,
    courseId: 100 + id,
    courseName: `Course ${id}`,
    teacherId: 10,
    teacherName: `Teacher ${id}`,
    status: 'ACTIVE',
    progressPercent: 50,
    completedLessonCount: 5,
    totalLessonCount: 10,
    enrolledAt: '2026-01-01T00:00:00.000Z',
    completedAt: null,
  }
}

function renderEnrollmentsPage() {
  return render(
    <MemoryRouter>
      <StudentEnrollmentsPage />
    </MemoryRouter>,
  )
}

describe('StudentEnrollmentsPage pagination', () => {
  beforeEach(() => {
    mockedListStudentEnrollments.mockReset()
  })

  it('renders 6 cards with pagination control and shows remaining courses on page 2', async () => {
    mockedListStudentEnrollments.mockResolvedValue(
      enrollmentsApiResponse([1, 2, 3, 4, 5, 6, 7, 8].map((id) => makeEnrollment(id))),
    )

    renderEnrollmentsPage()

    expect(await screen.findByText('Course 1')).toBeInTheDocument()
    for (const id of [1, 2, 3, 4, 5, 6]) {
      expect(screen.getByText(`Course ${id}`)).toBeInTheDocument()
    }
    expect(screen.queryByText('Course 7')).not.toBeInTheDocument()
    expect(screen.queryByText('Course 8')).not.toBeInTheDocument()

    expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: '2' }))

    await waitFor(() => {
      expect(screen.getByText('Course 7')).toBeInTheDocument()
      expect(screen.getByText('Course 8')).toBeInTheDocument()
      expect(screen.queryByText('Course 1')).not.toBeInTheDocument()
    })
  })

  it('keeps discover-courses empty state when there are no enrollments', async () => {
    mockedListStudentEnrollments.mockResolvedValue(enrollmentsApiResponse([]))

    renderEnrollmentsPage()

    expect(await screen.findByText('Bạn chưa đăng ký khóa học nào.')).toBeInTheDocument()
    const discoverLink = screen.getByRole('link', { name: 'Khám phá khóa học' })
    expect(discoverLink).toBeInTheDocument()
    expect(discoverLink).toHaveAttribute('href', '/student/courses')
    expect(screen.queryByRole('navigation', { name: /pagination/i })).not.toBeInTheDocument()
  })
})
