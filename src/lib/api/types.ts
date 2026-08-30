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

export interface AdminReviewCourseSummary {
  id: number
  name: string
  description: string | null
  type: CourseType
  level: string
  status: ContentStatus
  teacherId: number
  teacherName: string
  teacherEmail: string
  topicCount: number
  lessonCount: number
  questionCount: number
  updatedAt: string
}

export interface AdminReviewQuestionOption {
  id: number
  optionText: string
  correct: boolean
  orderIndex: number
}

export interface AdminReviewQuestion {
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
  rejectionReason: string | null
  reviewedByAdminId: number | null
  reviewedAt: string | null
  options: AdminReviewQuestionOption[]
}

export interface AdminReviewLesson {
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
  reviewedByAdminId: number | null
  reviewedAt: string | null
  publishedAt: string | null
  questions: AdminReviewQuestion[]
}

export interface AdminReviewTopic {
  id: number
  name: string
  description: string | null
  orderIndex: number
  lessons: AdminReviewLesson[]
}

export interface AdminReviewCourseDetail {
  id: number
  name: string
  description: string | null
  type: CourseType
  level: string
  orderIndex: number
  status: ContentStatus
  rejectionReason: string | null
  teacherId: number
  teacherName: string
  teacherEmail: string
  reviewedByAdminId: number | null
  reviewedAt: string | null
  publishedAt: string | null
  updatedAt: string
  topics: AdminReviewTopic[]
}

export interface RejectContentRequest {
  reason: string
}

export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export type LessonProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'

export interface StudentCourseSummary {
  id: number
  name: string
  description: string | null
  type: CourseType
  level: string
  teacherId: number
  teacherName: string
  teacherEmail: string
  teacherAvatarUrl: string | null
  topicCount: number
  lessonCount: number
  questionCount: number
  publishedAt: string | null
  enrolled: boolean
}

export interface StudentQuestionSummary {
  id: number
  type: QuestionType
  questionText: string
  knowledgePoint: string | null
  difficulty: string | null
  xpReward: number
  optionCount: number
}

export interface StudentLesson {
  id: number
  title: string
  description: string | null
  content: string | null
  skillType: SkillType
  orderIndex: number
  xpReward: number
  questionCount: number
  questions: StudentQuestionSummary[]
}

export interface StudentTopic {
  id: number
  name: string
  description: string | null
  orderIndex: number
  lessons: StudentLesson[]
}

export interface StudentCourseDetail {
  id: number
  name: string
  description: string | null
  type: CourseType
  level: string
  teacherId: number
  teacherName: string
  teacherEmail: string
  teacherAvatarUrl: string | null
  publishedAt: string | null
  enrolled: boolean
  activeEnrollmentId: number | null
  topics: StudentTopic[]
}

export interface StudentEnrollment {
  id: number
  courseId: number
  courseName: string
  teacherId: number
  teacherName: string
  status: EnrollmentStatus
  progressPercent: number
  completedLessonCount: number
  totalLessonCount: number
  enrolledAt: string
  completedAt: string | null
}

export interface StudentProgressCourse {
  id: number
  name: string
  level: string
  type: CourseType
  teacherId: number
  teacherName: string
}

export interface StudentLessonProgress {
  lessonId: number
  title: string
  content: string | null
  skillType: SkillType
  orderIndex: number
  status: LessonProgressStatus
  progressPercent: number
  startedAt: string | null
  completedAt: string | null
}

export interface StudentProgressTopic {
  id: number
  name: string
  orderIndex: number
  lessons: StudentLessonProgress[]
}

export interface StudentEnrollmentProgress {
  enrollmentId: number
  status: EnrollmentStatus
  progressPercent: number
  completedLessonCount: number
  totalLessonCount: number
  course: StudentProgressCourse
  topics: StudentProgressTopic[]
}
