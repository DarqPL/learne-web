import { expect, it, vi } from 'vitest'
import { http } from './client'
import {
  cancelCourseCoverProposal,
  getCourseSubmission,
  getCourseCoverState,
  getLatestCourseSubmission,
  removeCourseRevisionCover,
  submitTeacherCourse,
  uploadCourseRevisionCover,
} from './teacherContentApi'

vi.mock('./client', () => ({ http: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }))

it('forwards AbortSignal on exact and latest submission queries', () => {
  const signal = new AbortController().signal
  getCourseSubmission(7, 'submission-id', signal)
  getLatestCourseSubmission(7, signal)
  expect(http.get).toHaveBeenNthCalledWith(1, '/api/teacher/content/courses/7/submissions/submission-id', { signal })
  expect(http.get).toHaveBeenNthCalledWith(2, '/api/teacher/content/courses/7/submission', { signal })
})

it('returns the accepted submission response without changing it into a course', async () => {
  const response = { status: 202, data: { id: 's1', courseId: 7, status: 'QUEUED' } }
  vi.mocked(http.post).mockResolvedValue(response)
  expect(await submitTeacherCourse(7)).toBe(response)
})

it('fetches authoritative cover review state for a course', () => {
  vi.mocked(http.get).mockClear()
  getCourseCoverState(17)

  expect(http.get).toHaveBeenCalledWith('/api/teacher/content/courses/17/cover-image')
})

it('routes cancellation and revision candidates to their moderated endpoints', () => {
  const file = new File(['jpeg'], 'cover.jpg', { type: 'image/jpeg' })
  vi.mocked(http.delete).mockClear()
  vi.mocked(http.post).mockClear()

  cancelCourseCoverProposal(17)
  uploadCourseRevisionCover(17, file)
  removeCourseRevisionCover(17)

  expect(http.delete).toHaveBeenNthCalledWith(1, '/api/teacher/content/courses/17/cover-image/pending')
  expect(http.post).toHaveBeenCalledWith(
    '/api/teacher/content/courses/17/cover-image/revision',
    expect.any(FormData),
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  expect(http.delete).toHaveBeenNthCalledWith(2, '/api/teacher/content/courses/17/cover-image/revision')
})
