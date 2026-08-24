# Teacher Content UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the remaining Phase 4 Teacher Content UI so teachers can manage courses, topics, lessons and questions, then submit a course for review, without implementing lesson media upload/delete/update.

**Architecture:** Add a one-page content studio at `/teacher/content`. Keep API wrappers in `src/lib/api/teacherContentApi.ts`, shared content types in `src/lib/api/types.ts`, route/nav integration in existing auth/router files, and UI in focused components under `src/pages/teacher/content/`.

**Tech Stack:** React 19, TypeScript, react-router-dom, Vite, Tailwind CSS, existing `http` API client, existing `Button`, `Alert`, `Spinner` UI components.

---

## File Structure

- `src/lib/api/types.ts`: add content enums, response types and request types.
- `src/lib/api/teacherContentApi.ts`: API wrappers for `/api/teacher/content/**`.
- `src/lib/auth/routes.ts`: add Teacher nav item `Nội dung học tập`.
- `src/App.tsx`: add `/teacher/content` route.
- `src/pages/teacher/TeacherDashboardPage.tsx`: update copy to point teachers to content page.
- `src/pages/teacher/content/contentLabels.ts`: labels and status styles.
- `src/pages/teacher/content/contentUtils.ts`: count helpers and editability helpers.
- `src/pages/teacher/content/TeacherContentPage.tsx`: page orchestration, load/select course, CRUD actions.
- `src/pages/teacher/content/CourseForm.tsx`: course create/edit form.
- `src/pages/teacher/content/TopicForm.tsx`: topic create/edit form.
- `src/pages/teacher/content/LessonForm.tsx`: lesson create/edit form, text-only content, no media fields.
- `src/pages/teacher/content/QuestionForm.tsx`: question create/edit form with all backend question types.

---

### Task 1: Add Teacher Content API Types

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\lib\api\types.ts`

- [x] **Step 1: Append content enums and interfaces**

Append this block to the end of `src/lib/api/types.ts`:

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
```

Do not add lesson media fields. The current backend response DTO does not return lesson media yet.

- [x] **Step 2: Typecheck**

Run:

```powershell
node node_modules/typescript/bin/tsc --noEmit
```

Expected: exit 0.

- [x] **Step 3: Commit**

```bash
git add src/lib/api/types.ts
git commit -m "feat: add teacher content API types"
```

---

### Task 2: Add Teacher Content API Wrapper

**Files:**
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\lib\api\teacherContentApi.ts`

- [x] **Step 1: Create API wrapper**

Create `src/lib/api/teacherContentApi.ts`:

```ts
import { http } from './client'
import type {
  ApiMessageResponse,
  TeacherCourse,
  TeacherCourseRequest,
  TeacherLesson,
  TeacherLessonRequest,
  TeacherQuestion,
  TeacherQuestionRequest,
  TeacherTopic,
  TeacherTopicRequest,
} from './types'

const base = '/api/teacher/content'

export function listTeacherCourses() {
  return http.get<TeacherCourse[]>(`${base}/courses`)
}

export function createTeacherCourse(payload: TeacherCourseRequest) {
  return http.post<TeacherCourse>(`${base}/courses`, payload)
}

export function getTeacherCourse(courseId: number) {
  return http.get<TeacherCourse>(`${base}/courses/${courseId}`)
}

export function updateTeacherCourse(courseId: number, payload: TeacherCourseRequest) {
  return http.put<TeacherCourse>(`${base}/courses/${courseId}`, payload)
}

export function deleteTeacherCourse(courseId: number) {
  return http.delete<ApiMessageResponse>(`${base}/courses/${courseId}`)
}

export function createTeacherTopic(courseId: number, payload: TeacherTopicRequest) {
  return http.post<TeacherTopic>(`${base}/courses/${courseId}/topics`, payload)
}

export function updateTeacherTopic(topicId: number, payload: TeacherTopicRequest) {
  return http.put<TeacherTopic>(`${base}/topics/${topicId}`, payload)
}

export function deleteTeacherTopic(topicId: number) {
  return http.delete<ApiMessageResponse>(`${base}/topics/${topicId}`)
}

export function createTeacherLesson(topicId: number, payload: TeacherLessonRequest) {
  return http.post<TeacherLesson>(`${base}/topics/${topicId}/lessons`, payload)
}

export function updateTeacherLesson(lessonId: number, payload: TeacherLessonRequest) {
  return http.put<TeacherLesson>(`${base}/lessons/${lessonId}`, payload)
}

export function deleteTeacherLesson(lessonId: number) {
  return http.delete<ApiMessageResponse>(`${base}/lessons/${lessonId}`)
}

export function createTeacherQuestion(lessonId: number, payload: TeacherQuestionRequest) {
  return http.post<TeacherQuestion>(`${base}/lessons/${lessonId}/questions`, payload)
}

export function updateTeacherQuestion(questionId: number, payload: TeacherQuestionRequest) {
  return http.put<TeacherQuestion>(`${base}/questions/${questionId}`, payload)
}

export function deleteTeacherQuestion(questionId: number) {
  return http.delete<ApiMessageResponse>(`${base}/questions/${questionId}`)
}

export function submitTeacherCourse(courseId: number) {
  return http.post<TeacherCourse>(`${base}/courses/${courseId}/submit`, {})
}
```

- [x] **Step 2: Typecheck**

Run:

```powershell
node node_modules/typescript/bin/tsc --noEmit
```

Expected: exit 0.

- [x] **Step 3: Commit**

```bash
git add src/lib/api/teacherContentApi.ts
git commit -m "feat: add teacher content API client"
```

---

### Task 3: Add Labels And Content Helpers

**Files:**
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\pages\teacher\content\contentLabels.ts`
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\pages\teacher\content\contentUtils.ts`

- [x] **Step 1: Create labels file**

Create `src/pages/teacher/content/contentLabels.ts`:

```ts
import type { ContentStatus, CourseType, QuestionType, SkillType } from '../../../lib/api/types'

export const contentStatusLabels: Record<ContentStatus, string> = {
  DRAFT: 'Bản nháp',
  PENDING_REVIEW: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
  HIDDEN: 'Đã ẩn',
}

export const contentStatusStyles: Record<ContentStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_REVIEW: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-700',
  HIDDEN: 'bg-slate-100 text-slate-700',
}

export const courseTypeLabels: Record<CourseType, string> = {
  COMPREHENSIVE: 'Tổng hợp',
  GRAMMAR: 'Ngữ pháp',
  LISTENING: 'Nghe',
  SPEAKING: 'Nói',
  READING: 'Đọc',
  WRITING: 'Viết',
  VOCABULARY: 'Từ vựng',
  PRONUNCIATION: 'Phát âm',
}

export const skillTypeLabels: Record<SkillType, string> = {
  GRAMMAR: 'Ngữ pháp',
  LISTENING: 'Nghe',
  SPEAKING: 'Nói',
  READING: 'Đọc',
  WRITING: 'Viết',
  VOCABULARY: 'Từ vựng',
  PRONUNCIATION: 'Phát âm',
}

export const questionTypeLabels: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm nhiều đáp án',
  FILL_BLANK: 'Điền vào chỗ trống',
  WORD_ORDER: 'Sắp xếp từ',
  TRANSLATION: 'Dịch câu',
  TRUE_FALSE: 'Đúng / Sai',
  SHORT_ANSWER: 'Trả lời ngắn',
  PRONUNCIATION: 'Phát âm',
}

export const courseTypes = Object.keys(courseTypeLabels) as CourseType[]
export const skillTypes = Object.keys(skillTypeLabels) as SkillType[]
export const questionTypes = Object.keys(questionTypeLabels) as QuestionType[]
```

- [x] **Step 2: Create utility file**

Create `src/pages/teacher/content/contentUtils.ts`:

```ts
import type { ContentStatus, TeacherCourse } from '../../../lib/api/types'

export function canEditContent(status: ContentStatus) {
  return status === 'DRAFT' || status === 'REJECTED'
}

export function countLessons(course: TeacherCourse) {
  return course.topics.reduce((total, topic) => total + topic.lessons.length, 0)
}

export function countQuestions(course: TeacherCourse) {
  return course.topics.reduce(
    (total, topic) => total + topic.lessons.reduce((lessonTotal, lesson) => lessonTotal + lesson.questions.length, 0),
    0,
  )
}

export function canSubmitCourse(course: TeacherCourse) {
  return canEditContent(course.status) && course.topics.length > 0 && countLessons(course) > 0 && countQuestions(course) > 0
}
```

- [x] **Step 3: Typecheck and commit**

Run:

```powershell
node node_modules/typescript/bin/tsc --noEmit
```

Expected: exit 0.

Commit:

```bash
git add src/pages/teacher/content/contentLabels.ts src/pages/teacher/content/contentUtils.ts
git commit -m "feat: add teacher content UI helpers"
```

---

### Task 4: Add Course, Topic And Lesson Forms

**Files:**
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\pages\teacher\content\CourseForm.tsx`
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\pages\teacher\content\TopicForm.tsx`
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\pages\teacher\content\LessonForm.tsx`

- [x] **Step 1: Create CourseForm**

Create `CourseForm.tsx` with controlled fields for `TeacherCourseRequest`. Use `courseTypes` labels. Submit calls `onSubmit(payload)` and keeps validation local: `name` and `level` must be non-empty. Include `Button` loading state from prop.

Required exported API:

```ts
interface CourseFormProps {
  initialValue?: TeacherCourseRequest
  loading?: boolean
  submitLabel: string
  onSubmit: (payload: TeacherCourseRequest) => void
}
```

Export `function CourseForm({ initialValue, loading = false, submitLabel, onSubmit }: CourseFormProps)`. Function body requirements: initialize state from `initialValue ?? defaultCourse`, render the five labeled fields, parse numeric `orderIndex` with `Number(event.target.value)`, show a local validation message when `name` or `level` is blank, and call `onSubmit(form)` on valid submit.

Default course payload:

```ts
const defaultCourse: TeacherCourseRequest = {
  name: '',
  description: '',
  type: 'COMPREHENSIVE',
  level: 'A1',
  orderIndex: 0,
}
```

The rendered form must include labels exactly: `Tên khóa học`, `Mô tả`, `Loại khóa học`, `Cấp độ`, `Thứ tự`.

- [x] **Step 2: Create TopicForm**

Create `TopicForm.tsx` with controlled fields for `TeacherTopicRequest`.

Required exported API:

```ts
interface TopicFormProps {
  initialValue?: TeacherTopicRequest
  loading?: boolean
  submitLabel: string
  onSubmit: (payload: TeacherTopicRequest) => void
}
```

Export `function TopicForm({ initialValue, loading = false, submitLabel, onSubmit }: TopicFormProps)`. Function body requirements: initialize state from `initialValue ?? defaultTopic`, render the three labeled fields, parse numeric `orderIndex`, show a local validation message when `name` is blank, and call `onSubmit(form)` on valid submit.

Default topic payload:

```ts
const defaultTopic: TeacherTopicRequest = {
  name: '',
  description: '',
  orderIndex: 0,
}
```

The rendered form must include labels exactly: `Tên chủ đề`, `Mô tả`, `Thứ tự`.

- [x] **Step 3: Create LessonForm**

Create `LessonForm.tsx` with controlled fields for `TeacherLessonRequest`. Use `skillTypes` labels. Do **not** add media upload inputs.

Required exported API:

```ts
interface LessonFormProps {
  initialValue?: TeacherLessonRequest
  loading?: boolean
  submitLabel: string
  onSubmit: (payload: TeacherLessonRequest) => void
}
```

Export `function LessonForm({ initialValue, loading = false, submitLabel, onSubmit }: LessonFormProps)`. Function body requirements: initialize state from `initialValue ?? defaultLesson`, render the seven labeled fields, parse numeric `orderIndex` and `xpReward`, update `placementTest` from checkbox checked state, show local validation for blank `title` and negative `xpReward`, and call `onSubmit(form)` on valid submit.

Default lesson payload:

```ts
const defaultLesson: TeacherLessonRequest = {
  title: '',
  description: '',
  content: '',
  skillType: 'GRAMMAR',
  orderIndex: 0,
  xpReward: 0,
  placementTest: false,
}
```

The rendered form must include labels exactly: `Tiêu đề bài học`, `Mô tả`, `Nội dung`, `Kỹ năng`, `Thứ tự`, `XP`, `Bài kiểm tra đầu vào`.

- [x] **Step 4: Typecheck and commit**

Run:

```powershell
node node_modules/typescript/bin/tsc --noEmit
```

Expected: exit 0.

Commit:

```bash
git add src/pages/teacher/content/CourseForm.tsx src/pages/teacher/content/TopicForm.tsx src/pages/teacher/content/LessonForm.tsx
git commit -m "feat: add teacher content course topic lesson forms"
```

---

### Task 5: Add Question Form

**Files:**
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\pages\teacher\content\QuestionForm.tsx`

- [x] **Step 1: Create QuestionForm**

Create a controlled `QuestionForm` that supports all backend question types.

Required exported API:

```ts
interface QuestionFormProps {
  initialValue?: TeacherQuestionRequest
  loading?: boolean
  submitLabel: string
  onSubmit: (payload: TeacherQuestionRequest) => void
}
```

Export `function QuestionForm({ initialValue, loading = false, submitLabel, onSubmit }: QuestionFormProps)`. Function body requirements: initialize state from `initialValue ?? defaultQuestion`, render fields listed below, switch option UI based on `type`, normalize options before submit, show validation errors above the submit button, and call `onSubmit(payload)` only when validation passes.

Default question payload:

```ts
const defaultQuestion: TeacherQuestionRequest = {
  type: 'MULTIPLE_CHOICE',
  questionText: '',
  explanation: '',
  correctAnswer: '',
  knowledgePoint: '',
  orderIndex: 0,
  difficulty: 'A1',
  xpReward: 0,
  options: [
    { optionText: '', correct: true, orderIndex: 0 },
    { optionText: '', correct: false, orderIndex: 1 },
  ],
}
```

Behavior:

- Type select uses `questionTypes` and `questionTypeLabels`.
- If type is `MULTIPLE_CHOICE`, show editable option rows and buttons `Thêm lựa chọn`, `Xóa`.
- If type is `TRUE_FALSE`, show two radio choices `Đúng` and `Sai`, and submit options as two option objects.
- For all other types, hide options and submit `options: []`.
- Always show fields `Câu hỏi`, `Đáp án đúng`, `Giải thích`, `Điểm kiến thức`, `Độ khó`, `Thứ tự`, `XP`.

Frontend validation before `onSubmit`:

- `questionText.trim()` must not be empty.
- `MULTIPLE_CHOICE` must have at least 2 non-empty options and at least 1 correct option.
- `xpReward` must be `>= 0`.

Show validation errors in a small red text block above the submit button.

- [x] **Step 2: Typecheck and commit**

Run:

```powershell
node node_modules/typescript/bin/tsc --noEmit
```

Expected: exit 0.

Commit:

```bash
git add src/pages/teacher/content/QuestionForm.tsx
git commit -m "feat: add teacher content question form"
```

---

### Task 6: Build TeacherContentPage

**Files:**
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\pages\teacher\content\TeacherContentPage.tsx`

- [x] **Step 1: Create page skeleton and loading flow**

Create `TeacherContentPage.tsx` that imports all API functions from `teacherContentApi.ts`, uses `getApiErrorMessage`, `Alert`, `Button`, `Spinner`, all forms, labels and helpers.

State required:

```ts
const [courses, setCourses] = useState<TeacherCourse[] | null>(null)
const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
const [error, setError] = useState<string | null>(null)
const [info, setInfo] = useState<string | null>(null)
const [action, setAction] = useState<string | null>(null)
```

Load on mount with async IIFE and cancellation flag, following the existing `AdminTeacherListPage.tsx` pattern. After load, if there is no selected course and response is non-empty, select the first course.

- [x] **Step 2: Implement course list**

Render left column with:

- Header `Khóa học của tôi`.
- Empty state `Chưa có khóa học nào.`.
- Each course button shows name, level, type label, status badge, and counts: `{topics.length} chủ đề`, `{countLessons(course)} bài học`, `{countQuestions(course)} câu hỏi`.

Use `selectedCourseId` to highlight active course.

- [x] **Step 3: Implement course create/edit/delete/submit actions**

Implement handlers:

```ts
const refreshCourses = async (nextSelectedId?: number | null) => {
  const response = await listTeacherCourses()
  setCourses(response.data)
  setSelectedCourseId(nextSelectedId ?? response.data[0]?.id ?? null)
}

const handleCreateCourse = async (payload: TeacherCourseRequest) => {
  setAction('create-course')
  setError(null)
  try {
    const response = await createTeacherCourse(payload)
    setInfo('Đã tạo khóa học.')
    await refreshCourses(response.data.id)
  } catch (err) {
    setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
  } finally {
    setAction(null)
  }
}

const handleUpdateCourse = async (payload: TeacherCourseRequest) => {
  if (!selectedCourseId) return
  setAction('update-course')
  setError(null)
  try {
    await updateTeacherCourse(selectedCourseId, payload)
    setInfo('Đã lưu khóa học.')
    await refreshCourses(selectedCourseId)
  } catch (err) {
    setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
  } finally {
    setAction(null)
  }
}

const handleDeleteCourse = async () => {
  if (!selectedCourseId || !window.confirm('Bạn có chắc muốn xóa khóa học này?')) return
  setAction('delete-course')
  setError(null)
  try {
    await deleteTeacherCourse(selectedCourseId)
    setInfo('Đã xóa khóa học.')
    await refreshCourses(null)
  } catch (err) {
    setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
  } finally {
    setAction(null)
  }
}

const handleSubmitCourse = async () => {
  if (!selectedCourseId) return
  setAction('submit-course')
  setError(null)
  try {
    await submitTeacherCourse(selectedCourseId)
    setInfo('Đã gửi khóa học sang trạng thái chờ duyệt.')
    await refreshCourses(selectedCourseId)
  } catch (err) {
    setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
  } finally {
    setAction(null)
  }
}
```

Rules:

- Confirm before delete: `Bạn có chắc muốn xóa khóa học này?`.
- On create, select created course.
- On submit, show success `Đã gửi khóa học sang trạng thái chờ duyệt.`.
- On backend error, show `getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.')`.

- [x] **Step 4: Implement topic/lesson/question actions**

Implement handlers:

```ts
const handleCreateTopic = async (courseId: number, payload: TeacherTopicRequest) => {
  setAction(`create-topic-${courseId}`)
  setError(null)
  try {
    await createTeacherTopic(courseId, payload)
    setInfo('Đã tạo chủ đề.')
    await refreshCourses(selectedCourseId)
  } catch (err) {
    setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
  } finally {
    setAction(null)
  }
}

const handleUpdateTopic = async (topicId: number, payload: TeacherTopicRequest) => {
  setAction(`update-topic-${topicId}`)
  setError(null)
  try {
    await updateTeacherTopic(topicId, payload)
    setInfo('Đã lưu chủ đề.')
    await refreshCourses(selectedCourseId)
  } catch (err) {
    setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
  } finally {
    setAction(null)
  }
}

const handleDeleteTopic = async (topicId: number) => {
  if (!window.confirm('Bạn có chắc muốn xóa chủ đề này?')) return
  setAction(`delete-topic-${topicId}`)
  setError(null)
  try {
    await deleteTeacherTopic(topicId)
    setInfo('Đã xóa chủ đề.')
    await refreshCourses(selectedCourseId)
  } catch (err) {
    setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
  } finally {
    setAction(null)
  }
}

const handleCreateLesson = async (topicId: number, payload: TeacherLessonRequest) => {
  setAction(`create-lesson-${topicId}`)
  setError(null)
  try {
    await createTeacherLesson(topicId, payload)
    setInfo('Đã tạo bài học.')
    await refreshCourses(selectedCourseId)
  } catch (err) {
    setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
  } finally {
    setAction(null)
  }
}

const handleUpdateLesson = async (lessonId: number, payload: TeacherLessonRequest) => {
  setAction(`update-lesson-${lessonId}`)
  setError(null)
  try {
    await updateTeacherLesson(lessonId, payload)
    setInfo('Đã lưu bài học.')
    await refreshCourses(selectedCourseId)
  } catch (err) {
    setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
  } finally {
    setAction(null)
  }
}

const handleDeleteLesson = async (lessonId: number) => {
  if (!window.confirm('Bạn có chắc muốn xóa bài học này?')) return
  setAction(`delete-lesson-${lessonId}`)
  setError(null)
  try {
    await deleteTeacherLesson(lessonId)
    setInfo('Đã xóa bài học.')
    await refreshCourses(selectedCourseId)
  } catch (err) {
    setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
  } finally {
    setAction(null)
  }
}

const handleCreateQuestion = async (lessonId: number, payload: TeacherQuestionRequest) => {
  setAction(`create-question-${lessonId}`)
  setError(null)
  try {
    await createTeacherQuestion(lessonId, payload)
    setInfo('Đã tạo câu hỏi.')
    await refreshCourses(selectedCourseId)
  } catch (err) {
    setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
  } finally {
    setAction(null)
  }
}

const handleUpdateQuestion = async (questionId: number, payload: TeacherQuestionRequest) => {
  setAction(`update-question-${questionId}`)
  setError(null)
  try {
    await updateTeacherQuestion(questionId, payload)
    setInfo('Đã lưu câu hỏi.')
    await refreshCourses(selectedCourseId)
  } catch (err) {
    setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
  } finally {
    setAction(null)
  }
}

const handleDeleteQuestion = async (questionId: number) => {
  if (!window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) return
  setAction(`delete-question-${questionId}`)
  setError(null)
  try {
    await deleteTeacherQuestion(questionId)
    setInfo('Đã xóa câu hỏi.')
    await refreshCourses(selectedCourseId)
  } catch (err) {
    setError(getApiErrorMessage(err, 'Không thể cập nhật nội dung học tập.'))
  } finally {
    setAction(null)
  }
}
```

Rules:

- Confirm delete with Vietnamese messages for topic, lesson, question.
- After each mutation, call `refreshCourses(selectedCourseId)`.
- Do not call or create any media upload/delete/update function.

- [x] **Step 5: Render nested content tree**

For selected course:

- Render `CourseForm` for edit if `canEditContent(course.status)`.
- Render read-only course summary if not editable.
- Render `TopicForm` to add topic if editable.
- For each topic, render its edit form and lessons.
- For each lesson, render its edit form and questions.
- For each lesson, render `QuestionForm` to add question if editable.
- For each existing question, render `QuestionForm` to edit question if editable, plus delete button.

Keep nesting readable using bordered white cards with headings: `Chủ đề`, `Bài học`, `Câu hỏi`.

- [x] **Step 6: Typecheck, lint/build, commit**

Run:

```powershell
node node_modules/typescript/bin/tsc --noEmit
npm.cmd run lint; if ($?) { npm.cmd run build }
```

Expected: typecheck exit 0, ESLint 0 errors, build success.

Commit:

```bash
git add src/pages/teacher/content/TeacherContentPage.tsx
git commit -m "feat: add teacher content management page"
```

---

### Task 7: Wire Route And Navigation

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\App.tsx`
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\lib\auth\routes.ts`
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\pages\teacher\TeacherDashboardPage.tsx`

- [x] **Step 1: Add route**

In `App.tsx`, import:

```ts
import { TeacherContentPage } from './pages/teacher/content/TeacherContentPage'
```

Under TeacherLayout routes add:

```tsx
<Route path="/teacher/content" element={<TeacherContentPage />} />
```

- [x] **Step 2: Add nav item**

In `routes.ts`, update TEACHER nav to:

```ts
case 'TEACHER':
  return [
    { label: 'Dashboard', to: '/teacher' },
    { label: 'Nội dung học tập', to: '/teacher/content' },
    { label: 'Hồ sơ', to: '/teacher/profile' },
  ]
```

- [x] **Step 3: Update dashboard copy**

In `TeacherDashboardPage.tsx`, replace the paragraph text with:

```tsx
Chào mừng {user?.fullName}! Vào mục "Nội dung học tập" để tạo khóa học, chủ đề, bài học và câu hỏi trước khi gửi duyệt.
```

- [x] **Step 4: Verify and commit**

Run:

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```

Expected: ESLint 0 errors, build success.

Commit:

```bash
git add src/App.tsx src/lib/auth/routes.ts src/pages/teacher/TeacherDashboardPage.tsx
git commit -m "feat: add teacher content route and nav item"
```

---

### Task 8: Manual Playwright Verification

**Files:**
- Test: `C:\Users\Admin\AppData\Local\Temp\opencode\test_teacher_content.py`

- [x] **Step 1: Ensure dev stack is running**

Run from `infra` if needed:

```powershell
docker compose -f docker-compose.dev.yml up -d --build
```

Expected services: frontend 5173, backend 8080, Mailpit 8025, PostgreSQL healthy.

- [x] **Step 2: Create Playwright script**

Create `C:\Users\Admin\AppData\Local\Temp\opencode\test_teacher_content.py` that logs in as an existing teacher. If the seed teacher password is unknown, create a teacher through admin UI first using the existing `test_admin_manage.py` pattern and read the temporary password from Mailpit.

The script must verify:

1. Teacher can open `/teacher/content` from nav `Nội dung học tập`.
2. Teacher can create a course.
3. Teacher can create a topic.
4. Teacher can create a lesson with text content and no media upload.
5. Teacher can create a `MULTIPLE_CHOICE` question.
6. Teacher can submit the course and see `Chờ duyệt`.

- [x] **Step 3: Run script**

Run:

```powershell
python test_teacher_content.py
```

Expected: all checks PASS. If selectors need adjustment, update only the temp script. If application behavior fails, fix app code and rerun lint/build before committing fixes.

---

### Task 9: Final Review And Push

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\frontend\docs\superpowers\plans\2026-08-24-teacher-content-ui.md`

- [x] **Step 1: Final verification**

Run:

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```

Expected: ESLint 0 errors, build success.

Run:

```powershell
python test_teacher_content.py
```

Expected: all checks PASS.

- [x] **Step 2: Review diff**

Run:

```bash
git diff origin/main..HEAD --stat
git log --oneline origin/main..HEAD
```

Expected changed files are limited to the spec, this plan, Teacher Content UI/API/types/routing files. No backend/schema changes and no lesson media upload/delete/update implementation.

- [x] **Step 3: Tick plan checkboxes**

Change every task checkbox in this file from `- [x]` to `- [x]`, except the literal checkbox example in the header sentence.

Commit:

```bash
git add docs/superpowers/plans/2026-08-24-teacher-content-ui.md
git commit -m "docs: mark teacher content UI plan complete"
```

- [x] **Step 4: Push branch**

```bash
git push -u origin feature/teacher-content-ui
```

---

## Self-Review Notes

- **Spec coverage:** route/nav, API wrappers, types, one-page UI, inline forms, all backend question types, submit flow, no lesson media operations, lint/build/manual verification are covered by Tasks 1-9.
- **Placeholder scan:** no incomplete placeholder markers are intentionally present. The Playwright script content is specified by behavior because selectors depend on final rendered DOM; the script itself is a temporary verification artifact and not committed.
- **Type consistency:** all API wrapper names use `TeacherCourse`, `TeacherTopic`, `TeacherLesson`, `TeacherQuestion` types defined in Task 1. Route is consistently `/teacher/content`. Nav label is consistently `Nội dung học tập`.
- **YAGNI:** no backend, schema, media upload/delete/update, admin review, student learning UI, quiz attempt, progress or AI features are included.
