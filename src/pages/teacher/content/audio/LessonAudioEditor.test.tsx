import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
  vi.clearAllMocks()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

describe('LessonAudioEditor', () => {
  it('renders nothing for a non-listening lesson and makes no request', () => {
    const { container } = render(<LessonAudioEditor courseId={10} lesson={lessonOf({ skillType: 'GRAMMAR' })} editable />)

    expect(container).toBeEmptyDOMElement()
    expect(mockedGetTargets).not.toHaveBeenCalled()
  })

  it('shows the player and management actions when audio exists', async () => {
    mockedGetTargets.mockResolvedValue(targetsOf([audioTarget]) as never)

    render(<LessonAudioEditor courseId={10} lesson={lessonOf()} editable />)

    expect(await screen.findByLabelText('Audio bài nghe')).toHaveAttribute('src', audioTarget.audioUrl)
    expect(screen.getByRole('button', { name: 'Thay audio' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Xóa audio' })).toBeInTheDocument()
  })

  it('shows the empty state when the lesson has no audio', async () => {
    mockedGetTargets.mockResolvedValue(targetsOf([{ ...audioTarget, audioUrl: null, audioPublicId: null }]) as never)

    render(<LessonAudioEditor courseId={10} lesson={lessonOf()} editable />)

    expect(await screen.findByText('Chưa có audio.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tải audio lên' })).toBeInTheDocument()
  })

  it('is read-only when the lesson is not editable', async () => {
    mockedGetTargets.mockResolvedValue(targetsOf([audioTarget]) as never)

    render(<LessonAudioEditor courseId={10} lesson={lessonOf()} editable={false} />)

    expect(await screen.findByText('Tạo bản nháp chỉnh sửa để thay audio.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Thay audio' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Xóa audio' })).not.toBeInTheDocument()
  })

  it('falls back to read-only when discovery returns a conflict', async () => {
    mockedGetTargets.mockRejectedValue(axiosError(409))

    render(<LessonAudioEditor courseId={10} lesson={lessonOf()} editable />)

    expect(await screen.findByText('Tạo bản nháp chỉnh sửa để thay audio.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tải audio lên' })).not.toBeInTheDocument()
  })

  it('shows an error and no actions when discovery fails unexpectedly', async () => {
    mockedGetTargets.mockRejectedValue(axiosError(500, 'boom'))

    render(<LessonAudioEditor courseId={10} lesson={lessonOf()} editable />)

    expect(await screen.findByText('Không tải được audio')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tải audio lên' })).not.toBeInTheDocument()
  })

  it('resolves a live lesson through sourceLessonId and uploads with the revision id', async () => {
    mockedGetTargets.mockResolvedValue(targetsOf([audioTarget]) as never)
    mockedUpload.mockResolvedValue({
      data: { ...audioTarget, audioUrl: 'https://cdn.example.com/audio/new.mp3', audioPublicId: 'learne/course-audio/new' },
    } as never)
    const onAudioChanged = vi.fn()

    render(<LessonAudioEditor courseId={10} lesson={lessonOf({ id: 7 })} editable onAudioChanged={onAudioChanged} />)

    const input = await screen.findByLabelText('Chọn file audio')
    fireEvent.change(input, { target: { files: [new File(['audio'], 'voice.mp3', { type: 'audio/mpeg' })] } })

    await waitFor(() => expect(mockedUpload).toHaveBeenCalledTimes(1))
    expect(mockedUpload.mock.calls[0][0]).toBe(31)
    expect(onAudioChanged).toHaveBeenCalledWith({
      audioUrl: 'https://cdn.example.com/audio/new.mp3',
      audioPublicId: 'learne/course-audio/new',
    })
  })

  it('rejects an empty file without calling the API', async () => {
    mockedGetTargets.mockResolvedValue(targetsOf([audioTarget]) as never)

    render(<LessonAudioEditor courseId={10} lesson={lessonOf()} editable />)

    const input = await screen.findByLabelText('Chọn file audio')
    fireEvent.change(input, { target: { files: [new File([], 'empty.mp3', { type: 'audio/mpeg' })] } })

    expect(await screen.findByText('Vui lòng chọn file audio.')).toBeInTheDocument()
    expect(mockedUpload).not.toHaveBeenCalled()
  })

  it('rejects a file larger than 20MB without calling the API', async () => {
    mockedGetTargets.mockResolvedValue(targetsOf([audioTarget]) as never)

    render(<LessonAudioEditor courseId={10} lesson={lessonOf()} editable />)

    const input = await screen.findByLabelText('Chọn file audio')
    const big = new File(['x'], 'big.mp3', { type: 'audio/mpeg' })
    Object.defineProperty(big, 'size', { value: 21 * 1024 * 1024 })
    fireEvent.change(input, { target: { files: [big] } })

    expect(await screen.findByText('File vượt quá 20MB cho phép.')).toBeInTheDocument()
    expect(mockedUpload).not.toHaveBeenCalled()
  })

  it('rejects an unsupported file type without calling the API', async () => {
    mockedGetTargets.mockResolvedValue(targetsOf([audioTarget]) as never)

    render(<LessonAudioEditor courseId={10} lesson={lessonOf()} editable />)

    const input = await screen.findByLabelText('Chọn file audio')
    fireEvent.change(input, { target: { files: [new File(['x'], 'notes.txt', { type: 'text/plain' })] } })

    expect(await screen.findByText('Chỉ hỗ trợ file MP3, WAV, M4A hoặc OGG.')).toBeInTheDocument()
    expect(mockedUpload).not.toHaveBeenCalled()
  })

  it('keeps the existing audio when upload fails with 413', async () => {
    mockedGetTargets.mockResolvedValue(targetsOf([audioTarget]) as never)
    mockedUpload.mockRejectedValue(axiosError(413, 'too large'))

    render(<LessonAudioEditor courseId={10} lesson={lessonOf()} editable />)

    const input = await screen.findByLabelText('Chọn file audio')
    fireEvent.change(input, { target: { files: [new File(['audio'], 'voice.mp3', { type: 'audio/mpeg' })] } })

    expect(await screen.findByText('File vượt quá 20MB cho phép.')).toBeInTheDocument()
    expect(screen.getByLabelText('Audio bài nghe')).toHaveAttribute('src', audioTarget.audioUrl)
  })

  it('deletes audio through the revision endpoint', async () => {
    mockedGetTargets.mockResolvedValue(targetsOf([audioTarget]) as never)
    mockedDelete.mockResolvedValue({ data: { ...audioTarget, audioUrl: null, audioPublicId: null } } as never)
    const onAudioChanged = vi.fn()

    render(<LessonAudioEditor courseId={10} lesson={lessonOf()} editable onAudioChanged={onAudioChanged} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Xóa audio' }))

    await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith(31))
    expect(onAudioChanged).toHaveBeenCalledWith({ audioUrl: null, audioPublicId: null })
    await waitFor(() => expect(screen.queryByLabelText('Audio bài nghe')).not.toBeInTheDocument())
  })
})
