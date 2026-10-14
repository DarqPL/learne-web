import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TeacherContentPage } from './TeacherContentPage'
import { createEditRevision, listTeacherCourses } from '../../../lib/api/teacherContentApi'
import type { TeacherCourse } from '../../../lib/api/types'

vi.mock('../../../lib/api/teacherContentApi', () => ({
  createEditRevision: vi.fn(),
  createTeacherCourse: vi.fn(),
  deleteTeacherCourse: vi.fn(),
  downloadCourseTemplate: vi.fn(),
  exportTeacherCourse: vi.fn(),
  importTeacherCourse: vi.fn(),
  listTeacherCourses: vi.fn(),
  submitTeacherCourse: vi.fn(),
}))

const mockedListTeacherCourses = vi.mocked(listTeacherCourses)
const mockedCreateEditRevision = vi.mocked(createEditRevision)

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
    latestRevisionId: null,
    latestRevisionStatus: null,
    hasEditableRevision: false,
    pricingType: 'FREE',
    priceAmountVnd: null,
    proposedPriceAmountVnd: null,
    priceStatus: 'NONE',
    topics: [],
    ...overrides,
  }
}

function listResponse(courses: TeacherCourse[]) {
  return {
    data: { content: courses, nextCursor: null, hasNext: false, size: courses.length },
  } as AxiosResponse<never> as Awaited<ReturnType<typeof listTeacherCourses>>
}

function renderContentPage() {
  return render(
    <MemoryRouter>
      <TeacherContentPage />
    </MemoryRouter>,
  )
}

describe('TeacherContentPage edit revisions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows create-draft action for approved courses without editable revision', async () => {
    mockedListTeacherCourses.mockResolvedValue(listResponse([makeCourse()]))

    renderContentPage()

    expect(await screen.findByRole('button', { name: 'Tạo bản nháp chỉnh sửa' })).toBeInTheDocument()
  })

  it('calls edit-revision and reloads when creating a draft', async () => {
    const course = makeCourse({ id: 7, name: 'Approved Course' })
    const revised = { ...course, hasEditableRevision: true, latestRevisionId: 99, latestRevisionStatus: 'DRAFT' as const }
    mockedListTeacherCourses.mockResolvedValueOnce(listResponse([course])).mockResolvedValueOnce(listResponse([revised]))
    mockedCreateEditRevision.mockResolvedValue({ data: revised } as AxiosResponse<never> as Awaited<ReturnType<typeof createEditRevision>>)

    renderContentPage()

    const button = await screen.findByRole('button', { name: 'Tạo bản nháp chỉnh sửa' })
    fireEvent.click(button)

    await waitFor(() => expect(mockedCreateEditRevision).toHaveBeenCalledWith(7))
    await waitFor(() => expect(mockedListTeacherCourses).toHaveBeenCalledTimes(2))
  })

  it('shows continue-draft action when an editable revision exists', async () => {
    mockedListTeacherCourses.mockResolvedValue(
      listResponse([makeCourse({ hasEditableRevision: true, latestRevisionId: 99, latestRevisionStatus: 'DRAFT' })]),
    )

    renderContentPage()

    expect(await screen.findByRole('link', { name: 'Tiếp tục sửa bản nháp' })).toBeInTheDocument()
  })
})
