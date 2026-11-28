import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { AxiosResponse } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TeacherCourseBuilderPage } from './TeacherCourseBuilderPage'
import {
  cancelCourseCoverProposal,
  getCourseCoverState,
  getTeacherCourse,
  removeCourseCover,
  removeCourseRevisionCover,
  uploadCourseCover,
  uploadCourseRevisionCover,
} from '../../../lib/api/teacherContentApi'
import type { TeacherCourse, TeacherCourseCoverState } from '../../../lib/api/types'

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
  getCourseCoverState: vi.fn(),
  cancelCourseCoverProposal: vi.fn(),
  uploadCourseRevisionCover: vi.fn(),
  removeCourseRevisionCover: vi.fn(),
  importTeacherCourse: vi.fn(),
  submitTeacherCourse: vi.fn(),
  updateTeacherCourse: vi.fn(),
  updateTeacherLesson: vi.fn(),
  updateTeacherQuestion: vi.fn(),
  updateTeacherTopic: vi.fn(),
  uploadCourseCover: vi.fn(),
  removeCourseCover: vi.fn(),
}))

const mockedGetTeacherCourse = vi.mocked(getTeacherCourse)
const mockedGetCourseCoverState = vi.mocked(getCourseCoverState)
const browserRestorers: Array<() => void> = []

function installCoverEditorBrowser() {
  const restoreProperty = (target: object, key: PropertyKey, value: unknown) => {
    const previous = Object.getOwnPropertyDescriptor(target, key)
    Object.defineProperty(target, key, { configurable: true, value })
    browserRestorers.push(() => {
      if (previous) Object.defineProperty(target, key, previous)
      else Reflect.deleteProperty(target, key)
    })
  }
  class MockImage {
    naturalWidth = 1600
    naturalHeight = 900
    onload: ((event: Event) => void) | null = null
    onerror: ((event: Event) => void) | null = null
    set src(_url: string) {
      queueMicrotask(() => this.onload?.(new Event('load')))
    }
  }
  const context = {
    fillStyle: '',
    fillRect: vi.fn(),
    drawImage: vi.fn(),
  }
  restoreProperty(globalThis, 'Image', MockImage as unknown as typeof Image)
  restoreProperty(URL, 'createObjectURL', vi.fn(() => 'blob:teacher-cover'))
  restoreProperty(URL, 'revokeObjectURL', vi.fn())
  restoreProperty(HTMLCanvasElement.prototype, 'getContext', vi.fn(() => context))
  restoreProperty(HTMLCanvasElement.prototype, 'toBlob', vi.fn(function (
    this: HTMLCanvasElement,
    callback: BlobCallback,
  ) {
    callback(new Blob(['jpeg crop'], { type: 'image/jpeg' }))
  }))
}

function makeCoverState(overrides: Partial<TeacherCourseCoverState> = {}): TeacherCourseCoverState {
  return {
    publicImageUrl: null,
    pendingSnapshot: null,
    latestCoverReview: null,
    revisionCandidate: null,
    ...overrides,
  }
}

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

afterEach(() => {
  for (const restore of browserRestorers.splice(0).reverse()) restore()
})

describe('TeacherCourseBuilderPage edit revisions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGetCourseCoverState.mockResolvedValue({ data: makeCoverState() } as never)
  })

  it('keeps the approved cover public while showing a pending standalone proposal after reload', async () => {
    mockedGetTeacherCourse.mockResolvedValue({
      data: makeCourse({
        imageUrl: 'https://example.test/approved.jpg',
        latestRevisionStatus: 'APPROVED',
        hasEditableRevision: false,
      }),
    } as AxiosResponse<never> as Awaited<ReturnType<typeof getTeacherCourse>>)
    mockedGetCourseCoverState.mockResolvedValue({
      data: makeCoverState({
        publicImageUrl: 'https://example.test/approved.jpg',
        pendingSnapshot: {
          kind: 'COVER_ONLY',
          id: 21,
          status: 'PENDING_REVIEW',
          proposedImageUrl: 'https://example.test/pending.jpg',
        },
        latestCoverReview: { id: 21, status: 'PENDING_REVIEW', rejectionReason: null },
      }),
    } as never)

    renderBuilderPage()

    expect(await screen.findByRole('img', { name: 'Ảnh bìa khóa học Approved Course' }))
      .toHaveAttribute('src', 'https://example.test/approved.jpg')
    expect(screen.getByRole('img', { name: 'Ảnh bìa đề xuất đang chờ duyệt cho Approved Course' }))
      .toHaveAttribute('src', 'https://example.test/pending.jpg')
    expect(screen.getByText('Ảnh bìa mới đang chờ duyệt.')).toBeInTheDocument()
  })

  it('shows the persisted rejection reason and keeps an editable revision candidate separate', async () => {
    mockedGetTeacherCourse.mockResolvedValue({
      data: makeCourse({ imageUrl: 'https://example.test/approved.jpg', latestRevisionStatus: 'REJECTED' }),
    } as AxiosResponse<never> as Awaited<ReturnType<typeof getTeacherCourse>>)
    mockedGetCourseCoverState.mockResolvedValue({
      data: makeCoverState({
        publicImageUrl: 'https://example.test/approved.jpg',
        latestCoverReview: { id: 21, status: 'REJECTED', rejectionReason: 'Ảnh chưa phù hợp.' },
        revisionCandidate: {
          id: 99,
          status: 'REJECTED',
          proposedImageUrl: 'https://example.test/revision.jpg',
        },
      }),
    } as never)

    renderBuilderPage()

    expect(await screen.findByText('Ảnh bìa bị từ chối')).toBeInTheDocument()
    expect(screen.getByText('Ảnh chưa phù hợp.')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Ảnh bìa đề xuất trong bản sửa cho Approved Course' }))
      .toHaveAttribute('src', 'https://example.test/revision.jpg')
  })

  it('cancels a pending standalone proposal without removing the approved public cover', async () => {
    mockedGetTeacherCourse.mockResolvedValue({
      data: makeCourse({
        imageUrl: 'https://example.test/approved.jpg',
        latestRevisionStatus: 'APPROVED',
        hasEditableRevision: false,
      }),
    } as AxiosResponse<never> as Awaited<ReturnType<typeof getTeacherCourse>>)
    mockedGetCourseCoverState
      .mockResolvedValueOnce({
        data: makeCoverState({
          publicImageUrl: 'https://example.test/approved.jpg',
          pendingSnapshot: {
            kind: 'COVER_ONLY',
            id: 21,
            status: 'PENDING_REVIEW',
            proposedImageUrl: 'https://example.test/pending.jpg',
          },
        }),
      } as never)
      .mockResolvedValueOnce({
        data: makeCoverState({ publicImageUrl: 'https://example.test/approved.jpg' }),
      } as never)

    renderBuilderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Hủy đề xuất ảnh bìa' }))

    await waitFor(() => expect(cancelCourseCoverProposal).toHaveBeenCalledWith(1))
    expect(await screen.findByRole('img', { name: 'Ảnh bìa khóa học Approved Course' }))
      .toHaveAttribute('src', 'https://example.test/approved.jpg')
    expect(screen.queryByRole('img', { name: 'Ảnh bìa đề xuất đang chờ duyệt cho Approved Course' }))
      .not.toBeInTheDocument()
  })

  it('removes a revision candidate through the revision endpoint instead of the public-cover endpoint', async () => {
    mockedGetTeacherCourse.mockResolvedValue({
      data: makeCourse({ latestRevisionStatus: 'DRAFT', hasEditableRevision: true }),
    } as AxiosResponse<never> as Awaited<ReturnType<typeof getTeacherCourse>>)
    mockedGetCourseCoverState.mockResolvedValue({
      data: makeCoverState({
        revisionCandidate: {
          id: 99,
          status: 'DRAFT',
          proposedImageUrl: 'https://example.test/revision.jpg',
        },
      }),
    } as never)

    renderBuilderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Xóa ảnh bìa đề xuất' }))

    await waitFor(() => expect(removeCourseRevisionCover).toHaveBeenCalledWith(1))
    expect(removeCourseCover).not.toHaveBeenCalled()
  })

  it('uses semantic taxonomy and primary tokens for course metadata and cover action', async () => {
    mockedGetTeacherCourse.mockResolvedValue({ data: makeCourse() } as AxiosResponse<never> as Awaited<ReturnType<typeof getTeacherCourse>>)
    renderBuilderPage()
    const taxonomyBadge = (await screen.findAllByText('Tổng hợp')).find((element) => element.getAttribute('data-slot') === 'badge')
    expect(taxonomyBadge).toHaveClass('bg-taxonomy-1', 'text-taxonomy-1-foreground')
    expect(screen.getByRole('button', { name: 'Lưu khóa học' })).toHaveClass('bg-primary', 'text-primary-foreground')
  })

  it('shows an approved revision cover as historical preview without a remove action', async () => {
    mockedGetTeacherCourse.mockResolvedValue({
      data: makeCourse({ latestRevisionStatus: 'APPROVED', hasEditableRevision: false }),
    } as AxiosResponse<never> as Awaited<ReturnType<typeof getTeacherCourse>>)
    mockedGetCourseCoverState.mockResolvedValue({
      data: makeCoverState({
        revisionCandidate: {
          id: 99,
          status: 'APPROVED',
          proposedImageUrl: 'https://example.test/approved-revision.jpg',
        },
      }),
    } as never)

    renderBuilderPage()

    expect(await screen.findByRole('img', { name: 'Ảnh bìa đề xuất trong bản sửa cho Approved Course' }))
      .toHaveAttribute('src', 'https://example.test/approved-revision.jpg')
    expect(screen.queryByRole('button', { name: 'Xóa ảnh bìa đề xuất' })).not.toBeInTheDocument()
  })

  it('opens the crop editor before uploading a selected cover source', async () => {
    mockedGetTeacherCourse.mockResolvedValue({
      data: makeCourse({ imageUrl: null }),
    } as AxiosResponse<never> as Awaited<ReturnType<typeof getTeacherCourse>>)
    vi.mocked(uploadCourseCover).mockResolvedValue({
      data: { imageUrl: 'https://example.test/new.jpg' },
    } as never)

    renderBuilderPage()

    const coverLabel = await screen.findByText('Tải ảnh bìa')
    const coverInput = coverLabel.closest('label')?.querySelector('input') as HTMLInputElement
    fireEvent.change(coverInput, {
      target: { files: [new File(['cover'], 'cover.png', { type: 'image/png' })] },
    })

    expect(await screen.findByRole('dialog', { name: 'Chỉnh sửa ảnh bìa khóa học' })).toBeInTheDocument()
    expect(uploadCourseCover).not.toHaveBeenCalled()
  })

  it('explains accepted formats and the source-size limit in the crop editor', async () => {
    mockedGetTeacherCourse.mockResolvedValue({
      data: makeCourse({ imageUrl: null }),
    } as AxiosResponse<never> as Awaited<ReturnType<typeof getTeacherCourse>>)

    renderBuilderPage()

    const coverLabel = await screen.findByText('Tải ảnh bìa')
    const coverInput = coverLabel.closest('label')?.querySelector('input') as HTMLInputElement
    fireEvent.change(coverInput, {
      target: { files: [new File(['cover'], 'cover.png', { type: 'image/png' })] },
    })

    expect(await screen.findByText(/JPEG, PNG hoặc WebP/)).toBeInTheDocument()
    expect(screen.getByText(/5 MiB/)).toBeInTheDocument()
  })

  it('rejects unsupported image formats before any upload request', async () => {
    mockedGetTeacherCourse.mockResolvedValue({
      data: makeCourse({ imageUrl: null }),
    } as AxiosResponse<never> as Awaited<ReturnType<typeof getTeacherCourse>>)

    renderBuilderPage()

    const coverLabel = await screen.findByText('Tải ảnh bìa')
    const coverInput = coverLabel.closest('label')?.querySelector('input') as HTMLInputElement
    fireEvent.change(coverInput, {
      target: { files: [new File(['cover'], 'cover.gif', { type: 'image/gif' })] },
    })

    expect(await screen.findByText(/Chỉ chấp nhận JPEG, PNG hoặc WebP/)).toBeInTheDocument()
    expect(uploadCourseCover).not.toHaveBeenCalled()
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
    expect(screen.getByText('Tải ảnh bìa')).toBeInTheDocument()
  })

  it('submits a revision cover without publishing it and keeps public removal immediate', async () => {
    installCoverEditorBrowser()
    vi.mocked(getTeacherCourse).mockResolvedValue({
      data: makeCourse({
        hasEditableRevision: false,
        latestRevisionStatus: 'PENDING_REVIEW',
        imageUrl: 'https://example.test/approved.jpg',
      }),
    } as AxiosResponse<never> as Awaited<ReturnType<typeof getTeacherCourse>>)
    vi.mocked(uploadCourseRevisionCover).mockResolvedValue({
      data: { imageUrl: 'https://example.test/new.jpg' },
    } as never)

    renderBuilderPage()
    const coverLabel = await screen.findByText('Thay ảnh bìa')
    const coverInput = coverLabel.closest('label')?.querySelector('input') as HTMLInputElement

    const file = new File(['cover'], 'cover.png', { type: 'image/png' })
    fireEvent.change(coverInput, {
      target: { files: [file] },
    })
    await screen.findByRole('img', { name: 'Xem trước ảnh bìa đã cắt theo tỉ lệ 16:9' })
    fireEvent.click(screen.getByRole('button', { name: 'Dùng ảnh bìa này' }))

    await waitFor(() => expect(uploadCourseRevisionCover).toHaveBeenCalledWith(1, expect.any(File)))
    expect(uploadCourseCover).not.toHaveBeenCalled()
    expect(await screen.findByText('Đã gửi ảnh bìa cùng bản sửa để duyệt.')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Ảnh bìa khóa học Approved Course' }))
      .toHaveAttribute('src', 'https://example.test/approved.jpg')

    vi.mocked(removeCourseCover).mockResolvedValue({ data: { imageUrl: null } } as never)
    fireEvent.click(await screen.findByRole('button', { name: 'Xóa ảnh bìa' }))
    await waitFor(() => expect(removeCourseCover).toHaveBeenCalledWith(1))
  })

  it('locks cover actions while upload runs and shows API errors', async () => {
    installCoverEditorBrowser()
    vi.mocked(getTeacherCourse).mockResolvedValue({
      data: makeCourse({ latestRevisionStatus: 'PENDING_REVIEW', hasEditableRevision: false, imageUrl: null }),
    } as AxiosResponse<never> as Awaited<ReturnType<typeof getTeacherCourse>>)
    let rejectUpload: ((reason?: unknown) => void) | undefined
    vi.mocked(uploadCourseRevisionCover).mockReturnValue(new Promise((_, reject) => {
      rejectUpload = reject
    }) as never)

    renderBuilderPage()
    await screen.findByText('Tải ảnh bìa')
    const input = screen.getByText('Tải ảnh bìa').closest('label')?.querySelector('input') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['cover'], 'cover.png', { type: 'image/png' })] } })
    await screen.findByRole('img', { name: 'Xem trước ảnh bìa đã cắt theo tỉ lệ 16:9' })
    fireEvent.click(screen.getByRole('button', { name: 'Dùng ảnh bìa này' }))
    await waitFor(() => expect(uploadCourseRevisionCover).toHaveBeenCalled())
    expect(input).toBeDisabled()
    rejectUpload?.({
      response: { status: 400, data: { message: 'Ảnh bìa không hợp lệ.' } },
    })
    expect(await screen.findByText('Không thể tải ảnh bìa khóa học.')).toBeInTheDocument()
  })
})
