import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TeacherContentPage } from './TeacherContentPage'
import { createEditRevision, listTeacherCourses, submitTeacherCourse, getCourseSubmission, deleteTeacherCourse } from '../../../lib/api/teacherContentApi'
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
  getCourseSubmission: vi.fn(),
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

  it('blocks locked edit-revision and delete controls while retaining the builder read link', async () => {
    mockedListTeacherCourses.mockResolvedValue(listResponse([makeCourse({ editingLocked: true })]))
    renderContentPage()
    const revision = await screen.findByRole('button', { name: 'Tạo bản nháp chỉnh sửa' })
    const remove = screen.getByRole('button', { name: 'Xóa khóa học Approved Course' })
    for (const control of [revision, remove]) {
      expect(control).toBeDisabled()
      control.focus(); expect(control).not.toHaveFocus()
      fireEvent.keyDown(control, { key: 'Enter' }); fireEvent.keyDown(control, { key: ' ' }); fireEvent.click(control)
    }
    expect(createEditRevision).not.toHaveBeenCalled()
    expect(deleteTeacherCourse).not.toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'Mở builder khóa học Approved Course' })).toHaveAttribute('href', '/teacher/content/courses/1')
  })

  it('disables the actual open delete confirmation when a refreshed course becomes locked', async () => {
    const draft = makeCourse({ status: 'DRAFT', hasEditableRevision: true })
    mockedListTeacherCourses.mockResolvedValueOnce(listResponse([draft])).mockResolvedValue(listResponse([{ ...draft, editingLocked: true }]))
    renderContentPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Xóa khóa học Approved Course' }))
    const dialog = screen.getByRole('dialog', { name: 'Xóa khóa học' })
    const confirm = within(dialog).getByRole('button', { name: 'Xóa khóa học' })
    expect(confirm).toBeEnabled()
    fireEvent.change(screen.getByLabelText('Tìm kiếm khóa học'), { target: { value: 'Course' } })
    await waitFor(() => expect(mockedListTeacherCourses).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(confirm).toBeDisabled())
    expect(within(dialog).getByText(/Tạm khóa chỉnh sửa nội dung/)).toBeInTheDocument()
    confirm.focus(); expect(confirm).not.toHaveFocus()
    fireEvent.keyDown(confirm, { key: 'Enter' }); fireEvent.click(confirm)
    expect(deleteTeacherCourse).not.toHaveBeenCalled()
  })

  it.each(['FAILED', 'SUCCEEDED'] as const)('reconciles a refetched same-ID %s course after observing PROCESSING in the library', async (status) => {
    vi.useFakeTimers()
    try {
      const processing = { id: 'persisted-attempt', courseId: 1, revisionId: 2, status: 'PROCESSING' as const, processedQuestions: 1, totalQuestions: 2, createdAt: '', completedAt: null, failureCode: null, message: null }
      const terminal = { ...processing, status, completedAt: '2026-10-20T10:00:00Z', message: status === 'FAILED' ? 'Kiểm tra lại câu hỏi.' : null }
      const initial = makeCourse({ status: 'DRAFT', latestRevisionStatus: 'DRAFT', hasEditableRevision: true, editingLocked: true, submission: processing })
      const returned = { ...initial, status: status === 'FAILED' ? 'REJECTED' as const : 'PENDING_REVIEW' as const, latestRevisionStatus: status === 'FAILED' ? 'REJECTED' as const : 'PENDING_REVIEW' as const, hasEditableRevision: status === 'FAILED', editingLocked: false, submission: terminal }
      mockedListTeacherCourses.mockResolvedValueOnce(listResponse([initial])).mockResolvedValue(listResponse([returned]))
      vi.mocked(getCourseSubmission).mockResolvedValue({ data: processing } as AxiosResponse)
      renderContentPage()
      await act(async () => { await Promise.resolve(); await Promise.resolve() })
      expect(screen.getByText('Đang xử lý khóa học: 1/2 câu hỏi.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Xóa khóa học Approved Course' })).toBeDisabled()
      fireEvent.change(screen.getByLabelText('Tìm kiếm khóa học'), { target: { value: 'Approved' } })
      await act(async () => { await Promise.resolve(); await Promise.resolve() })
      expect(screen.queryByText('Đang xử lý khóa học: 1/2 câu hỏi.')).not.toBeInTheDocument()
      expect(screen.getByText(status === 'FAILED' ? /Không thể hoàn tất gửi duyệt/ : 'Đã gửi khóa học để duyệt.')).toBeInTheDocument()
      const remove = screen.getByRole('button', { name: 'Xóa khóa học Approved Course' })
      if (status === 'FAILED') expect(remove).toBeEnabled()
      else expect(remove).toBeDisabled()
      await act(async () => { window.dispatchEvent(new Event('focus')); await vi.advanceTimersByTimeAsync(60000) })
      expect(getCourseSubmission).toHaveBeenCalledTimes(1)
      expect(listTeacherCourses).toHaveBeenCalledTimes(2)
    } finally { vi.useRealTimers() }
  })

  it('ends request busy on 202 while persisted submission remains active, without success', async () => {
    const course = makeCourse({ status: 'DRAFT', topics: [{ id: 1, name: 'Topic', description: null, orderIndex: 0, lessons: [{ id: 1, title: 'Lesson', questions: [{}] }] }] as TeacherCourse['topics'] })
    const submission = { id: 's1', courseId: 1, revisionId: 2, status: 'QUEUED' as const, processedQuestions: 0, totalQuestions: 1, createdAt: '', completedAt: null, failureCode: null, message: null }
    mockedListTeacherCourses.mockResolvedValue(listResponse([course]))
    vi.mocked(submitTeacherCourse).mockResolvedValue({ status: 202, data: submission } as AxiosResponse)
    vi.mocked(getCourseSubmission).mockImplementation(() => new Promise(() => {}))
    renderContentPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Gửi duyệt khóa học Approved Course' }))
    expect(await screen.findByText('Đã tiếp nhận yêu cầu. Đang chờ xử lý khóa học.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tạo khóa học' })).toBeEnabled()
    const remove = screen.getByRole('button', { name: 'Xóa khóa học Approved Course' })
    expect(remove).toBeDisabled()
    fireEvent.keyDown(remove, { key: 'Enter' })
    fireEvent.click(remove)
    expect(deleteTeacherCourse).not.toHaveBeenCalled()
    expect(screen.queryByText('Đã gửi khóa học để duyệt.')).not.toBeInTheDocument()
  })

  it('keeps course B locked when an older terminal refresh for A resolves after B is accepted', async () => {
    const submissionA = { id: 'a', courseId: 1, revisionId: 2, status: 'PROCESSING' as const, processedQuestions: 0, totalQuestions: 1, createdAt: '', completedAt: null, failureCode: null, message: null }
    const courseA = makeCourse({ name: 'Course A', editingLocked: true, submission: submissionA })
    const courseB = makeCourse({ id: 2, name: 'Course B', status: 'DRAFT', hasEditableRevision: true, topics: [{ id: 1, name: 'Topic', description: null, orderIndex: 0, lessons: [{ id: 1, title: 'Lesson', questions: [{}] }] }] as TeacherCourse['topics'] })
    const submissionB = { ...submissionA, id: 'b', courseId: 2, status: 'QUEUED' as const }
    let resolveRefresh!: (response: ReturnType<typeof listResponse>) => void
    mockedListTeacherCourses.mockResolvedValueOnce(listResponse([courseA, courseB])).mockImplementationOnce(() => new Promise((resolve) => { resolveRefresh = resolve }))
    vi.mocked(getCourseSubmission).mockImplementation(async (id) => ({ data: id === 1 ? { ...submissionA, status: 'SUCCEEDED' } : submissionB }) as AxiosResponse)
    vi.mocked(submitTeacherCourse).mockResolvedValue({ status: 202, data: submissionB } as AxiosResponse)
    renderContentPage()
    await waitFor(() => expect(listTeacherCourses).toHaveBeenCalledTimes(2))
    fireEvent.click(screen.getByRole('button', { name: 'Gửi duyệt khóa học Course B' }))
    expect(await screen.findByText('Đã tiếp nhận yêu cầu. Đang chờ xử lý khóa học.')).toBeInTheDocument()
    await act(async () => { resolveRefresh(listResponse([{ ...courseA, editingLocked: false, submission: { ...submissionA, status: 'SUCCEEDED' } }, courseB])) })
    expect(screen.getByRole('button', { name: 'Xóa khóa học Course B' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Gửi duyệt khóa học Course B' })).not.toBeInTheDocument()
    expect(screen.getByText('Đã tiếp nhận yêu cầu. Đang chờ xử lý khóa học.')).toBeInTheDocument()
    expect(getCourseSubmission).toHaveBeenCalledWith(2, 'b', expect.any(AbortSignal))
  })

  it.each(['resolve', 'reject'] as const)('ignores a terminal refresh that %ss after the search query changes', async (outcome) => {
    const submission = { id: 'a', courseId: 1, revisionId: 2, status: 'PROCESSING' as const, processedQuestions: 0, totalQuestions: 1, createdAt: '', completedAt: null, failureCode: null, message: null }
    const oldCourse = makeCourse({ name: 'Old query course', editingLocked: true, submission })
    let resolveOld!: (response: ReturnType<typeof listResponse>) => void
    let rejectOld!: (error: unknown) => void
    mockedListTeacherCourses.mockResolvedValueOnce(listResponse([oldCourse])).mockImplementationOnce(() => new Promise((resolve, reject) => { resolveOld = resolve; rejectOld = reject })).mockResolvedValueOnce(listResponse([makeCourse({ id: 2, name: 'Search result' })]))
    vi.mocked(getCourseSubmission).mockResolvedValue({ data: { ...submission, status: 'SUCCEEDED' } } as AxiosResponse)
    renderContentPage()
    await waitFor(() => expect(listTeacherCourses).toHaveBeenCalledTimes(2))
    fireEvent.change(screen.getByLabelText('Tìm kiếm khóa học'), { target: { value: 'Search' } })
    expect(await screen.findByText('Search result')).toBeInTheDocument()
    await act(async () => { if (outcome === 'resolve') resolveOld(listResponse([oldCourse])); else rejectOld(new Error('Old query unavailable')) })
    expect(screen.getByText('Search result')).toBeInTheDocument()
    expect(screen.queryByText('Old query course')).not.toBeInTheDocument()
    expect(screen.queryByText('Không thể tải thư viện khóa học.')).not.toBeInTheDocument()
    expect(listTeacherCourses).toHaveBeenLastCalledWith({ q: 'Search', size: 10 })
  })

  it.each([
    { source: 'pagination', outcome: 'resolve' },
    { source: 'query', outcome: 'resolve' },
    { source: 'query', outcome: 'reject' },
  ])('protects accepted submission data from an older $source response ($outcome)', async ({ source, outcome }) => {
    const course = makeCourse({ status: 'DRAFT', hasEditableRevision: true, topics: [{ id: 1, name: 'Topic', description: null, orderIndex: 0, lessons: [{ id: 1, title: 'Lesson', questions: [{}] }] }] as TeacherCourse['topics'] })
    const accepted = { id: 'accepted', courseId: 1, revisionId: 2, status: 'QUEUED' as const, processedQuestions: 0, totalQuestions: 1, createdAt: '', completedAt: null, failureCode: null, message: null }
    let resolveOld!: (response: ReturnType<typeof listResponse>) => void
    let rejectOld!: (error: unknown) => void
    const initial = listResponse([course])
    initial.data.hasNext = true; initial.data.nextCursor = 'next-page'
    mockedListTeacherCourses.mockResolvedValueOnce(initial).mockImplementationOnce(() => new Promise((resolve, reject) => { resolveOld = resolve; rejectOld = reject }))
    vi.mocked(submitTeacherCourse).mockResolvedValue({ status: 202, data: accepted } as AxiosResponse)
    vi.mocked(getCourseSubmission).mockImplementation(() => new Promise(() => {}))
    renderContentPage()
    await screen.findByRole('button', { name: 'Gửi duyệt khóa học Approved Course' })
    if (source === 'pagination') fireEvent.click(screen.getByRole('button', { name: 'Trang tiếp' }))
    else fireEvent.change(screen.getByLabelText('Tìm kiếm khóa học'), { target: { value: 'Approved' } })
    await waitFor(() => expect(listTeacherCourses).toHaveBeenCalledTimes(2))
    fireEvent.click(screen.getByRole('button', { name: 'Gửi duyệt khóa học Approved Course' }))
    await screen.findByText('Đã tiếp nhận yêu cầu. Đang chờ xử lý khóa học.')
    await act(async () => { if (outcome === 'resolve') resolveOld(listResponse([course])); else rejectOld(new Error('Outdated request')) })
    expect(screen.getByRole('button', { name: 'Xóa khóa học Approved Course' })).toBeDisabled()
    expect(screen.getByText('Đã tiếp nhận yêu cầu. Đang chờ xử lý khóa học.')).toBeInTheDocument()
    expect(screen.queryByText('Không thể tải thư viện khóa học.')).not.toBeInTheDocument()
    expect(screen.getByText(/Trang 1 ·/)).toBeInTheDocument()
  })
})
