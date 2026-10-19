import { expect, it, vi } from 'vitest'
import { http } from './client'
import { getCourseSubmission, getLatestCourseSubmission, submitTeacherCourse } from './teacherContentApi'

vi.mock('./client', () => ({ http: { get: vi.fn(), post: vi.fn() } }))

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
