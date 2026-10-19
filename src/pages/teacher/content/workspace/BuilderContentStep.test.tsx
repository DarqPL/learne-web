import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { TeacherCourse, TeacherLesson } from '../../../../lib/api/types'
import { BuilderContentStep } from './BuilderContentStep'

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

describe('BuilderContentStep', () => {
  it('shows the lesson audio player when a teacher views an imported listening lesson', () => {
    render(
      <MemoryRouter>
        <BuilderContentStep
          course={course}
          action={null}
          busy={false}
          editingState={{ kind: 'read-only', reason: 'Đã duyệt' }}
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
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Audio bài nghe')).toBeInTheDocument()
    expect(screen.getByLabelText('Audio bài nghe')).toHaveAttribute('src', lesson.audioUrl)
  })
})
