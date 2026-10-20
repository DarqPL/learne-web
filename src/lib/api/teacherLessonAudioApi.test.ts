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

    await uploadLessonAudio(31, file)

    expect(mockedPost).toHaveBeenCalledTimes(1)
    const [url, body] = mockedPost.mock.calls[0]
    expect(url).toBe('/api/teacher/content/lesson-revisions/31/audio')
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).get('file')).toBe(file)
  })

  it('deletes audio from the revision endpoint', async () => {
    mockedDelete.mockResolvedValue({ data: { id: 31 } })

    await deleteLessonAudio(31)

    expect(mockedDelete).toHaveBeenCalledWith('/api/teacher/content/lesson-revisions/31/audio')
  })
})
