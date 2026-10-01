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

describe('StudentEnrollmentsPage redesign sync with course catalog', () => {
  beforeEach(() => {
    mockedListStudentEnrollments.mockReset()
  })

  it('shows breadcrumb Khoá học / Khóa học đã đăng ký and slim hero', async () => {
    mockedListStudentEnrollments.mockResolvedValue(enrollmentsApiResponse([]))

    renderEnrollmentsPage()

    await screen.findByText('Bạn chưa đăng ký khóa học nào.')

    const breadcrumb = screen.getByRole('navigation', { name: 'breadcrumb' })
    expect(breadcrumb).toBeInTheDocument()
    const catalogLink = screen.getByRole('link', { name: 'Khóa học' })
    expect(catalogLink).toHaveAttribute('href', '/student/courses')
    expect(screen.getAllByText('Khóa học đã đăng ký')).toHaveLength(2)

    expect(screen.getByRole('heading', { name: 'Khóa học đã đăng ký' })).toBeInTheDocument()
    expect(
      screen.getByText('Theo dõi các khóa học bạn đang tham gia và tiếp tục bài học còn dang dở.'),
    ).toBeInTheDocument()
  })

  it('renders cards with catalog hierarchy, single text action, equal height and no dates', async () => {
    mockedListStudentEnrollments.mockResolvedValue(enrollmentsApiResponse([makeEnrollment(1)]))

    renderEnrollmentsPage()

    const cardLink = await screen.findByRole('link', { name: /Course 1/i })
    expect(cardLink).toHaveAttribute('href', '/student/enrollments/1')

    const heading = screen.getByRole('heading', { name: 'Course 1' })
    expect(heading).toHaveClass('text-xl')
    expect(heading).toHaveClass('font-semibold')

    expect(screen.getByText('Teacher 1')).toBeInTheDocument()
    expect(screen.getByText('Đang học')).toBeInTheDocument()

    const stats = screen.getByText((_, element) => {
      const text = element?.textContent ?? ''
      return (
        element?.tagName.toLowerCase() === 'p' &&
        /5\/10/.test(text) &&
        /bài học/i.test(text) &&
        /50%/.test(text)
      )
    })
    expect(stats).toBeInTheDocument()
    expect(stats.querySelectorAll('svg')).toHaveLength(2)

    expect(screen.getByRole('progressbar')).toBeInTheDocument()

    expect(screen.getByText(/Tiếp tục học/i)).toBeInTheDocument()
    expect(cardLink).toHaveTextContent(/Tiếp tục học/i)
    expect(cardLink.querySelector('button')).toBeNull()

    const card = cardLink.querySelector('[data-slot="card"]')
    expect(card).not.toBeNull()
    expect(card).toHaveClass('h-full')
    expect(card).toHaveClass('flex')
    expect(card).toHaveClass('flex-col')

    const footer = cardLink.querySelector('[data-slot="card-footer"]')
    expect(footer).not.toBeNull()
    expect(footer).toHaveClass('mt-auto')

    expect(screen.queryByText(/Ngày đăng ký/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Ngày hoàn thành/i)).not.toBeInTheDocument()
  })

  it('keeps client pagination with Vietnamese labels', async () => {
    mockedListStudentEnrollments.mockResolvedValue(
      enrollmentsApiResponse([1, 2, 3, 4, 5, 6, 7, 8].map((id) => makeEnrollment(id))),
    )

    renderEnrollmentsPage()

    expect(await screen.findByText('Course 1')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: /Trang trước/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Trang sau/i })).toBeInTheDocument()
    expect(screen.queryByText('Previous')).not.toBeInTheDocument()
    expect(screen.queryByText('Next')).not.toBeInTheDocument()

    const prevLink = screen.getByRole('link', { name: 'Trang trước' })
    expect(prevLink).toHaveAttribute('aria-disabled', 'true')
  })
})

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
