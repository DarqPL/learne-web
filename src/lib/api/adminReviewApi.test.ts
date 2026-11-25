import { expect, it, vi } from 'vitest'
import { http } from './client'
import {
  approveCourseCoverReview,
  getCourseCoverReview,
  listPendingCourseCoverReviews,
  rejectCourseCoverReview,
} from './adminReviewApi'

vi.mock('./client', () => ({ http: { get: vi.fn(), post: vi.fn() } }))

it('uses the cursor endpoint for the standalone cover review queue', () => {
  vi.mocked(http.get).mockClear()

  listPendingCourseCoverReviews({ size: 10, cursor: 'next-page' })

  expect(http.get).toHaveBeenCalledWith('/api/admin/content/course-covers/pending', {
    params: { size: 10, cursor: 'next-page' },
  })
})

it('loads and decides a specific standalone cover review', () => {
  vi.mocked(http.get).mockClear()
  vi.mocked(http.post).mockClear()

  getCourseCoverReview(21)
  approveCourseCoverReview(21)
  rejectCourseCoverReview(21, { reason: 'Ảnh không phù hợp' })

  expect(http.get).toHaveBeenCalledWith('/api/admin/content/course-covers/21')
  expect(http.post).toHaveBeenNthCalledWith(1, '/api/admin/content/course-covers/21/approve', {})
  expect(http.post).toHaveBeenNthCalledWith(2, '/api/admin/content/course-covers/21/reject', {
    reason: 'Ảnh không phù hợp',
  })
})
