import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StudentCourseListPage } from './StudentCourseListPage'
import { listStudentCourses } from '../../../lib/api/studentLearningApi'
import type { StudentCourseSummary } from '../../../lib/api/types'

vi.mock('../../../lib/api/studentLearningApi', () => ({
  listStudentCourses: vi.fn(),
}))

const mockedListStudentCourses = vi.mocked(listStudentCourses)

function coursesApiResponse(data: StudentCourseSummary[]): Awaited<ReturnType<typeof listStudentCourses>> {
  return { data } as Awaited<ReturnType<typeof listStudentCourses>>
}

function makeCourse(overrides: Partial<StudentCourseSummary> = {}): StudentCourseSummary {
  return {
    id: 1,
    name: 'English B1 Comprehensive',
    description: 'Short course description for B1 learners.',
    type: 'COMPREHENSIVE',
    level: 'B1',
    teacherId: 7,
    teacherName: 'Nguyen Van A',
    teacherEmail: 'teacher-unique-xyz@example.com',
    teacherAvatarUrl: null,
    topicCount: 5,
    lessonCount: 12,
    questionCount: 30,
    publishedAt: '2026-02-15T10:00:00.000Z',
    pricingType: 'FREE',
    priceAmountVnd: null,
    accessStatus: 'FREE',
    accessReason: null,
    enrolled: false,
    ...overrides,
  }
}

function renderListPage(initialEntries: string[] = ['/student/courses']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <StudentCourseListPage />
    </MemoryRouter>,
  )
}

describe('StudentCourseListPage redesign', () => {
  beforeEach(() => {
    mockedListStudentCourses.mockReset()
  })

  it('shows slim hero with heading and one-line description plus breadcrumb', async () => {
    mockedListStudentCourses.mockResolvedValue(coursesApiResponse([]))

    renderListPage()

    expect(await screen.findByRole('heading', { name: 'Khám phá khóa học' })).toBeInTheDocument()
    expect(screen.getByText('Tìm khóa học phù hợp với trình độ của bạn.')).toBeInTheDocument()

    const breadcrumb = screen.getByRole('navigation', { name: 'breadcrumb' })
    expect(breadcrumb).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Trang chủ' })).toBeInTheDocument()
    expect(screen.getByText('Khóa học')).toBeInTheDocument()
  })

  it('renders course cards with type, level, name heading, desc, teacher name and stats', async () => {
    mockedListStudentCourses.mockResolvedValue(coursesApiResponse([makeCourse()]))

    renderListPage()

    expect(await screen.findByRole('heading', { name: 'English B1 Comprehensive' })).toBeInTheDocument()
    const card = screen.getByRole('link', { name: /English B1 Comprehensive/i })
    expect(within(card).getByText('Tổng hợp')).toBeInTheDocument()
    expect(within(card).getByText('B1')).toBeInTheDocument()
    expect(within(card).getByText('Short course description for B1 learners.')).toBeInTheDocument()
    expect(within(card).getByText('Nguyen Van A')).toBeInTheDocument()
    expect(within(card).getByText(/5\s*chủ đề/i)).toBeInTheDocument()
    expect(within(card).getByText(/12\s*bài học/i)).toBeInTheDocument()
    expect(within(card).getByText(/30\s*câu hỏi/i)).toBeInTheDocument()
  })

  it('does not show teacher email nor published date and has a single Xem khoa hoc action per card', async () => {
    mockedListStudentCourses.mockResolvedValue(coursesApiResponse([makeCourse()]))

    renderListPage()

    await screen.findByRole('heading', { name: 'English B1 Comprehensive' })

    expect(screen.queryByText('teacher-unique-xyz@example.com')).not.toBeInTheDocument()
    expect(screen.queryByText(/xuất bản/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/15\/02\/2026/i)).not.toBeInTheDocument()

    expect(screen.getByText('Xem khóa học')).toBeInTheDocument()
    expect(screen.queryByText('Xem chi tiết')).not.toBeInTheDocument()
  })

  it('makes the whole card clickable via a single Link', async () => {
    mockedListStudentCourses.mockResolvedValue(coursesApiResponse([makeCourse()]))

    renderListPage()

    const cardLink = await screen.findByRole('link', { name: /English B1 Comprehensive/i })
    expect(cardLink).toHaveAttribute('href', '/student/courses/1')
    expect(cardLink).toHaveTextContent('Xem khóa học')
  })

  it('does not show the teacherId marker when filtering by teacher', async () => {
    mockedListStudentCourses.mockResolvedValue(coursesApiResponse([makeCourse()]))

    renderListPage(['/student/courses?teacherId=7'])

    await screen.findByRole('heading', { name: 'English B1 Comprehensive' })

    expect(screen.queryByText(/giảng viên #/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/#7/)).not.toBeInTheDocument()
  })

  it('paginates client-side with 6 per page and resets to page 1 on search', async () => {
    const eightCourses = Array.from({ length: 8 }, (_, index) =>
      makeCourse({ id: index + 1, name: `Course ${index + 1}` }),
    )
    mockedListStudentCourses.mockResolvedValue(coursesApiResponse(eightCourses))

    renderListPage()

    expect(await screen.findByRole('heading', { name: 'Course 1' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: /Course \d/ })).toHaveLength(6)
    expect(screen.queryByRole('heading', { name: 'Course 7' })).not.toBeInTheDocument()

    expect(screen.getByRole('link', { name: /Trang trước/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '2' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Trang sau/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: '2' }))

    expect(await screen.findByRole('heading', { name: 'Course 7' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Course 8' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Course 1' })).not.toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText(/Tìm theo tên khóa học hoặc giảng viên/i), {
      target: { value: 'Course' },
    })

    expect(await screen.findByRole('heading', { name: 'Course 1' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: /Course \d/ })).toHaveLength(6)
  })
})
