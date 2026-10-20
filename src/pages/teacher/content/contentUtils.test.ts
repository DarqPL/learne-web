import { describe, expect, it } from 'vitest'
import type { TeacherCourse } from '../../../lib/api/types'
import { isRevisionBackedCourse, mergeLessonAudio } from './contentUtils'

function makeCourse(overrides: Partial<TeacherCourse> = {}): TeacherCourse {
  return {
    id: 1,
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
    ...overrides,
    topics: [
      {
        id: 10,
        name: 'Topic 1',
        description: null,
        orderIndex: 1,
        lessons: [
          {
            id: 100,
            title: 'First lesson',
            description: null,
            content: null,
            audioUrl: 'https://cdn.example.com/old-1.mp3',
            audioPublicId: 'old-1',
            skillType: 'LISTENING',
            orderIndex: 1,
            xpReward: 10,
            placementTest: false,
            status: 'DRAFT',
            rejectionReason: null,
            questions: [],
          },
          {
            id: 101,
            title: 'Second lesson',
            description: null,
            content: null,
            audioUrl: 'https://cdn.example.com/old-2.mp3',
            audioPublicId: 'old-2',
            skillType: 'LISTENING',
            orderIndex: 2,
            xpReward: 20,
            placementTest: false,
            status: 'DRAFT',
            rejectionReason: null,
            questions: [],
          },
        ],
      },
      {
        id: 20,
        name: 'Topic 2',
        description: null,
        orderIndex: 2,
        lessons: [
          {
            id: 200,
            title: 'Third lesson',
            description: null,
            content: null,
            audioUrl: 'https://cdn.example.com/old-3.mp3',
            audioPublicId: 'old-3',
            skillType: 'LISTENING',
            orderIndex: 1,
            xpReward: 30,
            placementTest: false,
            status: 'DRAFT',
            rejectionReason: null,
            questions: [],
          },
        ],
      },
    ],
  }
}

const audio = { audioUrl: 'https://cdn.example.com/new.mp3', audioPublicId: 'new-public-id' }

describe('isRevisionBackedCourse', () => {
  it('is false for a draft course', () => {
    expect(isRevisionBackedCourse(makeCourse({ status: 'DRAFT' }))).toBe(false)
  })

  it('is false for a rejected course', () => {
    expect(isRevisionBackedCourse(makeCourse({ status: 'REJECTED' }))).toBe(false)
  })

  it('is false for an unpublished course pending review', () => {
    expect(isRevisionBackedCourse(makeCourse({ status: 'PENDING_REVIEW' }))).toBe(false)
  })

  it('is true for an approved course with an editable revision', () => {
    expect(isRevisionBackedCourse(makeCourse({ status: 'APPROVED', hasEditableRevision: true }))).toBe(true)
  })

  it('is true for an approved course whose latest revision is pending review', () => {
    expect(
      isRevisionBackedCourse(
        makeCourse({ status: 'APPROVED', hasEditableRevision: false, latestRevisionStatus: 'PENDING_REVIEW' }),
      ),
    ).toBe(true)
  })

  it('is false for an approved course whose latest revision is approved', () => {
    expect(
      isRevisionBackedCourse(
        makeCourse({ status: 'APPROVED', hasEditableRevision: false, latestRevisionStatus: 'APPROVED' }),
      ),
    ).toBe(false)
  })
})

describe('mergeLessonAudio', () => {
  it('updates only the matching lesson audio fields', () => {
    const result = mergeLessonAudio(makeCourse(), 100, audio)

    expect(result.topics[0].lessons[0]).toMatchObject(audio)
  })

  it('keeps other lessons and topics untouched', () => {
    const course = makeCourse()
    const result = mergeLessonAudio(course, 100, audio)

    expect(result.topics[0].lessons[1]).toBe(course.topics[0].lessons[1])
    expect(result.topics[1]).toBe(course.topics[1])
    expect(result.topics[1].lessons[0]).toBe(course.topics[1].lessons[0])
    expect(result.topics[1].name).toBe('Topic 2')
    expect(result.topics[0].lessons[0].title).toBe('First lesson')
  })

  it('returns a new course without mutating the input', () => {
    const course = makeCourse()
    const result = mergeLessonAudio(course, 100, audio)

    expect(result).not.toBe(course)
    expect(course.topics[0].lessons[0].audioUrl).toBe('https://cdn.example.com/old-1.mp3')
    expect(course.topics[0].lessons[0].audioPublicId).toBe('old-1')
  })
})
