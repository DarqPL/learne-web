import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getTeacherCourse } from '../../../lib/api/teacherContentApi'
import { getCourseAudioTargets } from '../../../lib/api/teacherLessonAudioApi'
import type { CourseAudioTargets, TeacherCourse } from '../../../lib/api/types'
import { TeacherLessonWorkspacePage } from './TeacherLessonWorkspacePage'

vi.mock('../../../lib/api/teacherContentApi', () => ({
  getTeacherCourse: vi.fn(),
  updateTeacherLesson: vi.fn(),
  deleteTeacherLesson: vi.fn(),
  createTeacherQuestion: vi.fn(),
  updateTeacherQuestion: vi.fn(),
  deleteTeacherQuestion: vi.fn(),
}))

vi.mock('../../../lib/api/teacherLessonAudioApi', () => ({
  getCourseAudioTargets: vi.fn(),
  uploadLessonAudio: vi.fn(),
  deleteLessonAudio: vi.fn(),
}))

const mockedGetTeacherCourse = vi.mocked(getTeacherCourse)
const mockedGetTargets = vi.mocked(getCourseAudioTargets)

const audioUrl = 'https://cdn.example.com/audio/a.mp3'

const draftCourse: TeacherCourse = {
  id: 3,
  name: 'Course',
  description: null,
  type: 'COMPREHENSIVE',
  level: 'A2',
  orderIndex: 1,
  status: 'DRAFT',
  rejectionReason: null,
  latestRevisionId: null,
  latestRevisionStatus: null,
  hasEditableRevision: true,
  pricingType: 'FREE',
  priceAmountVnd: null,
  proposedPriceAmountVnd: null,
  priceStatus: 'NONE',
  topics: [
    {
      id: 5,
      name: 'Topic',
      description: null,
      orderIndex: 1,
      lessons: [
        {
          id: 9,
          title: 'Listening lesson',
          description: null,
          content: null,
          audioUrl,
          audioPublicId: 'learne/course-audio/a',
          skillType: 'LISTENING',
          orderIndex: 1,
          xpReward: 0,
          placementTest: false,
          status: 'DRAFT',
          rejectionReason: null,
          questions: [],
        },
      ],
    },
  ],
}

const targets: { data: CourseAudioTargets } = {
  data: {
    courseId: 3,
    revisionId: 21,
    revisionStatus: 'DRAFT',
    lessons: [
      {
        lessonRevisionId: 9,
        sourceLessonId: null,
        topicRevisionId: 15,
        topicTitle: 'Topic',
        title: 'Listening lesson',
        skillType: 'LISTENING',
        orderIndex: 1,
        audioUrl,
        audioPublicId: 'learne/course-audio/a',
      },
    ],
  },
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/teacher/content/courses/3/lessons/9']}>
      <Routes>
        <Route path="/teacher/content/courses/:courseId/lessons/:lessonId" element={<TeacherLessonWorkspacePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetTeacherCourse.mockResolvedValue({ data: draftCourse } as never)
  mockedGetTargets.mockResolvedValue(targets as never)
})

describe('TeacherLessonWorkspacePage', () => {
  it('shows the audio editor on a draft lesson page', async () => {
    renderPage()

    expect(await screen.findByText('Audio bài học')).toBeInTheDocument()
    expect(await screen.findByLabelText('Audio bài nghe')).toHaveAttribute('src', audioUrl)
    expect(screen.getByRole('button', { name: 'Thay audio' })).toBeInTheDocument()
  })

  it('lets a published course with an edit draft manage audio', async () => {
    mockedGetTeacherCourse.mockResolvedValue({
      data: { ...draftCourse, status: 'APPROVED', hasEditableRevision: true, latestRevisionStatus: 'DRAFT' },
    } as never)

    renderPage()

    expect(await screen.findByRole('button', { name: 'Thay audio' })).toBeInTheDocument()
  })

  it('shows the audio editor read-only for a pending revision', async () => {
    mockedGetTeacherCourse.mockResolvedValue({
      data: { ...draftCourse, status: 'APPROVED', hasEditableRevision: false, latestRevisionStatus: 'PENDING_REVIEW' },
    } as never)
    mockedGetTargets.mockRejectedValue(
      Object.assign(new Error('conflict'), { isAxiosError: true, response: { status: 409, data: {} } }),
    )

    renderPage()

    expect(await screen.findByText('Tạo bản nháp chỉnh sửa để thay audio.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Thay audio' })).not.toBeInTheDocument()
  })
})
