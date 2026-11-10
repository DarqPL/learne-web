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

export interface CursorPage<T> {
  content: T[]
  nextCursor: string | null
  hasNext: boolean
  size: number
}

export interface NumberedPage<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED'

export type OrderType = 'COURSE_PURCHASE' | 'PLAN_SUBSCRIPTION'

export type PaymentProvider = 'INTERNAL' | 'SEPAY'

export type PlanCode = 'VIP' | 'PRO' | 'PRO_PLUS'

export type CoursePricingType = 'FREE' | 'PAID'

export type CoursePriceStatus = 'NONE' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'

export type CourseAccessStatus = 'FREE' | 'OWNED' | 'LOCKED'

export interface PaymentInstructionResponse {
  bankCode: string
  bankName: string | null
  accountNumber: string
  accountName: string | null
  amountVnd: number
  paymentReference: string
  qrUrl: string
}

export interface OrderItemResponse {
  id: number
  productType: 'COURSE' | 'PLAN'
  courseId: number | null
  planCode: PlanCode | null
  itemNameSnapshot: string
  unitAmountVnd: number
  quantity: number
  totalAmountVnd: number
}

export interface OrderResponse {
  id: number
  orderType: OrderType
  status: OrderStatus
  originalAmountVnd: number
  discountAmountVnd: number
  finalAmountVnd: number
  couponId: number | null
  paymentProvider: PaymentProvider
  paymentReference: string | null
  paidAt: string | null
  expiresAt: string
  items: OrderItemResponse[]
  paymentInstructions: PaymentInstructionResponse | null
}

export interface SubscriptionSummaryResponse {
  planCode: PlanCode | null
  aiDailyLimit: number
  aiUsedToday: number
  startsAt: string | null
  endsAt: string | null
}

export type GrammarCheckStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED'

export type GrammarCheckErrorType = 'GRAMMAR' | 'SPELLING' | 'PUNCTUATION' | 'WORD_CHOICE' | 'STYLE' | 'OTHER'

export interface GrammarCheckContextRequest {
  courseId?: number | null
  lessonId?: number | null
  questionId?: number | null
  enrollmentId?: number | null
}

export interface SubmitGrammarCheckRequest {
  inputText: string
  context?: GrammarCheckContextRequest | null
}

export interface GrammarCheckErrorItem {
  id: number
  sequenceOrder: number
  errorText: string
  errorType: GrammarCheckErrorType
  suggestion: string
  explanation: string
  startPos: number
  endPos: number
}

export interface GrammarCheckResult {
  id: number
  status: GrammarCheckStatus
  inputText: string
  courseId: number | null
  lessonId: number | null
  questionId: number | null
  enrollmentId: number | null
  failureMessage: string | null
  createdAt: string
  completedAt: string | null
  errors: GrammarCheckErrorItem[]
}

export interface GrammarCheckListItem {
  id: number
  status: GrammarCheckStatus
  inputPreview: string
  errorCount: number
  failureMessage: string | null
  createdAt: string
  completedAt: string | null
}

export interface GrammarCheckPage {
  content: GrammarCheckListItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type AiTutorPracticeType = 'FREE_CHAT' | 'ROLEPLAY' | 'WRITING_PRACTICE'

export type AiConversationStatus = 'ACTIVE' | 'ARCHIVED'

export type AiTutorFeedbackType = 'GRAMMAR' | 'VOCABULARY' | 'WORD_CHOICE' | 'STYLE' | 'OTHER'

export interface AiTutorFeedback {
  id: number
  errorType: AiTutorFeedbackType
  originalText: string
  correctedText: string
  explanation: string
}

export interface AiTutorMessage {
  id: number
  senderType: 'USER' | 'AI'
  message: string
  createdAt: string
  feedback: AiTutorFeedback | null
}

export interface AiConversationSummary {
  id: number
  title: string
  practiceType: AiTutorPracticeType
  status: AiConversationStatus
  messagePreview: string | null
  lastMessageAt: string
  cleanupWarnAt: string
  archiveAfter: string
  cleanupWarning: boolean
}

export interface AiConversationDetail {
  id: number
  title: string
  practiceType: AiTutorPracticeType
  status: AiConversationStatus
  startedAt: string
  lastMessageAt: string
  cleanupWarnAt: string
  archiveAfter: string
  deleteAfter: string | null
  cleanupWarning: boolean
  messages: AiTutorMessage[]
}

export interface AiConversationPage {
  content: AiConversationSummary[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface CreateAiConversationRequest {
  title: string
  practiceType: AiTutorPracticeType
}

export interface SendAiTutorMessageRequest {
  message: string
}

export interface SendAiTutorMessageResponse {
  userMessage: AiTutorMessage
  aiMessage: AiTutorMessage
  conversation: AiConversationSummary
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

export type StudentCurrentLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export type StudentPreferredSkill = 'VOCABULARY' | 'GRAMMAR' | 'READING' | 'WRITING' | 'LISTENING' | 'SPEAKING'

export interface StudentProfile {
  studentId: number
  fullName: string
  email: string
  phoneNumber: string | null
  dateOfBirth: string | null
  bio: string | null
  learningGoal: string | null
  currentLevel: StudentCurrentLevel | null
  dailyLearningMinutes: number | null
  // Backend may return null for new profiles.
  preferredSkills: StudentPreferredSkill[] | null
  avatarUrl: string | null
  publicProfileEnabled: boolean
  showEmail: boolean
  showPhoneNumber: boolean
  showDateOfBirth: boolean
}

export interface UpdateStudentProfileRequest {
  fullName: string
  phoneNumber: string | null
  dateOfBirth: string | null
  bio: string | null
  learningGoal: string | null
  currentLevel: StudentCurrentLevel | null
  dailyLearningMinutes: number | null
  preferredSkills: StudentPreferredSkill[]
  publicProfileEnabled: boolean
  showEmail: boolean
  showPhoneNumber: boolean
  showDateOfBirth: boolean
}

export interface TeacherInvitationDelivery {
  status: 'NOT_REQUESTED' | 'HISTORY_UNAVAILABLE' | 'QUEUED' | 'SENDING' | 'RETRYING' | 'SENT' | 'FAILED' | 'SKIPPED'
  requestedAt: string | null
  completedAt: string | null
  failureCode: string | null
  canResend: boolean
}

export interface AdminTeacher {
  userId: number
  fullName: string
  email: string
  locked: boolean
  mustChangePassword: boolean
  profileStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | null
  completed: boolean
  invitationDelivery?: TeacherInvitationDelivery | null
}

export type ContentStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'HIDDEN'

export type CourseRevisionStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED'

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
  audioUrl: string | null
  audioPublicId: string | null
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

export interface CourseSubmission {
  id: string
  courseId: number
  revisionId: number
  status: 'QUEUED' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED'
  processedQuestions: number
  totalQuestions: number
  createdAt: string
  completedAt: string | null
  failureCode: string | null
  message: string | null
}

export interface TeacherCourse {
  submission?: CourseSubmission | null
  editingLocked?: boolean
  id: number
  name: string
  description: string | null
  type: CourseType
  level: string
  orderIndex: number
  status: ContentStatus
  rejectionReason: string | null
  latestRevisionId: number | null
  latestRevisionStatus: CourseRevisionStatus | null
  hasEditableRevision: boolean
  pricingType: CoursePricingType
  priceAmountVnd: number | null
  proposedPriceAmountVnd: number | null
  priceStatus: CoursePriceStatus
  topics: TeacherTopic[]
}

export interface CourseImportError {
  rowNumber: number | null
  field: string | null
  message: string
}

export interface CourseImportResponse {
  courseId: number
  revisionId: number
  status: string
  errors: CourseImportError[]
}

export interface TeacherCourseRequest {
  name: string
  description: string
  type: CourseType
  level: string
  orderIndex: number
  pricingType?: CoursePricingType
  proposedPriceAmountVnd?: number | null
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
  revisionId: number | null
  revisionNumber: number
  pricingType: CoursePricingType
  priceAmountVnd: number | null
  proposedPriceAmountVnd: number | null
  priceStatus: CoursePriceStatus
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
  audioUrl: string | null
  audioPublicId: string | null
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
  revisionId: number | null
  revisionNumber: number
  pricingType: CoursePricingType
  priceAmountVnd: number | null
  proposedPriceAmountVnd: number | null
  priceStatus: CoursePriceStatus
  topics: AdminReviewTopic[]
}

export interface RejectContentRequest {
  reason: string
}

export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export type LessonProgressStatus = 'LOCKED' | 'UNLOCKED' | 'IN_PROGRESS' | 'COMPLETED'

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
  pricingType: CoursePricingType
  priceAmountVnd: number | null
  accessStatus: CourseAccessStatus
  accessReason: string | null
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
  audioUrl: string | null
  audioPublicId: string | null
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
  pricingType: CoursePricingType
  priceAmountVnd: number | null
  accessStatus: CourseAccessStatus
  accessReason: string | null
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
  audioUrl: string | null
  audioPublicId: string | null
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

export interface GenerateLearningPathRequest {
  teacherId?: number
  maxItems?: number
}

export interface StudentLearningPathItem {
  id: number
  enrollmentId: number | null
  lessonId: number
  lessonTitle: string
  courseId: number
  courseTitle: string
  teacherId: number
  teacherName: string
  sequenceOrder: number
  reason: string
  score: number
  completed: boolean
}

export interface StudentLearningPath {
  id: number
  status: string
  generatedAt: string
  source: string
  weaknesses: string[]
  items: StudentLearningPathItem[]
}

export interface NextLessonRecommendation {
  enrollmentId: number
  lessonId: number
  lessonTitle: string
  courseId: number
  courseTitle: string
  teacherId: number
  teacherName: string
  reason: string
  score: number
}

export interface PlacementStatus {
  placementCompleted: boolean
  activeAttemptId: number | null
  skipped: boolean
  canGenerateRecommendations: boolean
  reason: string | null
}

export interface StudentQuizOption {
  id: number
  optionText: string
  orderIndex: number
}

export interface PlacementAttempt {
  id: number
  status: string
  startedAt: string
  expiresAt: string
  remainingSeconds: number
  durationSeconds: number
  questions: PlacementQuestion[]
}

export interface PlacementQuestion {
  id: number
  type: string
  questionText: string
  knowledgePoint: string | null
  skill: string
  sequenceOrder: number
  options: StudentQuizOption[]
}

export interface SubmitPlacementRequest {
  answers: SubmitPlacementAnswer[]
}

export interface SubmitPlacementAnswer {
  questionId: number
  answerText?: string
  selectedOptionId?: number
  selectedOptionIds?: number[]
}

export interface CourseRecommendationPath {
  id: number
  status: string
  generatedAt: string
  source: string
  weaknesses: string[]
  items: CourseRecommendationItem[]
}

export interface CourseRecommendationItem {
  id: number
  courseId: number
  courseTitle: string
  description: string | null
  type: string
  level: string
  teacherId: number
  teacherName: string
  enrolled: boolean
  enrollmentStatus: string | null
  sequenceOrder: number
  reason: string
  score: number
}

export interface StudentQuizQuestion {
  id: number
  type: QuestionType
  questionText: string
  knowledgePoint: string | null
  difficulty: string | null
  xpReward: number
  orderIndex: number
  targetText: string | null
  options: StudentQuizOption[]
}

export interface StudentQuiz {
  enrollmentId: number
  lessonId: number
  lessonTitle: string
  lessonContent: string | null
  audioUrl: string | null
  audioPublicId: string | null
  passPercent: number
  bestScorePercent: number | null
  alreadyPassed: boolean
  questions: StudentQuizQuestion[]
}

export interface SubmitQuizAnswerRequest {
  questionId: number
  answerText?: string | null
  selectedOptionId?: number | null
}

export interface SubmitQuizRequest {
  answers: SubmitQuizAnswerRequest[]
}

export interface StudentQuizProgressResult {
  lessonStatus: LessonProgressStatus
  enrollmentProgressPercent: number
  unlockedNextLessonId: number | null
}

export interface SubmitQuizResponse {
  attemptId: number
  enrollmentId: number
  lessonId: number
  scorePercent: number
  passed: boolean
  earnedXp: number
  xpAwarded: boolean
  progress: StudentQuizProgressResult
  stats: StudentStats
  answers: StudentQuizAnswerResult[]
}

export interface StudentQuizAnswerResult {
  questionId: number
  type: QuestionType
  questionText: string
  answerText: string | null
  selectedOptionId: number | null
  selectedOptionText: string | null
  correct: boolean
  scorePercent: number
  earnedXp: number
  gradingMethod: string
  feedback: string | null
  correctAnswer: string | null
  correctOptionId: number | null
  correctOptionText: string | null
  explanation: string | null
}

export interface StudentQuizAttemptResult {
  attemptId: number
  enrollmentId: number
  lessonId: number
  scorePercent: number
  passed: boolean
  earnedXp: number
  progress: StudentQuizProgressResult
  stats: StudentStats
  answers: StudentQuizAnswerResult[]
}

export interface StudentStats {
  totalXp: number
  currentStreakDays: number
  longestStreakDays: number
  lastActivityDate: string | null
}

export interface StatusCount {
  status: string
  count: number
}

export interface LeaderboardStudent {
  userId: number
  fullName: string
  totalXp: number
  currentStreakDays: number
  longestStreakDays: number
  lastActivityDate: string | null
}

export interface StudentEnrollmentSummary {
  totalEnrollments: number
  activeEnrollments: number
  completedLessons: number
}

export interface StudentActiveCourse {
  enrollmentId: number
  courseId: number
  courseName: string
  teacherName: string
  status: string
  progressPercent: number
  enrolledAt: string
}

export interface StudentRecentActivity {
  id: number
  activityType: string
  title: string
  happenedAt: string
}

export interface StudentDashboard {
  stats: StudentStats
  enrollmentSummary: StudentEnrollmentSummary
  activeCourses: StudentActiveCourse[]
  recentActivity: StudentRecentActivity[]
  leaderboard: LeaderboardStudent[]
}

export interface TeacherDashboard {
  overview: {
    totalCourses: number
    enrolledStudents: number
    totalLessons: number
    totalQuestions: number
  }
  courseStatusCounts: StatusCount[]
  recentCourses: Array<{
    id: number
    name: string
    status: string
    updatedAt: string
  }>
}

export interface AdminDashboard {
  overview: {
    totalStudents: number
    lockedStudents: number
    totalTeachers: number
    lockedTeachers: number
    totalCourses: number
    totalEnrollments: number
  }
  courseStatusCounts: StatusCount[]
  leaderboard: LeaderboardStudent[]
}

export interface AdminStudentSummary {
  userId: number
  fullName: string
  email: string
  locked: boolean
  mustChangePassword: boolean
  totalXp: number
  currentStreakDays: number
  longestStreakDays: number
  lastActivityDate: string | null
  enrollmentCount: number
  completedLessonCount: number
}

export interface AdminStudentDetail {
  userId: number
  fullName: string
  email: string
  locked: boolean
  mustChangePassword: boolean
  stats: StudentStats
  enrollments: Array<{
    enrollmentId: number
    courseId: number
    courseName: string
    status: EnrollmentStatus
    progressPercent: number
    enrolledAt: string | null
  }>
  recentQuizAttempts: Array<{
    attemptId: number
    lessonTitle: string
    scorePercent: number
    passed: boolean
    submittedAt: string | null
  }>
  recentGrammarChecks: Array<{
    id: number
    originalText: string
    correctedText: string | null
    createdAt: string | null
  }>
  recentAiConversations: Array<{
    id: number
    title: string
    practiceType: AiTutorPracticeType
    updatedAt: string | null
  }>
}

export type CouponDiscountType = 'PERCENT' | 'FIXED_AMOUNT'
export type CouponProductScope = 'COURSE_PURCHASE' | 'VIP' | 'PRO' | 'PRO_PLUS'
export interface AdminCoupon { id: number; code: string; discountType: CouponDiscountType; discountValue: number; minOrderAmountVnd: number; maxDiscountAmountVnd: number | null; minimumFinalAmountVnd: number; usageLimitTotal: number | null; usageLimitPerUser: number | null; validFrom: string; validUntil: string; active: boolean; productScopes: CouponProductScope[]; courseIds: number[]; teacherIds: number[] }
export interface AdminCouponCreatePayload { code: string; discountType: CouponDiscountType; discountValue: number; minOrderAmountVnd?: number | null; maxDiscountAmountVnd?: number | null; minimumFinalAmountVnd?: number | null; usageLimitTotal?: number | null; usageLimitPerUser?: number | null; validFrom: string; validUntil: string; active?: boolean; productScopes: CouponProductScope[]; courseIds?: number[]; teacherIds?: number[] }
export type AdminCouponUpdatePayload = Partial<AdminCouponCreatePayload>

export interface RevenueCourseSalesRow {
  courseId: number
  courseName: string
  teacherId: number
  teacherName: string
  paidOrderCount: number
  grossRevenueVnd: number
  discountAmountVnd: number
  netRevenueVnd: number
}

export interface RevenuePlanSalesRow {
  planCode: string
  paidOrderCount: number
  grossRevenueVnd: number
  discountAmountVnd: number
  netRevenueVnd: number
}

export interface RevenueTeacherShareRow {
  teacherId: number
  teacherName: string
  activityScore: number
  directCourseNetRevenueVnd: number
  suggestedPlanShareVnd: number
  suggestedTotalShareVnd: number
}

export interface RevenueCourseSalesResponse {
  month: string
  rows: RevenueCourseSalesRow[]
}

export interface RevenuePlanSalesResponse {
  month: string
  rows: RevenuePlanSalesRow[]
}

export interface TeacherShareResponse {
  month: string
  planRevenuePoolVnd: number
  totalActivityScore: number
  rows: RevenueTeacherShareRow[]
}

export interface LessonAudioFields {
  audioUrl: string | null
  audioPublicId: string | null
}

export interface LessonAudioTarget extends LessonAudioFields {
  lessonRevisionId: number
  sourceLessonId: number | null
  topicRevisionId: number
  topicTitle: string
  title: string
  skillType: SkillType
  orderIndex: number
}

export interface CourseAudioTargets {
  courseId: number
  revisionId: number
  revisionStatus: 'DRAFT' | 'REJECTED'
  lessons: LessonAudioTarget[]
}

export interface MistakeReviewOption {
  id: number
  text: string
  order: number
}

export interface MistakeReviewQuestion {
  questionId: number
  questionText: string
  questionType: QuestionType
  options: MistakeReviewOption[]
  courseId: number | null
  courseName: string | null
  lessonId: number | null
  lessonTitle: string | null
}

export interface MistakeReviewCreateResponse {
  sessionId: number | null
  questionCount: number
  questions: MistakeReviewQuestion[]
}

export interface MistakeReviewSubmitAnswerRequest {
  questionId: number
  answerText?: string | null
  selectedOptionId?: number | null
}

export interface MistakeReviewSubmitRequest {
  answers: MistakeReviewSubmitAnswerRequest[]
}

export interface MistakeReviewAnswerResult {
  questionId: number
  correct: boolean
  scorePercent: number
  feedback: string | null
  correctAnswer: string | null
  explanation: string | null
}

export interface MistakeReviewResult {
  sessionId: number
  questionCount: number
  scorePercent: number
  answers: MistakeReviewAnswerResult[]
}

export interface MistakeReviewSessionResponse {
  sessionId: number
  questionCount: number
  questions: MistakeReviewQuestion[]
  scorePercent: number | null
  answers: MistakeReviewAnswerResult[]
}
