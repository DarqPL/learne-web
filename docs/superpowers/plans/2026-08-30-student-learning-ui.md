# Student Learning UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase 6 Student frontend so students can browse approved courses, enroll, view their enrollments, and complete basic lessons without quiz scoring.

**Architecture:** Add a focused Student Learning API client and DTO types, then build small route pages for catalog, course detail, enrollment list, and enrollment progress. The frontend must only consume `/api/student/**` for learning content so visibility follows backend-approved content filtering.

**Tech Stack:** React, React Router, TypeScript, Axios `http` client, Tailwind CSS, existing `Alert`, `Button`, `Spinner`, `Avatar` UI components, Playwright Python script for manual verification.

---

## Context

- Backend Phase 6 already exposes Student Learning endpoints under `/api/student/**` and requires role `STUDENT`.
- Backend controller currently supports `GET /api/student/courses` with optional `level` and `teacherId` query params only. Do not send a `keyword` query param unless backend changes first.
- Student API is responsible for approved-only filtering. The frontend must not call Teacher/Admin content APIs to render Student learning content.
- Backend does not return correct answers or question options to Student APIs. The frontend must not attempt to display answers/options in Phase 6.
- Existing Student frontend files:
  - `src/pages/student/StudentDashboardPage.tsx`
  - `src/pages/student/TeacherListPage.tsx`
  - `src/pages/student/TeacherDetailPage.tsx`
  - `src/layouts/StudentLayout.tsx`
  - `src/App.tsx`

## File Structure

- `src/lib/api/types.ts`: append Student Learning DTO and status types.
- `src/lib/api/studentLearningApi.ts`: Student Learning API wrapper using existing `http` client.
- `src/pages/student/learning/studentLearningLabels.ts`: Vietnamese labels and styles for course, enrollment, lesson progress, skill/question types.
- `src/pages/student/learning/studentLearningUtils.ts`: date, count, and progress helper functions.
- `src/layouts/StudentSidebar.tsx`: Student navigation tabs.
- `src/layouts/StudentLayout.tsx`: wrap Student pages with sidebar navigation.
- `src/pages/student/StudentDashboardPage.tsx`: update dashboard entry copy and links.
- `src/pages/student/learning/StudentCourseListPage.tsx`: approved course catalog and filters.
- `src/pages/student/learning/StudentCourseDetailPage.tsx`: course detail and enroll/continue flow.
- `src/pages/student/learning/StudentEnrollmentsPage.tsx`: current student's enrollments.
- `src/pages/student/learning/StudentEnrollmentProgressPage.tsx`: basic lesson learning/progress page.
- `src/App.tsx`: add Student Learning routes.
- `C:\Users\Admin\AppData\Local\Temp\opencode\test_student_learning_phase6.py`: Playwright verification script.
- `docs/superpowers/plans/2026-08-30-student-learning-ui.md`: mark checkboxes complete during final task.
- `docs/Docs_Capstone/Project_Plan_Trello_Kanban.md` in docs submodule: update Phase 6 frontend progress after verification.

---

### Task 1: Add Student Learning Types

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\lib\api\types.ts`

- [x] **Step 1: Append Student Learning status unions and DTOs**

Append this block after `RejectContentRequest` in `src/lib/api/types.ts`. Reuse existing `CourseType`, `SkillType`, and `QuestionType` unions; do not duplicate them.

```ts
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
```

- [x] **Step 2: Typecheck**

Run:

```powershell
node node_modules/typescript/bin/tsc --noEmit
```

Expected: exit code 0.

- [x] **Step 3: Commit**

```bash
git add src/lib/api/types.ts
git commit -m "feat: add student learning API types"
```

---

### Task 2: Add Student Learning API Client

**Files:**
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\lib\api\studentLearningApi.ts`

- [x] **Step 1: Create API wrapper**

Create `studentLearningApi.ts` with direct Axios-returning functions matching existing API module style.

```ts
import { http } from './client'
import type { StudentCourseDetail, StudentCourseSummary, StudentEnrollment, StudentEnrollmentProgress } from './types'

const base = '/api/student'

export interface StudentCourseFilters {
  level?: string
  teacherId?: number
}

export function listStudentCourses(params?: StudentCourseFilters) {
  return http.get<StudentCourseSummary[]>(`${base}/courses`, { params })
}

export function getStudentCourse(courseId: number) {
  return http.get<StudentCourseDetail>(`${base}/courses/${courseId}`)
}

export function enrollStudentCourse(courseId: number) {
  return http.post<StudentEnrollment>(`${base}/courses/${courseId}/enroll`, {})
}

export function listStudentEnrollments() {
  return http.get<StudentEnrollment[]>(`${base}/enrollments`)
}

export function getStudentEnrollment(enrollmentId: number) {
  return http.get<StudentEnrollmentProgress>(`${base}/enrollments/${enrollmentId}`)
}

export function getStudentEnrollmentProgress(enrollmentId: number) {
  return http.get<StudentEnrollmentProgress>(`${base}/enrollments/${enrollmentId}/progress`)
}

export function startStudentLesson(enrollmentId: number, lessonId: number) {
  return http.post<StudentEnrollmentProgress>(`${base}/enrollments/${enrollmentId}/lessons/${lessonId}/start`, {})
}

export function completeStudentLesson(enrollmentId: number, lessonId: number) {
  return http.post<StudentEnrollmentProgress>(`${base}/enrollments/${enrollmentId}/lessons/${lessonId}/complete`, {})
}
```

- [x] **Step 2: Typecheck**

Run:

```powershell
node node_modules/typescript/bin/tsc --noEmit
```

Expected: exit code 0.

- [x] **Step 3: Commit**

```bash
git add src/lib/api/studentLearningApi.ts
git commit -m "feat: add student learning API client"
```

---

### Task 3: Add Student Learning Labels And Helpers

**Files:**
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\pages\student\learning\studentLearningLabels.ts`
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\pages\student\learning\studentLearningUtils.ts`

- [x] **Step 1: Create labels**

Create `studentLearningLabels.ts`:

```ts
import type { CourseType, EnrollmentStatus, LessonProgressStatus, QuestionType, SkillType } from '../../../lib/api/types'

export const studentCourseTypeLabels: Record<CourseType, string> = {
  COMPREHENSIVE: 'Tổng hợp',
  GRAMMAR: 'Ngữ pháp',
  LISTENING: 'Nghe',
  SPEAKING: 'Nói',
  READING: 'Đọc',
  WRITING: 'Viết',
  VOCABULARY: 'Từ vựng',
  PRONUNCIATION: 'Phát âm',
}

export const studentSkillTypeLabels: Record<SkillType, string> = {
  GRAMMAR: 'Ngữ pháp',
  LISTENING: 'Nghe',
  SPEAKING: 'Nói',
  READING: 'Đọc',
  WRITING: 'Viết',
  VOCABULARY: 'Từ vựng',
  PRONUNCIATION: 'Phát âm',
}

export const studentQuestionTypeLabels: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  FILL_BLANK: 'Điền vào chỗ trống',
  WORD_ORDER: 'Sắp xếp từ',
  TRANSLATION: 'Dịch câu',
  TRUE_FALSE: 'Đúng / Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
  PRONUNCIATION: 'Phát âm',
}

export const enrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  ACTIVE: 'Đang học',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
}

export const enrollmentStatusStyles: Record<EnrollmentStatus, string> = {
  ACTIVE: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
}

export const lessonProgressStatusLabels: Record<LessonProgressStatus, string> = {
  LOCKED: 'Chưa mở khóa',
  UNLOCKED: 'Chưa bắt đầu',
  IN_PROGRESS: 'Đang học',
  COMPLETED: 'Đã hoàn thành',
}

export const lessonProgressStatusStyles: Record<LessonProgressStatus, string> = {
  LOCKED: 'bg-slate-100 text-slate-500',
  UNLOCKED: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-green-100 text-green-700',
}
```

- [x] **Step 2: Create helpers**

Create `studentLearningUtils.ts`:

```ts
import type { StudentCourseDetail, StudentEnrollmentProgress, StudentLessonProgress } from '../../../lib/api/types'

export function formatStudentLearningDate(value: string | null) {
  if (!value) return 'Chưa có'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Chưa có'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export function countStudentLessons(course: StudentCourseDetail) {
  return course.topics.reduce((total, topic) => total + topic.lessons.length, 0)
}

export function countStudentQuestions(course: StudentCourseDetail) {
  return course.topics.reduce(
    (total, topic) => total + topic.lessons.reduce((lessonTotal, lesson) => lessonTotal + lesson.questionCount, 0),
    0,
  )
}

export function flattenProgressLessons(enrollment: StudentEnrollmentProgress) {
  return enrollment.topics.flatMap((topic) => topic.lessons)
}

export function findFirstAvailableLesson(enrollment: StudentEnrollmentProgress): StudentLessonProgress | null {
  return flattenProgressLessons(enrollment).find((lesson) => lesson.status !== 'COMPLETED') ?? null
}
```

- [x] **Step 3: Verify and commit**

Run:

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```

Expected: ESLint 0 errors, build success.

Commit:

```bash
git add src/pages/student/learning/studentLearningLabels.ts src/pages/student/learning/studentLearningUtils.ts
git commit -m "feat: add student learning labels and helpers"
```

---

### Task 4: Add Student Navigation

**Files:**
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\layouts\StudentSidebar.tsx`
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\layouts\StudentLayout.tsx`
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\pages\student\StudentDashboardPage.tsx`

- [x] **Step 1: Create StudentSidebar**

Create `StudentSidebar.tsx`:

```tsx
import { NavLink } from 'react-router-dom'

const tabs = [
  { label: 'Tổng quan', to: '/student', end: true },
  { label: 'Khóa học', to: '/student/courses', end: false },
  { label: 'Khóa đã đăng ký', to: '/student/enrollments', end: false },
  { label: 'Giảng viên', to: '/student/teachers', end: false },
]

export function StudentSidebar() {
  return (
    <aside className="mb-6 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm lg:mb-0 lg:w-64 lg:shrink-0">
      <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="Điều hướng học viên">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
```

- [x] **Step 2: Update StudentLayout**

Replace `StudentLayout.tsx` with:

```tsx
import { Outlet } from 'react-router-dom'
import { AppShell } from './AppShell'
import { StudentSidebar } from './StudentSidebar'

export function StudentLayout() {
  return (
    <AppShell>
      <div className="lg:flex lg:gap-6">
        <StudentSidebar />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </AppShell>
  )
}
```

- [x] **Step 3: Update dashboard entry points**

Replace `StudentDashboardPage.tsx` with:

```tsx
import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/auth/auth-context'

export function StudentDashboardPage() {
  const { user } = useAuth()
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Dashboard Học viên</h1>
      <p className="text-gray-600">
        Chào mừng {user?.fullName}! Khám phá khóa học đã được duyệt và tiếp tục tiến độ học tập của bạn.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-200" to="/student/courses">
          <h2 className="font-semibold text-gray-900">Khám phá khóa học</h2>
          <p className="mt-2 text-sm text-gray-600">Xem các khóa học đã được duyệt và đăng ký học.</p>
        </Link>
        <Link className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-200" to="/student/enrollments">
          <h2 className="font-semibold text-gray-900">Khóa đã đăng ký</h2>
          <p className="mt-2 text-sm text-gray-600">Theo dõi tiến độ và tiếp tục bài học đang học.</p>
        </Link>
      </div>
    </div>
  )
}
```

- [x] **Step 4: Verify and commit**

Run:

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```

Expected: ESLint 0 errors, build success.

Commit:

```bash
git add src/layouts/StudentSidebar.tsx src/layouts/StudentLayout.tsx src/pages/student/StudentDashboardPage.tsx
git commit -m "feat: add student learning navigation"
```

---

### Task 5: Build Student Course Catalog

**Files:**
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\pages\student\learning\StudentCourseListPage.tsx`

- [x] **Step 1: Create catalog page**

Create a React page with these imports and state:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../lib/api/client'
import { listStudentCourses } from '../../../lib/api/studentLearningApi'
import type { StudentCourseSummary } from '../../../lib/api/types'
import { Alert } from '../../../components/ui/Alert'
import { Avatar } from '../../../components/ui/Avatar'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { studentCourseTypeLabels } from './studentLearningLabels'
import { formatStudentLearningDate } from './studentLearningUtils'

const levelOptions = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
```

Required behavior:

- Read `level` and `teacherId` from `useSearchParams`.
- Call `listStudentCourses({ level, teacherId })`, omitting empty params.
- Maintain `courses: StudentCourseSummary[] | null`, `error: string | null`, and `localSearch: string` state.
- Use a cancellation flag in `useEffect`.
- Apply `localSearch` client-side to course name, teacher name, and description.
- Header text: `Khóa học đã duyệt`.
- Description: `Chọn khóa học phù hợp để đăng ký và bắt đầu học theo tiến độ của bạn.`
- Filters include level select and local search input placeholder `Tìm theo tên khóa học hoặc giảng viên`.
- Empty state: `Chưa có khóa học phù hợp.`
- Each card is a button navigating to `/student/courses/${course.id}` and shows name, description, teacher avatar/name/email, level, course type, topic/lesson/question counts, published date, and enrolled badge `Đã đăng ký` when `course.enrolled`.
- Do not render any content status or Admin/Teacher controls.

- [x] **Step 2: Verify and commit**

Run:

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```

Expected: ESLint 0 errors, build success.

Commit:

```bash
git add src/pages/student/learning/StudentCourseListPage.tsx
git commit -m "feat: add student course catalog"
```

---

### Task 6: Build Student Course Detail And Enroll Flow

**Files:**
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\pages\student\learning\StudentCourseDetailPage.tsx`

- [x] **Step 1: Create detail page**

Create a React page with these imports:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../lib/api/client'
import { enrollStudentCourse, getStudentCourse } from '../../../lib/api/studentLearningApi'
import type { StudentCourseDetail } from '../../../lib/api/types'
import { Alert } from '../../../components/ui/Alert'
import { Avatar } from '../../../components/ui/Avatar'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { studentCourseTypeLabels, studentQuestionTypeLabels, studentSkillTypeLabels } from './studentLearningLabels'
import { countStudentLessons, countStudentQuestions, formatStudentLearningDate } from './studentLearningUtils'
```

Required behavior:

- Parse `courseId` from route param `id`; invalid id shows `Không tìm thấy khóa học.`.
- Load course detail with cancellation guard.
- State: `course`, `error`, `info`, `enrolling`.
- Header/course title shows name, teacher avatar/name/email, type, level, published date, lesson/question counts.
- If description exists, show it as whitespace-preserving text.
- If `course.enrolled` and `activeEnrollmentId` exists, show `Tiếp tục học` button navigating to `/student/enrollments/${course.activeEnrollmentId}`.
- If not enrolled, show `Đăng ký khóa học`; on success call `enrollStudentCourse(course.id)`, show `Đăng ký khóa học thành công.` and navigate to `/student/enrollments/${response.data.id}`.
- Topic sections show `Chủ đề`, topic name, description.
- Lesson cards show `Bài học`, title, description, content preview, skill label, XP, question count.
- Question summaries show question type, question text, knowledge point, difficulty, XP, option count as `Số lựa chọn: {question.optionCount}`.
- Do not display answers, options, correct/incorrect status, edit/create/delete/media controls.

- [x] **Step 2: Verify and commit**

Run:

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```

Expected: ESLint 0 errors, build success.

Commit:

```bash
git add src/pages/student/learning/StudentCourseDetailPage.tsx
git commit -m "feat: add student course detail enrollment"
```

---

### Task 7: Build Student Enrollments List

**Files:**
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\pages\student\learning\StudentEnrollmentsPage.tsx`

- [x] **Step 1: Create enrollments page**

Create a React page with these imports:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../../lib/api/client'
import { listStudentEnrollments } from '../../../lib/api/studentLearningApi'
import type { StudentEnrollment } from '../../../lib/api/types'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { enrollmentStatusLabels, enrollmentStatusStyles } from './studentLearningLabels'
import { formatStudentLearningDate } from './studentLearningUtils'
```

Required behavior:

- Load enrollments on mount with cancellation guard.
- State: `enrollments: StudentEnrollment[] | null`, `error: string | null`.
- Header: `Khóa học đã đăng ký`.
- Description: `Theo dõi các khóa học bạn đang tham gia và tiếp tục bài học còn dang dở.`
- Empty state: `Bạn chưa đăng ký khóa học nào.` with button `Khám phá khóa học` navigating `/student/courses`.
- Each enrollment card is a button navigating to `/student/enrollments/${enrollment.id}`.
- Card shows courseName, teacherName, status badge, progress bar, `{completedLessonCount}/{totalLessonCount} bài học`, enrolled date, completed date if present.

- [x] **Step 2: Verify and commit**

Run:

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```

Expected: ESLint 0 errors, build success.

Commit:

```bash
git add src/pages/student/learning/StudentEnrollmentsPage.tsx
git commit -m "feat: add student enrollments page"
```

---

### Task 8: Build Enrollment Progress And Basic Learning Page

**Files:**
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\pages\student\learning\StudentEnrollmentProgressPage.tsx`

- [x] **Step 1: Create progress page**

Create a React page with these imports:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../lib/api/client'
import { completeStudentLesson, getStudentEnrollment, startStudentLesson } from '../../../lib/api/studentLearningApi'
import type { StudentEnrollmentProgress, StudentLessonProgress } from '../../../lib/api/types'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { enrollmentStatusLabels, enrollmentStatusStyles, lessonProgressStatusLabels, lessonProgressStatusStyles, studentCourseTypeLabels, studentSkillTypeLabels } from './studentLearningLabels'
import { findFirstAvailableLesson, flattenProgressLessons, formatStudentLearningDate } from './studentLearningUtils'
```

Required behavior:

- Parse `enrollmentId` from route param `id`; invalid id shows `Không tìm thấy khóa học đã đăng ký.`.
- Load progress with cancellation guard.
- State: `enrollment`, `selectedLessonId`, `error`, `info`, `action`.
- After loading, select first non-completed lesson; if all completed, select first lesson; if no lessons, selected lesson remains null.
- Header: `Tiến độ học tập`.
- Show course name, teacher name, course type, level, enrollment status badge, progress bar, completed/total lesson count.
- Left/topic list shows lesson buttons with title, status badge, skill label, progress percent, and `aria-current` for selected lesson.
- Right learning panel:
  - If no selected lesson: `Chưa có bài học nào trong khóa học này.`
  - If selected: show lesson title, skill label, status, started/completed dates, content as whitespace-preserving text or `Bài học chưa có nội dung.`. For `LOCKED` lessons, do not show content; show `Bài học này chưa được mở khóa.` instead.
  - If status `UNLOCKED`, show button `Bắt đầu học` calling `startStudentLesson`.
  - If status `IN_PROGRESS`, show button `Hoàn thành bài học` calling `completeStudentLesson`.
  - Disable action buttons while `action !== null`.
  - Success messages: `Đã bắt đầu bài học.` and `Đã hoàn thành bài học.`
  - Error fallback: `Không thể cập nhật tiến độ bài học.`
- After start/complete, update `enrollment` from response data and keep selected lesson id.
- Do not render quiz answer inputs, answer correctness, question option lists, edit/create/delete/media controls.

- [x] **Step 2: Verify and commit**

Run:

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```

Expected: ESLint 0 errors, build success.

Commit:

```bash
git add src/pages/student/learning/StudentEnrollmentProgressPage.tsx
git commit -m "feat: add student enrollment progress page"
```

---

### Task 9: Wire Student Learning Routes

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\App.tsx`

- [x] **Step 1: Add imports**

Add imports near existing student page imports:

```ts
import { StudentCourseListPage } from './pages/student/learning/StudentCourseListPage'
import { StudentCourseDetailPage } from './pages/student/learning/StudentCourseDetailPage'
import { StudentEnrollmentsPage } from './pages/student/learning/StudentEnrollmentsPage'
import { StudentEnrollmentProgressPage } from './pages/student/learning/StudentEnrollmentProgressPage'
```

- [x] **Step 2: Add routes under StudentLayout**

Inside the existing `RequireRole role="STUDENT"` and `StudentLayout` route group, add:

```tsx
<Route path="/student/courses" element={<StudentCourseListPage />} />
<Route path="/student/courses/:id" element={<StudentCourseDetailPage />} />
<Route path="/student/enrollments" element={<StudentEnrollmentsPage />} />
<Route path="/student/enrollments/:id" element={<StudentEnrollmentProgressPage />} />
```

- [x] **Step 3: Verify and commit**

Run:

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```

Expected: ESLint 0 errors, build success.

Commit:

```bash
git add src/App.tsx
git commit -m "feat: add student learning routes"
```

---

### Task 10: Playwright Manual Verification

**Files:**
- Test: `C:\Users\Admin\AppData\Local\Temp\opencode\test_student_learning_phase6.py`

- [x] **Step 1: Ensure dev stack is running**

From `C:\baobao\KLTN\learne-platform\infra`, run if needed:

```powershell
docker compose -f docker-compose.dev.yml up -d --build
```

Expected services: frontend 5173, backend 8080, Mailpit 8025, PostgreSQL healthy.

- [x] **Step 2: Create Playwright script**

Create `C:\Users\Admin\AppData\Local\Temp\opencode\test_student_learning_phase6.py`.

Script requirements:

1. Login as admin `admin@learne.local` / `Admin123` through UI, not localStorage token injection.
2. Create or reuse a teacher account through admin API using bearer auth.
3. Create or reuse a student account. If creating via register OTP, read OTP from Mailpit; if using API setup, authenticate correctly and do not inject localStorage token.
4. Use teacher content API to create two courses with one topic, one lesson, and one question summary:
   - one course submitted and approved by admin
   - one course submitted then rejected or left pending
5. Login as student through UI.
6. Open sidebar tab `Khóa học` or route `/student/courses`.
7. Verify approved course is visible.
8. Verify pending/rejected course is not visible.
9. Open approved course detail and verify topic, lesson, lesson content, and question text/summary are visible.
10. Verify no answer option text or correct-answer badge is visible.
11. Click `Đăng ký khóa học` and verify enrollment detail opens.
12. Start the lesson with `Bắt đầu học`, verify success `Đã bắt đầu bài học.`.
13. Complete the lesson with `Hoàn thành bài học`, verify success `Đã hoàn thành bài học.` and progress reaches 100% or status becomes completed.
14. Open `/student/enrollments`, verify the enrolled course appears with progress.

- [x] **Step 3: Run script**

Run from temp directory:

```powershell
python test_student_learning_phase6.py
```

Expected: all checks PASS. If selectors need adjustment, update only the temp script. If app behavior fails, fix app code and rerun `npm.cmd run lint; if ($?) { npm.cmd run build }` before committing the fix.

---

### Task 11: Update Kanban Phase 6 Progress

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\docs\Docs_Capstone\Project_Plan_Trello_Kanban.md`

- [x] **Step 1: Update Phase 6 frontend progress**

After successful frontend implementation and Playwright verification, add a subsection under Phase 6:

```md
### Cập Nhật Triển Khai Frontend Phase 6

- Đã xây dựng giao diện Student Learning để học viên xem danh sách khóa học đã được duyệt tại `/student/courses`, xem chi tiết khóa học và đăng ký học.
- Đã xây dựng danh sách khóa học đã đăng ký và màn hình tiến độ học tập theo enrollment tại `/student/enrollments` và `/student/enrollments/{id}`.
- Đã bổ sung luồng học bài cơ bản cho phép học viên bắt đầu và hoàn thành lesson; phần quiz attempt, chấm điểm, XP/streak và AI recommendation được giữ cho các phase sau.
- Frontend chỉ sử dụng Student Learning API `/api/student/**`, qua đó xác nhận học viên chỉ nhìn thấy nội dung `APPROVED` do backend công khai.
- Frontend verification mới nhất: `npm.cmd run lint`, `npm.cmd run build` và Playwright manual flow `test_student_learning_phase6.py` chạy thành công.
```

Update `### Công Việc Chính` in Phase 6 by marking or removing frontend bullets now completed:

- `Xây dựng trang danh sách khóa học.`
- `Xây dựng trang chi tiết khóa học.`
- `Xây dựng trang tiến độ học tập theo từng khóa.`

Keep Phase 7 quiz and Phase 8 AI items as future work.

- [x] **Step 2: Commit docs submodule**

Inside docs submodule:

```bash
git add Docs_Capstone/Project_Plan_Trello_Kanban.md
git commit -m "docs: update phase 6 frontend learning progress"
```

---

### Task 12: Final Verification, Plan Completion, And Push

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\frontend\docs\superpowers\plans\2026-08-30-student-learning-ui.md`

- [x] **Step 1: Run final frontend verification**

Run from frontend:

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```

Expected: ESLint 0 errors, build success.

- [x] **Step 2: Run final Playwright verification**

Run from temp directory:

```powershell
python test_student_learning_phase6.py
```

Expected: all checks PASS.

- [x] **Step 3: Review diffs**

Run in frontend:

```bash
git diff origin/main..HEAD --stat
git log --oneline origin/main..HEAD
```

Expected frontend changes are limited to Student Learning types, API client, labels/helpers, navigation, routes, pages, dashboard copy, this spec, and this plan.

Run in docs:

```bash
git diff origin/main..HEAD --stat
git log --oneline origin/main..HEAD
```

Expected docs changes are limited to `Docs_Capstone/Project_Plan_Trello_Kanban.md`.

- [x] **Step 4: Mark plan complete**

Change every task checkbox in this file from `- [ ]` to `- [x]`, except the literal checkbox example in the header sentence.

Commit:

```bash
git add docs/superpowers/plans/2026-08-30-student-learning-ui.md
git commit -m "docs: mark student learning UI plan complete"
```

- [x] **Step 5: Push branches**

Push frontend branch:

```bash
git push -u origin feature/student-learning-ui
```

Push docs branch if docs changed:

```bash
git push -u origin feature/phase6-kanban-update
```

---

## Self-Review Notes

- **Spec coverage:** Tasks 1-9 implement Student Learning frontend; Task 10 verifies approved-only catalog, enroll, start and complete lesson; Task 11 updates Kanban; Task 12 completes final verification and push.
- **Scope control:** Quiz attempt, answer scoring, XP/streak, AI recommendation and media upload are intentionally excluded for later phases.
- **Backend alignment:** API paths and DTO fields match `StudentLearningController` and DTO records inspected in backend Phase 6.
- **Approved-only requirement:** Frontend uses only `/api/student/**` for course/enrollment content and verification explicitly checks pending/rejected courses do not appear to Student.
- **Question safety:** Student UI may show question text and metadata returned by backend, but must not display options, correct answers or correctness status.
