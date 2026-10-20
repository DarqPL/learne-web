import type { AxiosProgressEvent } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from './client'
import { deleteLessonAudio, getCourseAudioTargets, uploadLessonAudio } from './teacherLessonAudioApi'

vi.mock('./client', () => ({
  http: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

const mockedGet = vi.mocked(http.get)
const mockedPost = vi.mocked(http.post)
const mockedDelete = vi.mocked(http.delete)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('teacherLessonAudioApi', () => {
  it('gets audio targets from the discovery endpoint', async () => {
    mockedGet.mockResolvedValue({ data: { courseId: 10, revisionId: 21, revisionStatus: 'DRAFT', lessons: [] } })

    await getCourseAudioTargets(10)

    expect(mockedGet).toHaveBeenCalledWith('/api/teacher/content/courses/10/audio-targets')
  })

  it('uploads audio as multipart form data to the revision endpoint', async () => {
    mockedPost.mockResolvedValue({ data: { id: 31 } })
    const file = new File(['audio'], 'voice.mp3', { type: 'audio/mpeg' })
    const onProgress = vi.fn()

    await uploadLessonAudio(31, file, onProgress)

    expect(mockedPost).toHaveBeenCalledTimes(1)
    const [url, body, config] = mockedPost.mock.calls[0]
    expect(url).toBe('/api/teacher/content/lesson-revisions/31/audio')
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).get('file')).toBe(file)
    expect(config?.headers).toMatchObject({ 'Content-Type': 'multipart/form-data' })

    config?.onUploadProgress?.({ loaded: 5, total: 10 } as AxiosProgressEvent)
    expect(onProgress).toHaveBeenCalledWith(50)

    config?.onUploadProgress?.({ loaded: 5 } as AxiosProgressEvent)
    expect(onProgress).toHaveBeenCalledTimes(1)
  })

  it('deletes audio from the revision endpoint', async () => {
    mockedDelete.mockResolvedValue({ data: { id: 31 } })

    await deleteLessonAudio(31)

    expect(mockedDelete).toHaveBeenCalledWith('/api/teacher/content/lesson-revisions/31/audio')
  })
})
