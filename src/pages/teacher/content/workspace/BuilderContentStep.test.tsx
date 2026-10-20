import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCourseAudioTargets } from '../../../../lib/api/teacherLessonAudioApi'
import type { CourseAudioTargets, TeacherCourse, TeacherLesson } from '../../../../lib/api/types'
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
      lessons: [lesson],
    },
  ],
}

const targets: { data: CourseAudioTargets } = {
  data: {
    courseId: 1,
    revisionId: 21,
    revisionStatus: 'DRAFT',
    lessons: [
      {
        lessonRevisionId: 10,
        sourceLessonId: null,
        topicRevisionId: 15,
        topicTitle: 'Listening topic',
        title: lesson.title,
        skillType: 'LISTENING',
        orderIndex: 1,
        audioUrl: lesson.audioUrl,
        audioPublicId: lesson.audioPublicId,
      },
    ],
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetTargets.mockResolvedValue(targets as never)
})

describe('BuilderContentStep', () => {
  it('shows the audio editor for the selected listening lesson', async () => {
    render(
      <MemoryRouter>
        <BuilderContentStep
          course={course}
          action={null}
          busy={false}
          editable={false}
          selectedTopic={null}
          selectedLesson={lesson}
          topicInitialValue={null}
          lessonInitialValue={{
            title: lesson.title,
            description: lesson.description ?? '',
            content: lesson.content ?? '',
            skillType: lesson.skillType,
            orderIndex: lesson.orderIndex,
            xpReward: lesson.xpReward,
            placementTest: lesson.placementTest,
          }}
          onSelectTopic={vi.fn()}
          onSelectLesson={vi.fn()}
          onAddTopic={vi.fn()}
          onAddLesson={vi.fn()}
          onUpdateTopic={vi.fn()}
          onUpdateLesson={vi.fn()}
          onDeleteRequest={vi.fn()}
          onAudioChanged={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Audio bài học')).toBeInTheDocument()
    expect(await screen.findByLabelText('Audio bài nghe')).toHaveAttribute('src', lesson.audioUrl)
  })
})
