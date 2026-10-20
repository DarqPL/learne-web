import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteLessonAudio, getCourseAudioTargets, uploadLessonAudio } from '../../../../lib/api/teacherLessonAudioApi'
import type { CourseAudioTargets, LessonAudioTarget, TeacherLesson } from '../../../../lib/api/types'
import { LessonAudioEditor } from './LessonAudioEditor'

vi.mock('../../../../lib/api/teacherLessonAudioApi', () => ({
  getCourseAudioTargets: vi.fn(),
  uploadLessonAudio: vi.fn(),
  deleteLessonAudio: vi.fn(),
}))

const mockedGetTargets = vi.mocked(getCourseAudioTargets)
const mockedUpload = vi.mocked(uploadLessonAudio)
const mockedDelete = vi.mocked(deleteLessonAudio)

function axiosError(status: number, message = 'error') {
  return Object.assign(new Error(message), { isAxiosError: true, response: { status, data: { message } } })
}

function lessonOf(overrides: Partial<TeacherLesson> = {}): Pick<TeacherLesson, 'id' | 'title' | 'skillType'> & { audioUrl: string | null; audioPublicId: string | null } {
  return {
    id: 31,
    title: 'Morning routine',
    skillType: 'LISTENING',
    audioUrl: null,
    audioPublicId: null,
    ...overrides,
  }
}

function targetsOf(lessons: LessonAudioTarget[]): { data: CourseAudioTargets } {
  return { data: { courseId: 10, revisionId: 21, revisionStatus: 'DRAFT', lessons } }
}

function renderEditor(props: Partial<ComponentProps<typeof LessonAudioEditor>> = {}) {
  return render(
    <LessonAudioEditor courseId={10} lesson={lessonOf()} editable lessonIdNamespace="revision" {...props} />,
  )
}

const audioTarget: LessonAudioTarget = {
  lessonRevisionId: 31,
  sourceLessonId: 7,
  topicRevisionId: 15,
  topicTitle: 'Daily life',
  title: 'Morning routine',
  skillType: 'LISTENING',
  orderIndex: 1,
  audioUrl: 'https://cdn.example.com/audio/old.mp3',
  audioPublicId: 'learne/course-audio/old',
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('LessonAudioEditor', () => {
  it('renders nothing for a non-listening lesson and makes no request', () => {
    const { container } = renderEditor({ lesson: lessonOf({ skillType: 'GRAMMAR' }) })

    expect(container).toBeEmptyDOMElement()
    expect(mockedGetTargets).not.toHaveBeenCalled()
  })

  it('shows the player and management actions when audio exists', async () => {
    mockedGetTargets.mockResolvedValue(targetsOf([audioTarget]) as never)

    renderEditor()

    expect(await screen.findByLabelText('Audio bài nghe')).toHaveAttribute('src', audioTarget.audioUrl)
    expect(screen.getByRole('button', { name: 'Thay audio' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Xóa audio' })).toBeInTheDocument()
  })

  it('shows the empty state when the lesson has no audio', async () => {
    mockedGetTargets.mockResolvedValue(targetsOf([{ ...audioTarget, audioUrl: null, audioPublicId: null }]) as never)

    renderEditor()

    expect(await screen.findByText('Chưa có audio.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tải audio lên' })).toBeInTheDocument()
  })

  it('is read-only when the lesson is not editable', async () => {
    mockedGetTargets.mockResolvedValue(targetsOf([audioTarget]) as never)

    renderEditor({ editable: false })

    expect(await screen.findByText('Tạo bản nháp chỉnh sửa để thay audio.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Thay audio' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Xóa audio' })).not.toBeInTheDocument()
  })

  it('falls back to read-only when discovery returns a conflict', async () => {
    mockedGetTargets.mockRejectedValue(axiosError(409))

    renderEditor()

    expect(await screen.findByText('Tạo bản nháp chỉnh sửa để thay audio.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tải audio lên' })).not.toBeInTheDocument()
  })

  it('shows an error and no actions when discovery fails unexpectedly', async () => {
    mockedGetTargets.mockRejectedValue(axiosError(500, 'boom'))

    renderEditor()

    expect(await screen.findByText('Không tải được audio')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tải audio lên' })).not.toBeInTheDocument()
  })

  it('resolves a live lesson through sourceLessonId and uploads with the revision id', async () => {
    mockedGetTargets.mockResolvedValue(targetsOf([audioTarget]) as never)
    mockedUpload.mockResolvedValue({
      data: { ...audioTarget, audioUrl: 'https://cdn.example.com/audio/new.mp3', audioPublicId: 'learne/course-audio/new' },
    } as never)
    const onAudioChanged = vi.fn()

    renderEditor({ lesson: lessonOf({ id: 7 }), lessonIdNamespace: 'live', onAudioChanged })

    const input = await screen.findByLabelText('Chọn file audio')
    fireEvent.change(input, { target: { files: [new File(['audio'], 'voice.mp3', { type: 'audio/mpeg' })] } })

    await waitFor(() => expect(mockedUpload).toHaveBeenCalledTimes(1))
    expect(mockedUpload.mock.calls[0][0]).toBe(31)
    await waitFor(() =>
      expect(screen.getByLabelText('Audio bài nghe')).toHaveAttribute('src', 'https://cdn.example.com/audio/new.mp3'),
    )
    expect(onAudioChanged).toHaveBeenCalledWith({
      audioUrl: 'https://cdn.example.com/audio/new.mp3',
      audioPublicId: 'learne/course-audio/new',
    })
  })

  it('re-resolves the revision id before uploading', async () => {
    const freshTarget = { ...audioTarget, lessonRevisionId: 99 }
    mockedGetTargets
      .mockResolvedValueOnce(targetsOf([audioTarget]) as never)
      .mockResolvedValueOnce(targetsOf([freshTarget]) as never)
    mockedUpload.mockResolvedValue({
      data: { ...freshTarget, audioUrl: 'https://cdn.example.com/audio/fresh.mp3', audioPublicId: 'learne/course-audio/fresh' },
    } as never)

    renderEditor({ lesson: lessonOf({ id: 7 }), lessonIdNamespace: 'live' })

    const input = await screen.findByLabelText('Chọn file audio')
    fireEvent.change(input, { target: { files: [new File(['audio'], 'voice.mp3', { type: 'audio/mpeg' })] } })

    await waitFor(() => expect(mockedUpload).toHaveBeenCalledTimes(1))
    expect(mockedUpload.mock.calls[0][0]).toBe(99)
  })

  it('locks when a failed upload can no longer resolve a target', async () => {
    mockedGetTargets
      .mockResolvedValueOnce(targetsOf([audioTarget]) as never)
      .mockResolvedValueOnce(targetsOf([audioTarget]) as never)
      .mockResolvedValueOnce(targetsOf([]) as never)
    mockedUpload.mockRejectedValue(axiosError(409))

    renderEditor()

    const input = await screen.findByLabelText('Chọn file audio')
    fireEvent.change(input, { target: { files: [new File(['audio'], 'voice.mp3', { type: 'audio/mpeg' })] } })

    expect(await screen.findByText('Tạo bản nháp chỉnh sửa để thay audio.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Thay audio' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tải audio lên' })).not.toBeInTheDocument()
  })

  it('does not upload when the fresh resolve finds no target', async () => {
    mockedGetTargets
      .mockResolvedValueOnce(targetsOf([audioTarget]) as never)
      .mockResolvedValueOnce(targetsOf([]) as never)

    renderEditor()

    const input = await screen.findByLabelText('Chọn file audio')
    fireEvent.change(input, { target: { files: [new File(['audio'], 'voice.mp3', { type: 'audio/mpeg' })] } })

    expect(await screen.findByText('Tạo bản nháp chỉnh sửa để thay audio.')).toBeInTheDocument()
    expect(mockedUpload).not.toHaveBeenCalled()
  })

  it('resets message and override when the lesson changes', async () => {
    const uploaded = {
      ...audioTarget,
      audioUrl: 'https://cdn.example.com/audio/first.mp3',
      audioPublicId: 'learne/course-audio/first',
    }
    const otherTarget = {
      ...audioTarget,
      lessonRevisionId: 77,
      sourceLessonId: 7,
      title: 'Other',
      audioUrl: 'https://cdn.example.com/audio/other.mp3',
      audioPublicId: 'learne/course-audio/other',
    }
    mockedGetTargets
      .mockResolvedValueOnce(targetsOf([audioTarget]) as never)
      .mockResolvedValueOnce(targetsOf([audioTarget]) as never)
      .mockResolvedValueOnce(targetsOf([otherTarget]) as never)
    mockedUpload.mockResolvedValue({ data: uploaded } as never)

    const { rerender } = renderEditor()

    const input = await screen.findByLabelText('Chọn file audio')
    fireEvent.change(input, { target: { files: [new File(['audio'], 'voice.mp3', { type: 'audio/mpeg' })] } })

    await waitFor(() => expect(screen.getByLabelText('Audio bài nghe')).toHaveAttribute('src', uploaded.audioUrl))

    fireEvent.change(input, { target: { files: [new File([], 'empty.mp3', { type: 'audio/mpeg' })] } })
    expect(await screen.findByText('Vui lòng chọn file audio.')).toBeInTheDocument()

    rerender(
      <LessonAudioEditor
        courseId={10}
        lesson={lessonOf({ id: 7, title: 'Other' })}
        editable
        lessonIdNamespace="live"
      />,
    )

    await waitFor(() =>
      expect(screen.getByLabelText('Audio bài nghe')).toHaveAttribute('src', otherTarget.audioUrl),
    )
    expect(screen.queryByText('Vui lòng chọn file audio.')).not.toBeInTheDocument()
  })

  it('rejects an empty file without calling the API', async () => {
    mockedGetTargets.mockResolvedValue(targetsOf([audioTarget]) as never)

    renderEditor()

    const input = await screen.findByLabelText('Chọn file audio')
    fireEvent.change(input, { target: { files: [new File([], 'empty.mp3', { type: 'audio/mpeg' })] } })

    expect(await screen.findByText('Vui lòng chọn file audio.')).toBeInTheDocument()
    expect(mockedUpload).not.toHaveBeenCalled()
  })

  it('rejects a file larger than 20MB without calling the API', async () => {
    mockedGetTargets.mockResolvedValue(targetsOf([audioTarget]) as never)

    renderEditor()

    const input = await screen.findByLabelText('Chọn file audio')
    const big = new File(['x'], 'big.mp3', { type: 'audio/mpeg' })
    Object.defineProperty(big, 'size', { value: 21 * 1024 * 1024 })
    fireEvent.change(input, { target: { files: [big] } })

    expect(await screen.findByText('File vượt quá 20MB cho phép.')).toBeInTheDocument()
    expect(mockedUpload).not.toHaveBeenCalled()
  })

  it('rejects an unsupported file type without calling the API', async () => {
    mockedGetTargets.mockResolvedValue(targetsOf([audioTarget]) as never)

    renderEditor()

    const input = await screen.findByLabelText('Chọn file audio')
    fireEvent.change(input, { target: { files: [new File(['x'], 'notes.txt', { type: 'text/plain' })] } })

    expect(await screen.findByText('Chỉ hỗ trợ file MP3, WAV, M4A hoặc OGG.')).toBeInTheDocument()
    expect(mockedUpload).not.toHaveBeenCalled()
  })

  it('keeps the existing audio when upload fails with 413', async () => {
    mockedGetTargets.mockResolvedValue(targetsOf([audioTarget]) as never)
    mockedUpload.mockRejectedValue(axiosError(413, 'too large'))

    renderEditor()

    const input = await screen.findByLabelText('Chọn file audio')
    fireEvent.change(input, { target: { files: [new File(['audio'], 'voice.mp3', { type: 'audio/mpeg' })] } })

    expect(await screen.findByText('File vượt quá 20MB cho phép.')).toBeInTheDocument()
    expect(screen.getByLabelText('Audio bài nghe')).toHaveAttribute('src', audioTarget.audioUrl)
  })

  it('re-resolves the revision id before deleting', async () => {
    const freshTarget = { ...audioTarget, lessonRevisionId: 99 }
    mockedGetTargets
      .mockResolvedValueOnce(targetsOf([audioTarget]) as never)
      .mockResolvedValueOnce(targetsOf([freshTarget]) as never)
    mockedDelete.mockResolvedValue({ data: { ...freshTarget, audioUrl: null, audioPublicId: null } } as never)

    renderEditor({ lesson: lessonOf({ id: 7 }), lessonIdNamespace: 'live' })

    fireEvent.click(await screen.findByRole('button', { name: 'Xóa audio' }))

    await waitFor(() => expect(mockedDelete).toHaveBeenCalledTimes(1))
    expect(mockedDelete).toHaveBeenCalledWith(99)
  })

  it('locks and shows the conflict message when delete can no longer resolve a target', async () => {
    mockedGetTargets
      .mockResolvedValueOnce(targetsOf([audioTarget]) as never)
      .mockResolvedValueOnce(targetsOf([audioTarget]) as never)
      .mockResolvedValueOnce(targetsOf([]) as never)
    mockedDelete.mockRejectedValue(axiosError(409))

    renderEditor()

    fireEvent.click(await screen.findByRole('button', { name: 'Xóa audio' }))

    expect(
      await screen.findByText('Nội dung đã thay đổi hoặc không còn cho sửa. Vui lòng tải lại trang.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Tạo bản nháp chỉnh sửa để thay audio.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Thay audio' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Xóa audio' })).not.toBeInTheDocument()
  })

  it('keeps the audio and reports a delete-specific error when deletion fails', async () => {
    mockedGetTargets.mockResolvedValue(targetsOf([audioTarget]) as never)
    mockedDelete.mockRejectedValue(axiosError(500, 'boom'))

    renderEditor()

    fireEvent.click(await screen.findByRole('button', { name: 'Xóa audio' }))

    expect(await screen.findByText('Không thể xóa audio, vui lòng thử lại.')).toBeInTheDocument()
    expect(screen.getByLabelText('Audio bài nghe')).toHaveAttribute('src', audioTarget.audioUrl)
  })

  it('does not delete when confirmation is cancelled', async () => {
    vi.mocked(window.confirm).mockReturnValue(false)
    mockedGetTargets.mockResolvedValue(targetsOf([audioTarget]) as never)

    renderEditor()

    fireEvent.click(await screen.findByRole('button', { name: 'Xóa audio' }))

    await waitFor(() => expect(window.confirm).toHaveBeenCalled())
    expect(mockedDelete).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Audio bài nghe')).toHaveAttribute('src', audioTarget.audioUrl)
  })

  it('deletes audio through the revision endpoint', async () => {
    mockedGetTargets.mockResolvedValue(targetsOf([audioTarget]) as never)
    mockedDelete.mockResolvedValue({ data: { ...audioTarget, audioUrl: null, audioPublicId: null } } as never)
    const onAudioChanged = vi.fn()

    renderEditor({ onAudioChanged })

    fireEvent.click(await screen.findByRole('button', { name: 'Xóa audio' }))

    await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith(31))
    expect(onAudioChanged).toHaveBeenCalledWith({ audioUrl: null, audioPublicId: null })
    await waitFor(() => expect(screen.queryByLabelText('Audio bài nghe')).not.toBeInTheDocument())
  })

  it('resolves a live lesson id against the live namespace when ids collide', async () => {
    const unrelatedRevisionTarget: LessonAudioTarget = {
      lessonRevisionId: 7,
      sourceLessonId: null,
      topicRevisionId: 15,
      topicTitle: 'Unrelated topic',
      title: 'Unrelated lesson',
      skillType: 'LISTENING',
      orderIndex: 1,
      audioUrl: 'https://cdn.example.com/audio/unrelated.mp3',
      audioPublicId: 'learne/course-audio/unrelated',
    }
    const selectedLiveTarget: LessonAudioTarget = {
      ...audioTarget,
      lessonRevisionId: 31,
      sourceLessonId: 7,
      audioUrl: 'https://cdn.example.com/audio/selected.mp3',
      audioPublicId: 'learne/course-audio/selected',
    }
    mockedGetTargets.mockResolvedValue(
      targetsOf([unrelatedRevisionTarget, selectedLiveTarget]) as never,
    )
    mockedUpload.mockResolvedValue({
      data: { ...selectedLiveTarget, audioUrl: 'https://cdn.example.com/audio/new.mp3', audioPublicId: 'learne/course-audio/new' },
    } as never)

    renderEditor({ lesson: lessonOf({ id: 7 }), lessonIdNamespace: 'live' })

    expect(await screen.findByLabelText('Audio bài nghe')).toHaveAttribute('src', selectedLiveTarget.audioUrl)

    const input = screen.getByLabelText('Chọn file audio')
    fireEvent.change(input, { target: { files: [new File(['audio'], 'voice.mp3', { type: 'audio/mpeg' })] } })

    await waitFor(() => expect(mockedUpload).toHaveBeenCalledTimes(1))
    expect(mockedUpload.mock.calls[0][0]).toBe(31)
  })

  it('resolves a revision lesson id against the revision namespace when ids collide', async () => {
    const unrelatedRevisionTarget: LessonAudioTarget = {
      lessonRevisionId: 7,
      sourceLessonId: null,
      topicRevisionId: 15,
      topicTitle: 'Unrelated topic',
      title: 'Unrelated lesson',
      skillType: 'LISTENING',
      orderIndex: 1,
      audioUrl: 'https://cdn.example.com/audio/unrelated.mp3',
      audioPublicId: 'learne/course-audio/unrelated',
    }
    const selectedLiveTarget: LessonAudioTarget = {
      ...audioTarget,
      lessonRevisionId: 31,
      sourceLessonId: 7,
      audioUrl: 'https://cdn.example.com/audio/selected.mp3',
      audioPublicId: 'learne/course-audio/selected',
    }
    mockedGetTargets.mockResolvedValue(
      targetsOf([unrelatedRevisionTarget, selectedLiveTarget]) as never,
    )

    renderEditor({ lesson: lessonOf({ id: 7 }), lessonIdNamespace: 'revision' })

    expect(await screen.findByLabelText('Audio bài nghe')).toHaveAttribute('src', unrelatedRevisionTarget.audioUrl)
  })

  it('does not fall back to a live target in the revision namespace', async () => {
    const liveTarget: LessonAudioTarget = {
      ...audioTarget,
      lessonRevisionId: 31,
      sourceLessonId: 7,
      audioUrl: 'https://cdn.example.com/audio/unrelated.mp3',
      audioPublicId: 'learne/course-audio/unrelated',
    }
    const fallbackAudioUrl = 'https://cdn.example.com/audio/fallback.mp3'
    mockedGetTargets.mockResolvedValue(targetsOf([liveTarget]) as never)

    renderEditor({ lesson: lessonOf({ id: 7, audioUrl: fallbackAudioUrl }), lessonIdNamespace: 'revision' })

    expect(await screen.findByText('Tạo bản nháp chỉnh sửa để thay audio.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Thay audio' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tải audio lên' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Audio bài nghe')).toHaveAttribute('src', fallbackAudioUrl)
  })

  it('does not fall back to a revision target in the live namespace', async () => {
    const revisionTarget: LessonAudioTarget = {
      ...audioTarget,
      lessonRevisionId: 7,
      sourceLessonId: null,
      audioUrl: 'https://cdn.example.com/audio/unrelated.mp3',
      audioPublicId: 'learne/course-audio/unrelated',
    }
    const fallbackAudioUrl = 'https://cdn.example.com/audio/fallback.mp3'
    mockedGetTargets.mockResolvedValue(targetsOf([revisionTarget]) as never)

    renderEditor({ lesson: lessonOf({ id: 7, audioUrl: fallbackAudioUrl }), lessonIdNamespace: 'live' })

    expect(await screen.findByText('Tạo bản nháp chỉnh sửa để thay audio.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Thay audio' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tải audio lên' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Audio bài nghe')).toHaveAttribute('src', fallbackAudioUrl)
    expect(mockedUpload).not.toHaveBeenCalled()
    expect(mockedDelete).not.toHaveBeenCalled()
  })

  it('reports a connection error when the upload request has no response', async () => {
    mockedGetTargets.mockResolvedValue(targetsOf([audioTarget]) as never)
    mockedUpload.mockRejectedValue(Object.assign(new Error('network'), { isAxiosError: true }))

    renderEditor()

    const input = await screen.findByLabelText('Chọn file audio')
    fireEvent.change(input, { target: { files: [new File(['audio'], 'voice.mp3', { type: 'audio/mpeg' })] } })

    expect(await screen.findByText('Không thể kết nối máy chủ.')).toBeInTheDocument()
  })

  it('does not flash the empty state while discovery is loading', async () => {
    let resolveTargets: ((value: unknown) => void) | undefined
    mockedGetTargets.mockReturnValue(
      new Promise((resolve) => {
        resolveTargets = resolve
      }) as never,
    )

    renderEditor()

    expect(screen.queryByText('Chưa có audio.')).not.toBeInTheDocument()
    expect(screen.getByText('Đang tải audio...')).toBeInTheDocument()

    resolveTargets?.(targetsOf([audioTarget]))
    expect(await screen.findByLabelText('Audio bài nghe')).toHaveAttribute('src', audioTarget.audioUrl)
  })

  it('keeps showing the fallback player while discovery is loading', () => {
    mockedGetTargets.mockReturnValue(new Promise(() => {}) as never)
    const fallbackAudioUrl = 'https://cdn.example.com/audio/fallback.mp3'

    renderEditor({ lesson: lessonOf({ audioUrl: fallbackAudioUrl }) })

    expect(screen.getByLabelText('Audio bài nghe')).toHaveAttribute('src', fallbackAudioUrl)
    expect(screen.queryByText('Chưa có audio.')).not.toBeInTheDocument()
  })
})
