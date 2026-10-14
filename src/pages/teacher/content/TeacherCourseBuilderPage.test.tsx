import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TeacherCourseBuilderPage } from './TeacherCourseBuilderPage'
import { getTeacherCourse } from '../../../lib/api/teacherContentApi'
import type { TeacherCourse } from '../../../lib/api/types'

vi.mock('../../../lib/api/teacherContentApi', () => ({
  createTeacherLesson: vi.fn(),
  createTeacherQuestion: vi.fn(),
  createTeacherTopic: vi.fn(),
  deleteTeacherCourse: vi.fn(),
  deleteTeacherLesson: vi.fn(),
  deleteTeacherQuestion: vi.fn(),
  deleteTeacherTopic: vi.fn(),
  downloadCourseTemplate: vi.fn(),
  exportTeacherCourse: vi.fn(),
  getTeacherCourse: vi.fn(),
  importTeacherCourse: vi.fn(),
  submitTeacherCourse: vi.fn(),
  updateTeacherCourse: vi.fn(),
  updateTeacherLesson: vi.fn(),
  updateTeacherQuestion: vi.fn(),
  updateTeacherTopic: vi.fn(),
}))

const mockedGetTeacherCourse = vi.mocked(getTeacherCourse)

function makeCourse(overrides: Partial<TeacherCourse> = {}): TeacherCourse {
  return {
    id: 1,
    name: 'Approved Course',
    description: null,
    type: 'COMPREHENSIVE',
    level: 'B1',
    orderIndex: 0,
    status: 'APPROVED',
    rejectionReason: null,
    latestRevisionId: 99,
    latestRevisionStatus: 'DRAFT',
    hasEditableRevision: true,
    pricingType: 'FREE',
    priceAmountVnd: null,
    proposedPriceAmountVnd: null,
    priceStatus: 'NONE',
    topics: [],
    ...overrides,
  }
}

function renderBuilderPage() {
  return render(
    <MemoryRouter initialEntries={['/teacher/content/courses/1']}>
      <Routes>
        <Route path="/teacher/content/courses/:courseId" element={<TeacherCourseBuilderPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TeacherCourseBuilderPage edit revisions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('enables forms for approved courses with an editable revision and shows draft banner', async () => {
    mockedGetTeacherCourse.mockResolvedValue({
      data: makeCourse(),
    } as AxiosResponse<never> as Awaited<ReturnType<typeof getTeacherCourse>>)

    renderBuilderPage()

    expect(await screen.findByText(/Đang sửa bản nháp/)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Lưu khóa học' })).toBeInTheDocument()
  })

  it('disables forms while the revision is pending review', async () => {
    mockedGetTeacherCourse.mockResolvedValue({
      data: makeCourse({ hasEditableRevision: false, latestRevisionStatus: 'PENDING_REVIEW' }),
    } as AxiosResponse<never> as Awaited<ReturnType<typeof getTeacherCourse>>)

    renderBuilderPage()

    expect(await screen.findByText('Bản nháp đang chờ duyệt.')).toBeInTheDocument()
    expect(
      await screen.findByText(
        'Khóa học đang ở trạng thái chỉ đọc. Bạn không thể chỉnh sửa nội dung khi khóa học đang chờ duyệt, đã duyệt hoặc đã ẩn.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Lưu khóa học' })).not.toBeInTheDocument()
  })
})
