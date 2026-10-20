import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import type { AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../../../lib/api/teacherContentApi'
import type { CourseSubmission, TeacherCourse } from '../../../lib/api/types'
import { TeacherCourseBuilderPage } from './TeacherCourseBuilderPage'
import { TeacherLessonWorkspacePage } from './TeacherLessonWorkspacePage'
import { QuestionForm } from './QuestionForm'
import { getQuestionInitialValue } from './teacherContentMappers'
import { CourseBuilderWorkspace, type CourseBuilderWorkspaceProps } from './CourseBuilderWorkspace'

vi.mock('../../../lib/api/teacherContentApi', () => ({
  getTeacherCourse: vi.fn(), getCourseSubmission: vi.fn(),
  createTeacherCourse: vi.fn(), updateTeacherCourse: vi.fn(), deleteTeacherCourse: vi.fn(), submitTeacherCourse: vi.fn(),
  createTeacherTopic: vi.fn(), updateTeacherTopic: vi.fn(), deleteTeacherTopic: vi.fn(),
  createTeacherLesson: vi.fn(), updateTeacherLesson: vi.fn(), deleteTeacherLesson: vi.fn(),
  createTeacherQuestion: vi.fn(), updateTeacherQuestion: vi.fn(), deleteTeacherQuestion: vi.fn(),
  importTeacherCourse: vi.fn(), exportTeacherCourse: vi.fn(), downloadCourseTemplate: vi.fn(),
}))

const question = { id: 30, type: 'MULTIPLE_CHOICE' as const, questionText: 'Choose an answer', explanation: 'Explanation', correctAnswer: null, knowledgePoint: null, difficulty: null, xpReward: 10, orderIndex: 7, status: 'DRAFT' as const, options: [{ id: 31, optionText: 'Yes', correct: true, orderIndex: 4 }, { id: 32, optionText: 'No', correct: false, orderIndex: 9 }] }
const course: TeacherCourse = {
  id: 1, name: 'Course one', description: 'Course description', type: 'COMPREHENSIVE', level: 'B1', orderIndex: 5,
  status: 'DRAFT', rejectionReason: null, latestRevisionId: 2, latestRevisionStatus: 'DRAFT', hasEditableRevision: true,
  pricingType: 'FREE', priceAmountVnd: null, proposedPriceAmountVnd: null, priceStatus: 'NONE', editingLocked: true,
  topics: [{ id: 10, name: 'Topic one', description: 'Topic description', orderIndex: 3, lessons: [{ id: 20, title: 'Lesson one', description: 'Lesson description', content: 'Readable content', skillType: 'LISTENING', orderIndex: 6, xpReward: 10, placementTest: false, status: 'DRAFT', rejectionReason: null, audioUrl: '/audio.mp3', audioPublicId: null, questions: [question] }] }],
}
const mutations = () => [api.createTeacherCourse, api.updateTeacherCourse, api.deleteTeacherCourse, api.submitTeacherCourse, api.createTeacherTopic, api.updateTeacherTopic, api.deleteTeacherTopic, api.createTeacherLesson, api.updateTeacherLesson, api.deleteTeacherLesson, api.createTeacherQuestion, api.updateTeacherQuestion, api.deleteTeacherQuestion, api.importTeacherCourse]
function Navigation() {
  const navigate = useNavigate()
  return <nav><button onClick={() => navigate('/courses/2')}>Other course</button><button onClick={() => navigate('/away')}>Leave</button></nav>
}
function mount(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><Navigation /><Routes>
    <Route path="/courses/:courseId" element={<TeacherCourseBuilderPage />} />
    <Route path="/courses/:courseId/lessons/:lessonId" element={<TeacherLessonWorkspacePage />} />
    <Route path="/away" element={<p>Away</p>} />
  </Routes></MemoryRouter>)
}
beforeEach(() => { vi.resetAllMocks(); HTMLElement.prototype.scrollIntoView = vi.fn(); vi.mocked(api.getTeacherCourse).mockResolvedValue({ data: course } as AxiosResponse) })

describe('terminal submission refresh determines editing permissions', () => {
  it.each([
    { path: '/courses/1', save: 'Lưu khóa học', status: 'FAILED', returnedStatus: 'REJECTED', editable: true },
    { path: '/courses/1/lessons/20', save: 'Lưu bài học', status: 'FAILED', returnedStatus: 'REJECTED', editable: true },
    { path: '/courses/1', save: 'Lưu khóa học', status: 'FAILED', returnedStatus: 'PENDING_REVIEW', editable: false },
    { path: '/courses/1/lessons/20', save: 'Lưu bài học', status: 'FAILED', returnedStatus: 'PENDING_REVIEW', editable: false },
    { path: '/courses/1', save: 'Lưu khóa học', status: 'SUCCEEDED', returnedStatus: 'PENDING_REVIEW', editable: false },
    { path: '/courses/1/lessons/20', save: 'Lưu bài học', status: 'SUCCEEDED', returnedStatus: 'PENDING_REVIEW', editable: false },
  ] as const)('$status on $path restores editing only when returned course permits it ($editable)', async ({ path, save, status, returnedStatus, editable }) => {
    vi.useFakeTimers()
    try {
      const processing: CourseSubmission = { id: 's1', courseId: 1, revisionId: 2, status: 'PROCESSING', processedQuestions: 0, totalQuestions: 1, createdAt: '', completedAt: null, failureCode: null, message: null }
      const terminal: CourseSubmission = { ...processing, status, completedAt: '2026-10-20T10:00:00Z', failureCode: status === 'FAILED' ? 'ENRICHMENT_FAILED' : null, message: status === 'FAILED' ? 'Hãy kiểm tra nội dung.' : null }
      let resolveRefresh!: (value: AxiosResponse) => void
      vi.mocked(api.getTeacherCourse).mockResolvedValueOnce({ data: { ...course, submission: processing } } as AxiosResponse).mockImplementationOnce(() => new Promise((resolve) => { resolveRefresh = resolve }))
      vi.mocked(api.getCourseSubmission).mockResolvedValueOnce({ data: processing } as AxiosResponse).mockResolvedValue({ data: terminal } as AxiosResponse)
      mount(path)
      await act(async () => { await Promise.resolve(); await Promise.resolve() })
      expect(screen.queryByRole('button', { name: save })).not.toBeInTheDocument()
      await act(async () => { await vi.advanceTimersByTimeAsync(5000) })
      expect(api.getTeacherCourse).toHaveBeenCalledTimes(2)
      // A terminal poll alone must not optimistically unlock the still-locked course.
      expect(screen.queryByRole('button', { name: save })).not.toBeInTheDocument()
      await act(async () => { resolveRefresh({ data: { ...course, submission: terminal, editingLocked: false, status: returnedStatus, latestRevisionStatus: returnedStatus, hasEditableRevision: editable } } as AxiosResponse) })
      if (editable) expect(screen.getByRole('button', { name: save })).toBeEnabled()
      else expect(screen.queryByRole('button', { name: save })).not.toBeInTheDocument()
      expect(screen.getByText(status === 'SUCCEEDED' ? 'Đã gửi khóa học để duyệt.' : /Không thể hoàn tất gửi duyệt/)).toBeInTheDocument()
      if (status === 'SUCCEEDED' && path === '/courses/1') expect(screen.getByText('Bản nháp đang chờ duyệt.')).toBeInTheDocument()
      await act(async () => { window.dispatchEvent(new Event('focus')); await vi.advanceTimersByTimeAsync(60000) })
      expect(api.getCourseSubmission).toHaveBeenCalledTimes(2)
      expect(api.getTeacherCourse).toHaveBeenCalledTimes(2)
    } finally { vi.useRealTimers() }
  })
})

describe('persisted editing lock at real page boundaries', () => {
  it.each([
    { entity: 'course', path: '/courses/1', save: 'Lưu khóa học', api: api.updateTeacherCourse, id: 1, orderIndex: 5 },
    { entity: 'topic', path: '/courses/1?step=noi-dung', save: 'Lưu chủ đề', api: api.updateTeacherTopic, id: 10, orderIndex: 3 },
    { entity: 'lesson', path: '/courses/1?step=noi-dung&lesson=20', save: 'Lưu bài học', api: api.updateTeacherLesson, id: 20, orderIndex: 6 },
    { entity: 'direct lesson', path: '/courses/1/lessons/20', save: 'Lưu bài học', api: api.updateTeacherLesson, id: 20, orderIndex: 6 },
  ])('preserves $entity ordering on save and respects the authoritative lock after 409', async ({ entity, path, save, api: update, id, orderIndex }) => {
    vi.mocked(api.getTeacherCourse).mockResolvedValueOnce({ data: { ...course, editingLocked: false } } as AxiosResponse).mockResolvedValue({ data: course } as AxiosResponse)
    vi.mocked(update).mockRejectedValue({ response: { status: 409 } })
    mount(path)
    if (entity === 'topic') fireEvent.click(await screen.findByRole('button', { name: /Topic one/ }))
    const button = await screen.findByRole('button', { name: save })
    fireEvent.submit(button.closest('form')!)
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    expect(update).toHaveBeenCalledWith(id, expect.objectContaining({ orderIndex }))
    expect(api.getTeacherCourse).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('button', { name: save })).not.toBeInTheDocument()
    fireEvent.submit(button.closest('form')!)
    expect(update).toHaveBeenCalledTimes(1)
    for (const mutation of mutations().filter((mutation) => mutation !== update)) expect(mutation).not.toHaveBeenCalled()
  })

  it('keeps every builder step readable while removing course/topic/lesson/question and option mutations', async () => {
    mount('/courses/1')
    await screen.findByText('Course one', { selector: '[data-slot="card-title"]' })
    expect(screen.queryByRole('button', { name: 'Lưu khóa học' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Xóa khóa học' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gửi duyệt' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Nội dung' }))
    fireEvent.click(screen.getByRole('button', { name: /Topic one/ }))
    expect(screen.queryByRole('button', { name: 'Lưu chủ đề' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Thêm bài học' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Topic one/ }))
    fireEvent.click(screen.getByRole('button', { name: /Lesson one/ }))
    expect(screen.getByText('Readable content')).toBeInTheDocument()
    expect(screen.getByLabelText('Audio bài nghe')).toHaveAttribute('src', '/audio.mp3')
    expect(screen.getByRole('link', { name: 'Mở trang bài học' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Lưu bài học|Xóa|Chủ đề/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Câu hỏi' }))
    expect(screen.getByText('Choose an answer')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Thêm câu hỏi|Sửa câu hỏi|Xóa câu hỏi|Thêm lựa chọn|Xóa lựa chọn/ })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Nội dung lựa chọn 1')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
    const submit = screen.getByRole('button', { name: 'Gửi duyệt' })
    expect(submit).toBeDisabled()
    submit.focus()
    expect(submit).not.toHaveFocus()
    fireEvent.keyDown(submit, { key: 'Enter' }); fireEvent.keyDown(submit, { key: ' ' }); fireEvent.click(submit)
    for (const mutation of mutations()) expect(mutation).not.toHaveBeenCalled()
  })

  it('locks the direct lesson URL and displays answers without editable option or ordering inputs', async () => {
    mount('/courses/1/lessons/20')
    expect(await screen.findByText('Readable content')).toBeInTheDocument()
    expect(screen.getByText('Yes (đáp án đúng)')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Lưu|Xóa|Tạo|Sửa/ })).not.toBeInTheDocument()
    for (const mutation of mutations()) expect(mutation).not.toHaveBeenCalled()
  })

  it('refetches a 409 and removes an already open question/options editor without unlocking', async () => {
    vi.mocked(api.getTeacherCourse).mockResolvedValueOnce({ data: { ...course, editingLocked: false } } as AxiosResponse).mockResolvedValue({ data: course } as AxiosResponse)
    vi.mocked(api.updateTeacherQuestion).mockRejectedValue({ response: { status: 409 } })
    mount('/courses/1?step=cau-hoi&lesson=20')
    fireEvent.click(await screen.findByRole('button', { name: 'Sửa' }))
    const option = screen.getByLabelText('Nội dung lựa chọn 1')
    fireEvent.change(option, { target: { value: 'Changed option' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu câu hỏi' }))
    await screen.findByText('Không thể cập nhật câu hỏi.')
    await act(async () => { await Promise.resolve() })
    expect(api.getTeacherCourse).toHaveBeenCalledTimes(2)
    expect(screen.queryByLabelText('Nội dung lựa chọn 1')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Lưu câu hỏi' })).not.toBeInTheDocument()
    expect(api.updateTeacherQuestion).toHaveBeenCalledTimes(1)
  })
})

it('aborts polls across real course routes, ignores late results, and stops when leaving the page', async () => {
  vi.useFakeTimers()
  try {
    const submission = { id: 's1', courseId: 1, revisionId: 2, status: 'PROCESSING' as const, processedQuestions: 1, totalQuestions: 2, createdAt: '', completedAt: null, failureCode: null, message: null }
    const otherSubmission = { ...submission, id: 's2', courseId: 2 }
    vi.mocked(api.getTeacherCourse).mockImplementation(async (id) => ({ data: id === 1 ? { ...course, submission } : { ...course, id: 2, name: 'Course two', submission: otherSubmission } }) as AxiosResponse)
    let resolveOld!: (value: AxiosResponse) => void
    vi.mocked(api.getCourseSubmission).mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve })).mockImplementation(() => new Promise(() => {}))
    mount('/courses/1')
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    const oldSignal = vi.mocked(api.getCourseSubmission).mock.calls[0][2]
    fireEvent.click(screen.getByRole('button', { name: 'Other course' }))
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    expect(oldSignal?.aborted).toBe(true)
    expect(api.getCourseSubmission).toHaveBeenLastCalledWith(2, 's2', expect.any(AbortSignal))
    await act(async () => { resolveOld({ data: { ...submission, status: 'SUCCEEDED' } } as AxiosResponse) })
    expect(screen.queryByText('Đã gửi khóa học để duyệt.')).not.toBeInTheDocument()
    expect(api.getTeacherCourse).toHaveBeenCalledTimes(2)
    const nextSignal = vi.mocked(api.getCourseSubmission).mock.calls[1][2]
    fireEvent.click(screen.getByRole('button', { name: 'Leave' }))
    expect(nextSignal?.aborted).toBe(true)
    await act(async () => { window.dispatchEvent(new Event('focus')); await vi.advanceTimersByTimeAsync(60000) })
    expect(api.getCourseSubmission).toHaveBeenCalledTimes(2)
    expect(screen.getByText('Away')).toBeInTheDocument()
  } finally { vi.useRealTimers() }
})

it('disables all option controls and blocks keyboard/form submission without changing option order', () => {
  const save = vi.fn()
  const initialValue = getQuestionInitialValue(question)
  const { rerender } = render(<QuestionForm initialValue={initialValue} disabled submitLabel="Save question" onSubmit={save} />)
  for (const control of [screen.getByRole('radio', { name: 'Đánh dấu lựa chọn 2 là đáp án đúng' }), screen.getByRole('button', { name: 'Thêm lựa chọn' }), screen.getByRole('button', { name: 'Xóa lựa chọn 1' })]) {
    expect(control).toBeDisabled()
    control.focus(); expect(control).not.toHaveFocus()
    fireEvent.keyDown(control, { key: ' ' }); fireEvent.click(control)
  }
  fireEvent.submit(screen.getByRole('button', { name: 'Save question' }).closest('form')!)
  expect(save).not.toHaveBeenCalled()
  rerender(<QuestionForm initialValue={initialValue} submitLabel="Save question" onSubmit={save} />)
  fireEvent.click(screen.getByRole('button', { name: 'Save question' }))
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ orderIndex: 7, options: initialValue.options }))
})

describe('lock arrives while a mutation is open', () => {
  it.each([
    { path: '?step=noi-dung', open: 'Chủ đề', confirm: 'Tạo chủ đề' },
    { path: '?step=noi-dung', open: 'Thêm bài học', confirm: 'Tạo bài học' },
    { path: '?step=noi-dung&lesson=20', open: 'Xóa', confirm: 'Xóa' },
    { path: '?step=cau-hoi&lesson=20', open: 'Thêm câu hỏi', confirm: 'Tạo câu hỏi' },
    { path: '?step=cau-hoi&lesson=20', open: 'Sửa', confirm: 'Lưu câu hỏi' },
    { path: '?step=cau-hoi&lesson=20', open: 'Xóa', confirm: 'Xóa' },
  ])('removes $confirm confirmation/editor on $path before it can mutate', async ({ path, open, confirm }) => {
    const callbacks = {
      onUpdateCourse: vi.fn().mockResolvedValue(undefined), onSubmitCourse: vi.fn().mockResolvedValue(undefined),
      onCreateTopic: vi.fn().mockResolvedValue(undefined), onUpdateTopic: vi.fn().mockResolvedValue(undefined), onDeleteTopic: vi.fn().mockResolvedValue(undefined),
      onCreateLesson: vi.fn().mockResolvedValue(undefined), onUpdateLesson: vi.fn().mockResolvedValue(undefined), onDeleteLesson: vi.fn().mockResolvedValue(undefined),
      onCreateQuestion: vi.fn().mockResolvedValue(undefined), onUpdateQuestion: vi.fn().mockResolvedValue(undefined), onDeleteQuestion: vi.fn().mockResolvedValue(undefined),
    }
    const props: CourseBuilderWorkspaceProps = { course: { ...course, editingLocked: false }, action: null, editingState: { kind: 'editable' }, canSubmit: true, formResetVersion: 0, importExportPanel: null, ...callbacks }
    const { rerender } = render(<MemoryRouter initialEntries={[`/${path}`]}><CourseBuilderWorkspace {...props} /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: open }))
    const confirmation = screen.getByRole('button', { name: confirm })
    expect(confirmation).toBeInTheDocument()
    rerender(<MemoryRouter initialEntries={[`/${path}`]}><CourseBuilderWorkspace {...props} course={course} editingState={{ kind: 'locked', reason: 'Đang xử lý' }} canSubmit={false} /></MemoryRouter>)
    expect(confirmation).not.toBeInTheDocument()
    fireEvent.keyDown(confirmation, { key: 'Enter' }); fireEvent.click(confirmation)
    for (const callback of Object.values(callbacks)) expect(callback).not.toHaveBeenCalled()
    expect(screen.queryByLabelText('Nội dung lựa chọn 1')).not.toBeInTheDocument()
  })

  it('disables an already open submit confirmation when the course becomes locked', () => {
    const onSubmitCourse = vi.fn().mockResolvedValue(undefined)
    const noop = vi.fn().mockResolvedValue(undefined)
    const props: CourseBuilderWorkspaceProps = { course: { ...course, editingLocked: false }, action: null, editingState: { kind: 'editable' }, canSubmit: true, formResetVersion: 0, importExportPanel: null, onSubmitCourse, onUpdateCourse: noop, onCreateTopic: noop, onUpdateTopic: noop, onDeleteTopic: noop, onCreateLesson: noop, onUpdateLesson: noop, onDeleteLesson: noop, onCreateQuestion: noop, onUpdateQuestion: noop, onDeleteQuestion: noop }
    const { rerender } = render(<MemoryRouter><CourseBuilderWorkspace {...props} /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Gửi duyệt' }))
    const confirm = screen.getByRole('button', { name: 'Gửi duyệt' })
    expect(confirm).toBeEnabled()
    rerender(<MemoryRouter><CourseBuilderWorkspace {...props} editingState={{ kind: 'locked', reason: 'Đang xử lý' }} canSubmit={false} /></MemoryRouter>)
    expect(confirm).toBeDisabled()
    fireEvent.keyDown(confirm, { key: 'Enter' }); fireEvent.click(confirm)
    expect(onSubmitCourse).not.toHaveBeenCalled()
  })
})

it('also disables true/false answers so keyboard selection cannot alter a locked question', () => {
  const save = vi.fn()
  const initialValue = { ...getQuestionInitialValue(question), type: 'TRUE_FALSE' as const, correctAnswer: 'Đúng', options: [] }
  const { rerender } = render(<QuestionForm initialValue={initialValue} disabled submitLabel="Save answer" onSubmit={save} />)
  const wrong = screen.getByRole('radio', { name: 'Sai' })
  expect(wrong).toBeDisabled()
  fireEvent.keyDown(wrong, { key: ' ' }); fireEvent.click(wrong)
  expect(screen.getByRole('radio', { name: 'Đúng' })).toBeChecked()
  rerender(<QuestionForm initialValue={initialValue} submitLabel="Save answer" onSubmit={save} />)
  fireEvent.click(screen.getByRole('button', { name: 'Save answer' }))
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ correctAnswer: 'Đúng' }))
})
