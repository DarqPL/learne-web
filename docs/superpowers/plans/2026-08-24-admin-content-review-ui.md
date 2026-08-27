# Admin Content Review UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the remaining Phase 5 work from the Kanban by building an Admin Review Dashboard for pending teacher-created courses, with approve/reject actions and rejection reasons.

**Architecture:** Backend Phase 5 already exists under `/api/admin/content/**`, so this plan is frontend-only. Add admin review DTO types and API wrappers, then build a read-only review page at `/admin/reviews` that shows pending courses on the left and full course/topic/lesson/question detail on the right. Use the existing Admin sidebar pattern and keep MVP review at course level only, matching the backend decision.

**Tech Stack:** React 19, TypeScript, react-router-dom, Vite, Tailwind CSS, existing `http` API client, existing `Button`, `Alert`, `Spinner` UI components.

---

## Source Context From Kanban Phase 5

Backend status in `docs/Docs_Capstone/Project_Plan_Trello_Kanban.md`:

- Backend module Admin Content Review exists under `/api/admin/content/**`.
- MVP review is course-level package review: Admin reviews one course plus all topics, lessons, questions and options inside it.
- Available endpoints:
  - `GET /api/admin/content/courses/pending`
  - `GET /api/admin/content/courses/{courseId}`
  - `POST /api/admin/content/courses/{courseId}/approve`
  - `POST /api/admin/content/courses/{courseId}/reject` with body `{ reason }`
- Approve changes course, lessons and questions to `APPROVED`.
- Reject changes course, lessons and questions to `REJECTED` and stores rejection reason on the course.
- Backend does not support separate lesson/question approve/reject in this MVP.

Out of scope for this Phase 5 UI plan:

- Student filtering for `APPROVED` content. Kanban explicitly says this belongs to Phase 6 implementation flow.
- Backend/schema changes.
- Lesson media upload/delete/update.
- Fine-grained lesson/question review actions.

---

## File Structure

- `src/lib/api/types.ts`: add admin review response/request types.
- `src/lib/api/adminReviewApi.ts`: API wrappers for `/api/admin/content/**`.
- `src/pages/admin/review/adminReviewLabels.ts`: status/type/skill/question labels and badge styles.
- `src/pages/admin/review/adminReviewUtils.ts`: count helpers and date formatting.
- `src/pages/admin/review/RejectCourseForm.tsx`: rejection reason form.
- `src/pages/admin/review/AdminContentReviewPage.tsx`: review dashboard page.
- `src/layouts/AdminSidebar.tsx`: add `Kiểm duyệt nội dung` tab.
- `src/App.tsx`: add `/admin/reviews` route.
- `src/pages/admin/AdminDashboardPage.tsx`: update copy to mention content review tab.

---

### Task 1: Add Admin Review Types

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\lib\api\types.ts`

- [ ] **Step 1: Append admin review types**

Append this block to `src/lib/api/types.ts`. If `ContentStatus`, `CourseType`, `SkillType`, or `QuestionType` already exist from Phase 4 UI, do not duplicate those enum type definitions; append only the `AdminReview*` interfaces and reuse the existing enum types. If those enum types do not exist in the execution branch, add them exactly as shown before the interfaces.

```ts
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
```

- [ ] **Step 2: Typecheck**

Run:

```powershell
node node_modules/typescript/bin/tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/types.ts
git commit -m "feat: add admin content review API types"
```

---

### Task 2: Add Admin Review API Client

**Files:**
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\lib\api\adminReviewApi.ts`

- [ ] **Step 1: Create API wrapper**

Create `src/lib/api/adminReviewApi.ts`:

```ts
import { http } from './client'
import type { AdminReviewCourseDetail, AdminReviewCourseSummary, RejectContentRequest } from './types'

const base = '/api/admin/content'

export function listPendingReviewCourses() {
  return http.get<AdminReviewCourseSummary[]>(`${base}/courses/pending`)
}

export function getReviewCourse(courseId: number) {
  return http.get<AdminReviewCourseDetail>(`${base}/courses/${courseId}`)
}

export function approveReviewCourse(courseId: number) {
  return http.post<AdminReviewCourseDetail>(`${base}/courses/${courseId}/approve`, {})
}

export function rejectReviewCourse(courseId: number, payload: RejectContentRequest) {
  return http.post<AdminReviewCourseDetail>(`${base}/courses/${courseId}/reject`, payload)
}
```

- [ ] **Step 2: Verify and commit**

Run:

```powershell
node node_modules/typescript/bin/tsc --noEmit
```

Expected: exit 0.

Commit:

```bash
git add src/lib/api/adminReviewApi.ts
git commit -m "feat: add admin content review API client"
```

---

### Task 3: Add Review Labels And Helpers

**Files:**
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\pages\admin\review\adminReviewLabels.ts`
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\pages\admin\review\adminReviewUtils.ts`

- [ ] **Step 1: Create labels**

Create `adminReviewLabels.ts`:

```ts
import type { ContentStatus, CourseType, QuestionType, SkillType } from '../../../lib/api/types'

export const reviewStatusLabels: Record<ContentStatus, string> = {
  DRAFT: 'Bản nháp',
  PENDING_REVIEW: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
  HIDDEN: 'Đã ẩn',
}

export const reviewStatusStyles: Record<ContentStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_REVIEW: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-700',
  HIDDEN: 'bg-slate-100 text-slate-700',
}

export const reviewCourseTypeLabels: Record<CourseType, string> = {
  COMPREHENSIVE: 'Tổng hợp',
  GRAMMAR: 'Ngữ pháp',
  LISTENING: 'Nghe',
  SPEAKING: 'Nói',
  READING: 'Đọc',
  WRITING: 'Viết',
  VOCABULARY: 'Từ vựng',
  PRONUNCIATION: 'Phát âm',
}

export const reviewSkillTypeLabels: Record<SkillType, string> = {
  GRAMMAR: 'Ngữ pháp',
  LISTENING: 'Nghe',
  SPEAKING: 'Nói',
  READING: 'Đọc',
  WRITING: 'Viết',
  VOCABULARY: 'Từ vựng',
  PRONUNCIATION: 'Phát âm',
}

export const reviewQuestionTypeLabels: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm một đáp án',
  FILL_BLANK: 'Điền vào chỗ trống',
  WORD_ORDER: 'Sắp xếp từ',
  TRANSLATION: 'Dịch câu',
  TRUE_FALSE: 'Đúng / Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
  PRONUNCIATION: 'Phát âm',
}
```

- [ ] **Step 2: Create utilities**

Create `adminReviewUtils.ts`:

```ts
import type { AdminReviewCourseDetail } from '../../../lib/api/types'

export function countReviewLessons(course: AdminReviewCourseDetail) {
  return course.topics.reduce((total, topic) => total + topic.lessons.length, 0)
}

export function countReviewQuestions(course: AdminReviewCourseDetail) {
  return course.topics.reduce(
    (total, topic) => total + topic.lessons.reduce((lessonTotal, lesson) => lessonTotal + lesson.questions.length, 0),
    0,
  )
}

export function formatReviewDate(value: string | null) {
  if (!value) return 'Chưa có'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}
```

- [ ] **Step 3: Verify and commit**

Run:

```powershell
node node_modules/typescript/bin/tsc --noEmit
```

Expected: exit 0.

Commit:

```bash
git add src/pages/admin/review/adminReviewLabels.ts src/pages/admin/review/adminReviewUtils.ts
git commit -m "feat: add admin review labels and helpers"
```

---

### Task 4: Add Reject Course Form

**Files:**
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\pages\admin\review\RejectCourseForm.tsx`

- [ ] **Step 1: Create form**

Create `RejectCourseForm.tsx`:

```tsx
import { useState } from 'react'
import { Button } from '../../../components/ui/Button'

export interface RejectCourseFormProps {
  loading?: boolean
  disabled?: boolean
  onSubmit: (reason: string) => void
}

export function RejectCourseForm({ loading = false, disabled = false, onSubmit }: RejectCourseFormProps) {
  const [reason, setReason] = useState('')
  const [validation, setValidation] = useState<string | null>(null)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (disabled || loading) return
    const trimmed = reason.trim()
    if (!trimmed) {
      setValidation('Vui lòng nhập lý do từ chối.')
      return
    }
    if (trimmed.length > 2000) {
      setValidation('Lý do từ chối tối đa 2000 ký tự.')
      return
    }
    setValidation(null)
    onSubmit(trimmed)
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-gray-700">
        Lý do từ chối
        <textarea
          className="mt-1 min-h-28 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={reason}
          maxLength={2000}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Nhập nội dung cần giảng viên chỉnh sửa trước khi gửi duyệt lại."
        />
      </label>
      {validation ? <div className="text-sm text-red-600">{validation}</div> : null}
      <Button type="submit" variant="danger" loading={loading} disabled={disabled}>
        Từ chối khóa học
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Verify and commit**

Run:

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```

Expected: ESLint 0 errors, build success.

Commit:

```bash
git add src/pages/admin/review/RejectCourseForm.tsx
git commit -m "feat: add reject course review form"
```

---

### Task 5: Build Admin Content Review Page

**Files:**
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\pages\admin\review\AdminContentReviewPage.tsx`

- [ ] **Step 1: Create page state and load flow**

Create `AdminContentReviewPage.tsx` with these imports:

```tsx
import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../../lib/api/client'
import { approveReviewCourse, getReviewCourse, listPendingReviewCourses, rejectReviewCourse } from '../../../lib/api/adminReviewApi'
import type { AdminReviewCourseDetail, AdminReviewCourseSummary } from '../../../lib/api/types'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { RejectCourseForm } from './RejectCourseForm'
import { reviewCourseTypeLabels, reviewQuestionTypeLabels, reviewSkillTypeLabels, reviewStatusLabels, reviewStatusStyles } from './adminReviewLabels'
import { countReviewLessons, countReviewQuestions, formatReviewDate } from './adminReviewUtils'
```

Core state:

```tsx
const [courses, setCourses] = useState<AdminReviewCourseSummary[] | null>(null)
const [selectedCourse, setSelectedCourse] = useState<AdminReviewCourseDetail | null>(null)
const [error, setError] = useState<string | null>(null)
const [info, setInfo] = useState<string | null>(null)
const [action, setAction] = useState<string | null>(null)
```

Load pending list on mount using async IIFE + cancellation flag. If list is non-empty, load the first course detail.

- [ ] **Step 2: Add load/select/action handlers**

Implement handlers:

```tsx
const loadPendingCourses = async (nextSelectedId?: number | null) => { /* get list, set list, load selected detail */ }
const handleSelectCourse = async (courseId: number) => { /* load detail */ }
const handleApproveCourse = async () => { /* confirm, approve, info, reload list */ }
const handleRejectCourse = async (reason: string) => { /* reject, info, reload list */ }
```

Required confirm message for approve:

```ts
'Bạn có chắc muốn duyệt khóa học này?'
```

Required success messages:

```ts
'Đã duyệt khóa học.'
'Đã từ chối khóa học.'
```

Common error fallback:

```ts
getApiErrorMessage(err, 'Không thể cập nhật kiểm duyệt nội dung.')
```

- [ ] **Step 3: Render pending list**

Render header:

- `h1`: `Kiểm duyệt nội dung`
- description: `Xem khóa học giảng viên gửi duyệt và phê duyệt hoặc từ chối theo gói nội dung.`

Render two-column layout: `grid gap-6 lg:grid-cols-[20rem_1fr]`.

Left card:

- heading `Khóa học chờ duyệt`
- empty state `Không có khóa học nào đang chờ duyệt.`
- each pending course as a button showing:
  - name
  - teacher name + email
  - level + course type
  - topic/lesson/question counts from summary
  - updated date via `formatReviewDate(course.updatedAt)`

- [ ] **Step 4: Render selected course detail**

Right card when no selection:

```tsx
<p className="text-sm text-gray-600">Chọn một khóa học để xem nội dung cần duyệt.</p>
```

When selected:

- course title, status badge, teacher name/email, level, type, updated date.
- content counts using detail helpers.
- description if present.
- approve button `Duyệt khóa học` and `RejectCourseForm`.
- disable approve/reject while `action !== null`.
- show nested read-only content:
  - Topic heading `Chủ đề`
  - Lesson heading `Bài học`, skill type, XP, placement test flag, lesson content text
  - Question heading `Câu hỏi`, question type, text, correct answer, explanation, knowledge point, difficulty, XP
  - Options list showing option text and badge `Đáp án đúng` for correct option

Do not render edit/create/delete controls for content. This page is review-only except approve/reject course.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```

Expected: ESLint 0 errors, build success.

Commit:

```bash
git add src/pages/admin/review/AdminContentReviewPage.tsx
git commit -m "feat: add admin content review page"
```

---

### Task 6: Wire Admin Review Route And Sidebar

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\App.tsx`
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\layouts\AdminSidebar.tsx`
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\pages\admin\AdminDashboardPage.tsx`

- [ ] **Step 1: Add route**

In `App.tsx`, import:

```ts
import { AdminContentReviewPage } from './pages/admin/review/AdminContentReviewPage'
```

Under `AdminLayout`, add route:

```tsx
<Route path="/admin/reviews" element={<AdminContentReviewPage />} />
```

- [ ] **Step 2: Add sidebar item**

In `AdminSidebar.tsx`, update `tabs` to:

```ts
const tabs = [
  { label: 'Tổng quan', to: '/admin', end: true },
  { label: 'Quản lý giảng viên', to: '/admin/teachers', end: false },
  { label: 'Kiểm duyệt nội dung', to: '/admin/reviews', end: false },
]
```

- [ ] **Step 3: Update dashboard copy**

In `AdminDashboardPage.tsx`, update the paragraph to:

```tsx
Chào mừng {user?.fullName}! Quản lý giảng viên và kiểm duyệt nội dung học tập ở các tab bên trái.
```

- [ ] **Step 4: Verify and commit**

Run:

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```

Expected: ESLint 0 errors, build success.

Commit:

```bash
git add src/App.tsx src/layouts/AdminSidebar.tsx src/pages/admin/AdminDashboardPage.tsx
git commit -m "feat: add admin content review route"
```

---

### Task 7: Playwright Manual Verification

**Files:**
- Test: `C:\Users\Admin\AppData\Local\Temp\opencode\test_admin_content_review.py`

- [ ] **Step 1: Ensure dev stack is running**

From `C:\baobao\KLTN\learne-platform\infra`, run if needed:

```powershell
docker compose -f docker-compose.dev.yml up -d --build
```

Expected services: frontend 5173, backend 8080, Mailpit 8025, PostgreSQL healthy.

- [ ] **Step 2: Create test script**

Create `C:\Users\Admin\AppData\Local\Temp\opencode\test_admin_content_review.py`.

Script requirements:

1. Login as admin `admin@learne.local` / `Admin123`.
2. Create a teacher account if a known teacher account is not available.
3. Login/change teacher password if needed.
4. Use teacher content API or teacher UI to create a course with one topic, one lesson and one multiple-choice question, then submit it to review.
5. Login as admin again.
6. Click sidebar tab `Kiểm duyệt nội dung`.
7. Verify the pending course appears.
8. Open course detail and verify topic, lesson, question and option text are visible.
9. Reject the course with a unique reason; verify course disappears from pending list or status no longer shows as pending.
10. Repeat setup for a second pending course and approve it; verify success message `Đã duyệt khóa học.` and course disappears from pending list or status changes to `Đã duyệt`.

Use UI login flow, not localStorage token injection. If using backend API setup, authenticate with `/api/auth/login` and pass `Authorization: Bearer <accessToken>` for teacher/admin API calls.

- [ ] **Step 3: Run script**

Run from temp directory:

```powershell
python test_admin_content_review.py
```

Expected: all checks PASS. If selectors need adjustment, update only the temp script. If app behavior fails, fix app code and rerun lint/build before committing fixes.

---

### Task 8: Update Kanban Phase 5 Progress

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\docs\Docs_Capstone\Project_Plan_Trello_Kanban.md`

- [ ] **Step 1: Update Phase 5 section**

After successful frontend implementation and Playwright verification, update Phase 5 with a new subsection:

```md
### Cập Nhật Triển Khai Frontend Phase 5

- Đã xây dựng Admin Review Dashboard tại `/admin/reviews` để Admin xem danh sách khóa học chờ duyệt và chi tiết toàn bộ topic, lesson, question, option bên trong.
- Đã tích hợp API approve/reject khóa học theo hướng kiểm duyệt trọn gói MVP.
- Đã bổ sung form nhập lý do từ chối; lý do này được backend lưu ở course để giảng viên chỉnh sửa và gửi lại.
- Frontend verification mới nhất: `npm.cmd run lint`, `npm.cmd run build` và Playwright manual flow `test_admin_content_review.py` chạy thành công.
```

Update `### Công Việc Chính` by removing or marking complete the three frontend Phase 5 bullets now completed. Keep the Phase 6 approved-filter bullet as future work.

- [ ] **Step 2: Commit docs**

Commit inside docs submodule if `docs/` is a submodule and this file belongs there:

```bash
git add Docs_Capstone/Project_Plan_Trello_Kanban.md
git commit -m "docs: update phase 5 frontend review progress"
```

If working from root, do not commit root pointer until frontend and docs submodule commits are pushed.

---

### Task 9: Final Review And Push

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\frontend\docs\superpowers\plans\2026-08-24-admin-content-review-ui.md`

- [ ] **Step 1: Final verification**

Run from frontend:

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```

Expected: ESLint 0 errors, build success.

Run from temp directory:

```powershell
python test_admin_content_review.py
```

Expected: all checks PASS.

- [ ] **Step 2: Review diffs**

Run in frontend:

```bash
git diff origin/main..HEAD --stat
git log --oneline origin/main..HEAD
```

Expected frontend changes are limited to Admin Review UI/API/types/routing/sidebar/dashboard copy and this plan.

Run in docs:

```bash
git diff origin/main..HEAD --stat
git log --oneline origin/main..HEAD
```

Expected docs changes are limited to `Docs_Capstone/Project_Plan_Trello_Kanban.md`.

- [ ] **Step 3: Tick plan checkboxes**

Change every task checkbox in this file from `- [ ]` to `- [x]`, except the literal checkbox example in the header sentence.

Commit:

```bash
git add docs/superpowers/plans/2026-08-24-admin-content-review-ui.md
git commit -m "docs: mark admin content review UI plan complete"
```

- [ ] **Step 4: Push branches**

Push frontend branch:

```bash
git push -u origin feature/admin-content-review-ui
```

Push docs branch if docs changed:

```bash
git push -u origin feature/phase5-kanban-update
```

---

## Self-Review Notes

- **Spec coverage:** Phase 5 Kanban frontend work maps to Tasks 1-7; Kanban progress update maps to Task 8; final verification/push maps to Task 9.
- **Scope control:** Student approved-only filtering remains a Phase 6 note, not implemented here.
- **Backend alignment:** Endpoints, DTO fields and reject body match `AdminContentReviewController` and `RejectContentRequest`.
- **No media:** The plan does not add lesson media upload/delete/update.
- **MVP review model:** This plan supports course-level approve/reject only, matching backend Phase 5 MVP and explicitly excluding separate lesson/question review.
