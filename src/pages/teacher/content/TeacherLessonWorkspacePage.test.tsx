import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getTeacherCourse } from '../../../lib/api/teacherContentApi'
import { getCourseAudioTargets } from '../../../lib/api/teacherLessonAudioApi'
import type { CourseAudioTargets, TeacherCourse, TeacherLesson } from '../../../lib/api/types'
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

const draftLesson: TeacherLesson = {
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
}

const secondLesson: TeacherLesson = {
  ...draftLesson,
  id: 8,
}

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
      lessons: [draftLesson, secondLesson],
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
        lessonRevisionId: 79,
        sourceLessonId: 9,
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

const revisionTargets: { data: CourseAudioTargets } = {
  data: {
    ...targets.data,
    lessons: [
      {
        ...targets.data.lessons[0],
        lessonRevisionId: 9,
        sourceLessonId: 79,
      },
    ],
  },
}

function NavigateToSecondLesson() {
  const navigate = useNavigate()

  return (
    <button type="button" onClick={() => navigate('/teacher/content/courses/3/lessons/8')}>
      Chuyển bài
    </button>
  )
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/teacher/content/courses/3/lessons/9']}>
      <NavigateToSecondLesson />
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
    mockedGetTargets.mockResolvedValue(revisionTargets as never)

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
    expect(screen.getByLabelText('Audio bài nghe')).toHaveAttribute('src', audioUrl)
  })

  it('resets the lesson edit form when switching to another lesson with identical saved values', async () => {
    renderPage()

    const titleInput = await screen.findByLabelText('Tiêu đề bài học')
    fireEvent.change(titleInput, { target: { value: 'Nháp chưa lưu' } })
    expect(titleInput).toHaveValue('Nháp chưa lưu')

    fireEvent.click(screen.getByRole('button', { name: 'Chuyển bài' }))

    await waitFor(() => expect(screen.getByLabelText('Tiêu đề bài học')).toHaveValue(draftLesson.title))
  })
})
