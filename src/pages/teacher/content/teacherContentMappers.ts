import type {
  TeacherCourse,
  TeacherCourseRequest,
  TeacherLesson,
  TeacherLessonRequest,
  TeacherQuestion,
  TeacherQuestionRequest,
  TeacherTopicRequest,
} from '../../../lib/api/types'

export function getCourseInitialValue(course: TeacherCourse): TeacherCourseRequest {
  return {
    name: course.name,
    description: course.description ?? '',
    type: course.type,
    level: course.level,
    orderIndex: course.orderIndex,
    pricingType: course.pricingType ?? 'FREE',
    proposedPriceAmountVnd: course.proposedPriceAmountVnd ?? null,
  }
}

export function getTopicInitialValue(topic: TeacherCourse['topics'][number]): TeacherTopicRequest {
  return {
    name: topic.name,
    description: topic.description ?? '',
    orderIndex: topic.orderIndex,
  }
}

export function getLessonInitialValue(lesson: TeacherLesson): TeacherLessonRequest {
  return {
    title: lesson.title,
    description: lesson.description ?? '',
    content: lesson.content ?? '',
    skillType: lesson.skillType,
    orderIndex: lesson.orderIndex,
    xpReward: lesson.xpReward,
    placementTest: lesson.placementTest,
  }
}

export function getQuestionInitialValue(question: TeacherQuestion): TeacherQuestionRequest {
  return {
    type: question.type,
    questionText: question.questionText,
    explanation: question.explanation ?? '',
    correctAnswer: question.correctAnswer ?? '',
    knowledgePoint: question.knowledgePoint ?? '',
    orderIndex: question.orderIndex,
    difficulty: question.difficulty ?? '',
    xpReward: question.xpReward,
    options: question.options.map((option) => ({
      optionText: option.optionText,
      correct: option.correct,
      orderIndex: option.orderIndex,
    })),
  }
}
