import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCourseAudioTargets } from '../../../../lib/api/teacherLessonAudioApi'
import type { CourseAudioTargets, TeacherCourse, TeacherLesson, TeacherLessonRequest } from '../../../../lib/api/types'
import { BuilderContentStep } from './BuilderContentStep'

vi.mock('../../../../lib/api/teacherLessonAudioApi', () => ({
  getCourseAudioTargets: vi.fn(),
  uploadLessonAudio: vi.fn(),
  deleteLessonAudio: vi.fn(),
}))

const mockedGetTargets = vi.mocked(getCourseAudioTargets)

const lesson: TeacherLesson = {
  id: 10,
  title: 'Listening practice',
  description: 'Listen and answer.',
  content: 'Answer the questions after listening.',
  audioUrl: 'https://cdn.example.com/audio/listening.mp3',
  audioPublicId: 'courses/listening',
  skillType: 'LISTENING',
  orderIndex: 1,
  xpReward: 20,
  placementTest: false,
  status: 'DRAFT',
  rejectionReason: null,
  questions: [],
}

const secondLesson: TeacherLesson = {
  ...lesson,
  id: 11,
}

const course: TeacherCourse = {
  id: 1,
  name: 'Teacher course',
  description: 'Course description',
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
      name: 'Listening topic',
      description: null,
      orderIndex: 1,
      lessons: [lesson, secondLesson],
    },
  ],
}

const targetAudioUrl = 'https://cdn.example.com/audio/revision.mp3'

const targets: { data: CourseAudioTargets } = {
  data: {
    courseId: 1,
    revisionId: 21,
    revisionStatus: 'DRAFT',
    lessons: [
      {
        lessonRevisionId: 77,
        sourceLessonId: lesson.id,
        topicRevisionId: 15,
        topicTitle: 'Listening topic',
        title: lesson.title,
        skillType: 'LISTENING',
        orderIndex: 1,
        audioUrl: targetAudioUrl,
        audioPublicId: lesson.audioPublicId,
      },
    ],
  },
}

function lessonRequestOf(item: TeacherLesson): TeacherLessonRequest {
  return {
    title: item.title,
    description: item.description ?? '',
    content: item.content ?? '',
    skillType: item.skillType,
    orderIndex: item.orderIndex,
    xpReward: item.xpReward,
    placementTest: item.placementTest,
  }
}

function stepElement(selectedLesson: TeacherLesson, editable = false) {
  return (
    <MemoryRouter>
      <BuilderContentStep
        course={course}
        action={null}
        busy={false}
        editable={editable}
        selectedTopic={null}
        selectedLesson={selectedLesson}
        topicInitialValue={null}
        lessonInitialValue={lessonRequestOf(selectedLesson)}
        onSelectTopic={vi.fn()}
        onSelectLesson={vi.fn()}
        onAddTopic={vi.fn()}
        onAddLesson={vi.fn()}
        onUpdateTopic={vi.fn()}
        onUpdateLesson={vi.fn()}
        onDeleteRequest={vi.fn()}
        onAudioChanged={vi.fn()}
      />
    </MemoryRouter>
  )
}

function renderStep(selectedLesson: TeacherLesson, editable = false) {
  return render(stepElement(selectedLesson, editable))
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetTargets.mockResolvedValue(targets as never)
})

describe('BuilderContentStep', () => {
  it('shows the audio editor for the selected listening lesson', async () => {
    renderStep(lesson)

    expect(screen.getByText('Audio bài học')).toBeInTheDocument()
    expect(await screen.findByLabelText('Audio bài nghe')).toHaveAttribute('src', targetAudioUrl)
    expect(mockedGetTargets).toHaveBeenCalledWith(course.id)
  })

  it('does not carry unsaved edits to another lesson with identical saved values', async () => {
    const { rerender } = renderStep(lesson, true)
    await screen.findByLabelText('Audio bài nghe')

    const titleInput = screen.getByLabelText('Tiêu đề bài học')
    fireEvent.change(titleInput, { target: { value: 'Nháp chưa lưu' } })
    expect(titleInput).toHaveValue('Nháp chưa lưu')

    rerender(stepElement(secondLesson, true))

    expect(screen.getByLabelText('Tiêu đề bài học')).toHaveValue(secondLesson.title)
  })
})
