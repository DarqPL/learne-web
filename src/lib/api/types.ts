export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN'

export interface AuthUser {
  id: number
  email: string
  fullName: string
  role: UserRole
  mustChangePassword: boolean
}

export interface AuthTokenResponse {
  accessToken: string
  expiresInSeconds: number
  user: AuthUser
}

export interface ApiMessageResponse {
  message: string
}

export interface TeacherProfile {
  teacherId: number
  fullName: string
  email: string
  bio: string
  expertise: string
  yearsOfExperience: number
  avatarUrl?: string
  introductionVideoUrl?: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  completed: boolean
}

export interface TeacherProfileSummary {
  teacherId: number
  fullName: string
  email: string
  avatarUrl?: string
  expertise: string
  yearsOfExperience: number
}

export interface UpdateTeacherProfileRequest {
  bio: string
  expertise: string
  yearsOfExperience: number
}

export interface AdminTeacher {
  userId: number
  fullName: string
  email: string
  locked: boolean
  mustChangePassword: boolean
  profileStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | null
  completed: boolean
}

export type ContentStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'HIDDEN'

export type CourseType =
  | 'COMPREHENSIVE'
  | 'GRAMMAR'
  | 'LISTENING'
  | 'SPEAKING'
  | 'READING'
  | 'WRITING'
  | 'VOCABULARY'
  | 'PRONUNCIATION'

export type SkillType = 'GRAMMAR' | 'LISTENING' | 'SPEAKING' | 'READING' | 'WRITING' | 'VOCABULARY' | 'PRONUNCIATION'

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'FILL_BLANK'
  | 'WORD_ORDER'
  | 'TRANSLATION'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'PRONUNCIATION'

export interface TeacherQuestionOption {
  id: number
  optionText: string
  correct: boolean
  orderIndex: number
}

export interface TeacherQuestion {
  id: number
  type: QuestionType
  questionText: string
  explanation: string | null
  correctAnswer: string | null
  knowledgePoint: string | null
  orderIndex: number
  difficulty: string | null
  xpReward: number
  status: ContentStatus
  options: TeacherQuestionOption[]
}

export interface TeacherLesson {
  id: number
  title: string
  description: string | null
  content: string | null
  skillType: SkillType
  orderIndex: number
  xpReward: number
  placementTest: boolean
  status: ContentStatus
  rejectionReason: string | null
  questions: TeacherQuestion[]
}

export interface TeacherTopic {
  id: number
  name: string
  description: string | null
  orderIndex: number
  lessons: TeacherLesson[]
}

export interface TeacherCourse {
  id: number
  name: string
  description: string | null
  type: CourseType
  level: string
  orderIndex: number
  status: ContentStatus
  rejectionReason: string | null
  topics: TeacherTopic[]
}

export interface TeacherCourseRequest {
  name: string
  description: string
  type: CourseType
  level: string
  orderIndex: number
}

export interface TeacherTopicRequest {
  name: string
  description: string
  orderIndex: number
}

export interface TeacherLessonRequest {
  title: string
  description: string
  content: string
  skillType: SkillType
  orderIndex: number
  xpReward: number
  placementTest: boolean
}

export interface TeacherQuestionOptionRequest {
  optionText: string
  correct: boolean
  orderIndex: number
}

export interface TeacherQuestionRequest {
  type: QuestionType
  questionText: string
  explanation: string
  correctAnswer: string
  knowledgePoint: string
  orderIndex: number
  difficulty: string
  xpReward: number
  options: TeacherQuestionOptionRequest[]
}
