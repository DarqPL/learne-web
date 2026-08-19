# Phase 3 Frontend: Teacher Profile & Password Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bổ sung validate client-side cho form đổi mật khẩu (mật khẩu mới không trùng mật khẩu hiện tại) và xây dựng 3 UI Phase 3: hồ sơ giảng viên, danh sách giảng viên và chi tiết giảng viên cho học viên.

**Architecture:** Tuân theo pattern hiện có — validator tự viết (`validators.ts` + `validateForm.ts`), API dạng hàm thuần trong `lib/api`, component UI dùng chung, page theo feature. Không thêm dependency mới.

**Tech Stack:** React 19, Vite 8, TypeScript ~6.0, Tailwind v4, axios. Backend Spring Boot đã có sẵn 4 endpoint teacher profile.

---

## File Structure

**Files created:**
- `src/lib/api/teacherApi.ts` — 4 hàm gọi endpoint teacher profile
- `src/components/ui/Textarea.tsx` — textarea theo style Input
- `src/components/ui/Avatar.tsx` — hiển thị ảnh hoặc chữ cái đầu
- `src/pages/teacher/TeacherProfilePage.tsx` — hồ sơ giảng viên (view + edit inline)
- `src/pages/student/TeacherListPage.tsx` — danh sách giảng viên (grid cards)
- `src/pages/student/TeacherDetailPage.tsx` — chi tiết giảng viên

**Files modified:**
- `src/lib/validation/validators.ts` — thêm `notEqualTo`, `maxLength`, `numberRange`
- `src/lib/api/types.ts` — thêm `TeacherProfile`, `TeacherProfileSummary`, `UpdateTeacherProfileRequest`
- `src/pages/auth/ChangePasswordPage.tsx` — thêm `notEqualTo('currentPassword')` vào rule newPassword
- `src/App.tsx` — thêm 3 route
- `src/lib/auth/routes.ts` — thêm nav items

**Docs:**
- `docs/Docs_Capstone/Project_Plan_Trello_Kanban.md` — cập nhật tiến độ Phase 3 (submodule docs)
- `docs/Docs_Capstone/Phase2_UI_Implementation.md` — thêm ghi chú Phase 3 UI (submodule docs)

---

### Task 1: Thêm validators mới

**Files:**
- Modify: `src/lib/validation/validators.ts`

- [ ] **Step 1: Thêm 3 validator vào cuối file**

Thêm vào cuối `src/lib/validation/validators.ts`:

```ts
export function notEqualTo(
  referenceKey: string,
  message = 'Mật khẩu mới không được trùng mật khẩu hiện tại.',
): Validator {
  return (value, values) => (value === values[referenceKey] ? message : null)
}

export function maxLength(max: number, message: string): Validator {
  return (value) => (value.length > max ? message : null)
}

export function numberRange(
  min: number,
  max: number,
  message = `Giá trị phải từ ${min} đến ${max}.`,
): Validator {
  return (value) => {
    if (value.trim() === '') return null
    const n = Number(value)
    return Number.isFinite(n) && n >= min && n <= max ? null : message
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: pass (tsc + vite), không lỗi.

- [ ] **Step 3: Commit**

```bash
git add src/lib/validation/validators.ts
git commit -m "feat: add notEqualTo, maxLength and numberRange validators"
```

---

### Task 2: Áp dụng notEqualTo vào ChangePasswordPage

**Files:**
- Modify: `src/pages/auth/ChangePasswordPage.tsx:12` (import) và `:33` (rule)

- [ ] **Step 1: Cập nhật import**

Trong `src/pages/auth/ChangePasswordPage.tsx`, dòng 12 hiện tại:

```ts
import { confirmPassword, passwordPolicy, required } from '../../lib/validation/validators'
```

Đổi thành:

```ts
import { confirmPassword, notEqualTo, passwordPolicy, required } from '../../lib/validation/validators'
```

- [ ] **Step 2: Cập nhật rule newPassword**

Dòng 32, rule hiện tại:

```ts
        newPassword: [passwordPolicy()],
```

Đổi thành:

```ts
        newPassword: [passwordPolicy(), notEqualTo('currentPassword')],
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: pass, không lỗi.

- [ ] **Step 4: Commit**

```bash
git add src/pages/auth/ChangePasswordPage.tsx
git commit -m "feat: prevent new password equal to current password in change password form"
```

---

### Task 3: Thêm types teacher profile

**Files:**
- Modify: `src/lib/api/types.ts`

- [ ] **Step 1: Thêm types vào cuối file**

Thêm vào cuối `src/lib/api/types.ts`:

```ts
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
```

Lưu ý: `avatarUrl`/`introductionVideoUrl` optional vì backend không serialize null fields.

- [ ] **Step 2: Commit**

```bash
git add src/lib/api/types.ts
git commit -m "feat: add teacher profile types"
```

---

### Task 4: Tạo teacherApi.ts

**Files:**
- Create: `src/lib/api/teacherApi.ts`

- [ ] **Step 1: Tạo file**

Tạo `src/lib/api/teacherApi.ts`:

```ts
import { http } from './client'
import type { TeacherProfile, TeacherProfileSummary, UpdateTeacherProfileRequest } from './types'

export function getTeacherProfile() {
  return http.get<TeacherProfile>('/api/teacher/profile')
}

export function updateTeacherProfile(payload: UpdateTeacherProfileRequest) {
  return http.put<TeacherProfile>('/api/teacher/profile', payload)
}

export function getTeachers() {
  return http.get<TeacherProfileSummary[]>('/api/teachers')
}

export function getTeacherDetail(teacherId: number) {
  return http.get<TeacherProfile>(`/api/teachers/${teacherId}`)
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: pass, không lỗi.

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/teacherApi.ts
git commit -m "feat: add teacher profile api functions"
```

---

### Task 5: Tạo Textarea component

**Files:**
- Create: `src/components/ui/Textarea.tsx`

- [ ] **Step 1: Tạo file**

Tạo `src/components/ui/Textarea.tsx` (theo pattern `Input.tsx`, chỉ thêm `rows` mặc định):

```tsx
import type { TextareaHTMLAttributes } from 'react'

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${className ?? ''}`}
      {...props}
    />
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: pass, không lỗi.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Textarea.tsx
git commit -m "feat: add textarea component"
```

---

### Task 6: Tạo Avatar component

**Files:**
- Create: `src/components/ui/Avatar.tsx`

- [ ] **Step 1: Tạo file**

Tạo `src/components/ui/Avatar.tsx`:

```tsx
interface AvatarProps {
  name: string
  url?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-16 w-16 text-xl',
  lg: 'h-24 w-24 text-3xl',
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
}

export function Avatar({ name, url, size = 'md' }: AvatarProps) {
  const base = `${sizes[size]} shrink-0 rounded-full object-cover`
  if (url) {
    return <img src={url} alt={name} className={base} />
  }
  return (
    <span
      aria-hidden="true"
      className={`${base} flex items-center justify-center bg-indigo-600 font-semibold text-white`}
    >
      {initials(name)}
    </span>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: pass, không lỗi.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Avatar.tsx
git commit -m "feat: add avatar component with initials fallback"
```

---

### Task 7: Tạo TeacherProfilePage

**Files:**
- Create: `src/pages/teacher/TeacherProfilePage.tsx`

- [ ] **Step 1: Tạo file**

Tạo `src/pages/teacher/TeacherProfilePage.tsx`:

```tsx
import { useState, type FormEvent } from 'react'
import { getApiErrorMessage } from '../../lib/api/client'
import { getTeacherProfile, updateTeacherProfile } from '../../lib/api/teacherApi'
import type { TeacherProfile } from '../../lib/api/types'
import { Alert } from '../../components/ui/Alert'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { Textarea } from '../../components/ui/Textarea'
import { validateForm } from '../../lib/validation/validateForm'
import { maxLength, numberRange, required } from '../../lib/validation/validators'

const statusLabels: Record<TeacherProfile['status'], string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Ngừng hoạt động',
  SUSPENDED: 'Bị khóa',
}

const statusStyles: Record<TeacherProfile['status'], string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-700',
  SUSPENDED: 'bg-red-100 text-red-700',
}

export function TeacherProfilePage() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [expertise, setExpertise] = useState('')
  const [yearsOfExperience, setYearsOfExperience] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const response = await getTeacherProfile()
      setProfile(response.data)
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Không thể tải hồ sơ giảng viên.'))
    } finally {
      setLoading(false)
    }
  }

  const startEdit = () => {
    if (!profile) return
    setBio(profile.bio)
    setExpertise(profile.expertise)
    setYearsOfExperience(String(profile.yearsOfExperience))
    setFieldErrors({})
    setError(null)
    setSuccess(null)
    setEditing(true)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const errors = validateForm(
      { bio, expertise, yearsOfExperience },
      {
        bio: [required('Vui lòng nhập giới thiệu.'), maxLength(2000, 'Giới thiệu tối đa 2000 ký tự.')],
        expertise: [required('Vui lòng nhập chuyên môn.'), maxLength(255, 'Chuyên môn tối đa 255 ký tự.')],
        yearsOfExperience: [required(), numberRange(0, 80)],
      },
    )
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setError(null)
    setSubmitting(true)
    try {
      const response = await updateTeacherProfile({
        bio,
        expertise,
        yearsOfExperience: Number(yearsOfExperience),
      })
      setProfile(response.data)
      setEditing(false)
      setSuccess('Hồ sơ đã được lưu.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể lưu hồ sơ.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  if (loadError || !profile) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Hồ sơ giảng viên</h1>
        <Alert>{loadError ?? 'Không thể tải hồ sơ giảng viên.'}</Alert>
        <div className="mt-4">
          <Button variant="secondary" onClick={load}>
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Chỉnh sửa hồ sơ</h1>
        {error ? (
          <div className="mb-4">
            <Alert>{error}</Alert>
          </div>
        ) : null}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <Field label="Giới thiệu" error={fieldErrors.bio}>
            <Textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={2000} rows={5} required />
          </Field>
          <Field label="Chuyên môn" error={fieldErrors.expertise}>
            <Input
              value={expertise}
              onChange={(event) => setExpertise(event.target.value)}
              maxLength={255}
              required
              placeholder="Ví dụ: Giao tiếp, Ngữ pháp, IELTS"
            />
          </Field>
          <Field label="Số năm kinh nghiệm" error={fieldErrors.yearsOfExperience}>
            <Input
              type="number"
              min={0}
              max={80}
              value={yearsOfExperience}
              onChange={(event) => setYearsOfExperience(event.target.value)}
              required
              placeholder="0"
            />
          </Field>
          <div className="flex gap-3">
            <Button type="submit" loading={submitting}>
              Lưu hồ sơ
            </Button>
            <Button type="button" variant="secondary" disabled={submitting} onClick={() => setEditing(false)}>
              Hủy
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Hồ sơ giảng viên</h1>
      {success ? (
        <div className="mb-4">
          <Alert variant="success">{success}</Alert>
        </div>
      ) : null}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-6 border-b border-gray-200 p-6">
          <Avatar name={profile.fullName} url={profile.avatarUrl} size="lg" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile.fullName}</h2>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <div className="mt-2 flex gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[profile.status]}`}>
                {statusLabels[profile.status]}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  profile.completed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {profile.completed ? 'Hồ sơ công khai' : 'Hồ sơ chưa hoàn tất'}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-6 p-6">
          <section>
            <h3 className="mb-1 text-sm font-semibold text-gray-900">Giới thiệu</h3>
            <p className="whitespace-pre-wrap text-sm text-gray-700">{profile.bio || 'Chưa cập nhật.'}</p>
          </section>
          <section>
            <h3 className="mb-1 text-sm font-semibold text-gray-900">Chuyên môn</h3>
            <p className="text-sm text-gray-700">{profile.expertise || 'Chưa cập nhật.'}</p>
          </section>
          <section>
            <h3 className="mb-1 text-sm font-semibold text-gray-900">Kinh nghiệm</h3>
            <p className="text-sm text-gray-700">{profile.yearsOfExperience} năm kinh nghiệm</p>
          </section>
        </div>
        <div className="border-t border-gray-200 p-6">
          <Button onClick={startEdit}>Chỉnh sửa</Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: pass, không lỗi.

- [ ] **Step 3: Commit**

```bash
git add src/pages/teacher/TeacherProfilePage.tsx
git commit -m "feat: add teacher profile page with view and edit modes"
```

---

### Task 8: Tạo TeacherListPage

**Files:**
- Create: `src/pages/student/TeacherListPage.tsx`

- [ ] **Step 1: Tạo file**

Tạo `src/pages/student/TeacherListPage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../lib/api/client'
import { getTeachers } from '../../lib/api/teacherApi'
import type { TeacherProfileSummary } from '../../lib/api/types'
import { Alert } from '../../components/ui/Alert'
import { Avatar } from '../../components/ui/Avatar'
import { Spinner } from '../../components/ui/Spinner'

export function TeacherListPage() {
  const navigate = useNavigate()
  const [teachers, setTeachers] = useState<TeacherProfileSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    setTeachers(null)
    try {
      const response = await getTeachers()
      setTeachers(response.data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải danh sách giảng viên.'))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Đội ngũ giảng viên</h1>
      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}
      {teachers === null ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : teachers.length === 0 ? (
        <p className="text-gray-600">Chưa có giảng viên nào.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map((teacher) => (
            <button
              key={teacher.teacherId}
              type="button"
              onClick={() => navigate(`/student/teachers/${teacher.teacherId}`)}
              className="rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-colors hover:border-indigo-200 hover:shadow"
            >
              <div className="flex items-center gap-4">
                <Avatar name={teacher.fullName} url={teacher.avatarUrl} size="md" />
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-gray-900">{teacher.fullName}</h2>
                  <p className="truncate text-sm text-gray-500">{teacher.email}</p>
                </div>
              </div>
              <p className="mt-4 line-clamp-2 text-sm text-gray-700">{teacher.expertise}</p>
              <p className="mt-2 text-xs text-gray-500">{teacher.yearsOfExperience} năm kinh nghiệm</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: pass, không lỗi.

- [ ] **Step 3: Commit**

```bash
git add src/pages/student/TeacherListPage.tsx
git commit -m "feat: add student teacher list page"
```

---

### Task 9: Tạo TeacherDetailPage

**Files:**
- Create: `src/pages/student/TeacherDetailPage.tsx`

- [ ] **Step 1: Tạo file**

Tạo `src/pages/student/TeacherDetailPage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../lib/api/client'
import { getTeacherDetail } from '../../lib/api/teacherApi'
import type { TeacherProfile } from '../../lib/api/types'
import { Alert } from '../../components/ui/Alert'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'

export function TeacherDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const teacherId = Number(id)
    if (!Number.isInteger(teacherId)) {
      setError('Không tìm thấy giảng viên.')
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const response = await getTeacherDetail(teacherId)
        if (!cancelled) setProfile(response.data)
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không tìm thấy giảng viên.'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (error) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Chi tiết giảng viên</h1>
        <Alert>{error}</Alert>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => navigate('/student/teachers')}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <Button variant="secondary" onClick={() => navigate('/student/teachers')}>
          Quay lại danh sách
        </Button>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-6 border-b border-gray-200 p-6">
          <Avatar name={profile.fullName} url={profile.avatarUrl} size="lg" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">{profile.fullName}</h1>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <p className="mt-1 text-sm text-gray-700">{profile.expertise}</p>
          </div>
        </div>
        <div className="space-y-6 p-6">
          <section>
            <h2 className="mb-1 text-sm font-semibold text-gray-900">Giới thiệu</h2>
            <p className="whitespace-pre-wrap text-sm text-gray-700">{profile.bio}</p>
          </section>
          <section>
            <h2 className="mb-1 text-sm font-semibold text-gray-900">Kinh nghiệm</h2>
            <p className="text-sm text-gray-700">{profile.yearsOfExperience} năm kinh nghiệm</p>
          </section>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: pass, không lỗi.

- [ ] **Step 3: Commit**

```bash
git add src/pages/student/TeacherDetailPage.tsx
git commit -m "feat: add student teacher detail page"
```

---

### Task 10: Thêm routes và nav

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/lib/auth/routes.ts`

- [ ] **Step 1: Cập nhật imports trong App.tsx**

Trong `src/App.tsx`, thêm imports sau dòng 14 (`CreateTeacherPage` import):

```ts
import { TeacherProfilePage } from './pages/teacher/TeacherProfilePage'
import { TeacherListPage } from './pages/student/TeacherListPage'
import { TeacherDetailPage } from './pages/student/TeacherDetailPage'
```

- [ ] **Step 2: Thêm route Teacher profile**

Trong `src/App.tsx`, block TeacherLayout (dòng 38-42), sau dòng 40 (`/teacher` route):

```tsx
          <Route element={<RequireRole role="TEACHER" />}>
            <Route element={<TeacherLayout />}>
              <Route path="/teacher" element={<TeacherDashboardPage />} />
              <Route path="/teacher/profile" element={<TeacherProfilePage />} />
            </Route>
          </Route>
```

- [ ] **Step 3: Thêm route Student list + detail**

Trong `src/App.tsx`, block StudentLayout (dòng 33-37), sau dòng 35 (`/student` route):

```tsx
          <Route element={<RequireRole role="STUDENT" />}>
            <Route element={<StudentLayout />}>
              <Route path="/student" element={<StudentDashboardPage />} />
              <Route path="/student/teachers" element={<TeacherListPage />} />
              <Route path="/student/teachers/:id" element={<TeacherDetailPage />} />
            </Route>
          </Route>
```

- [ ] **Step 4: Cập nhật navItemsFor trong routes.ts**

Trong `src/lib/auth/routes.ts`, sửa `navItemsFor`:

```ts
export function navItemsFor(role: UserRole): NavItem[] {
  switch (role) {
    case 'STUDENT':
      return [
        { label: 'Trang chủ', to: '/student' },
        { label: 'Giảng viên', to: '/student/teachers' },
      ]
    case 'TEACHER':
      return [
        { label: 'Dashboard', to: '/teacher' },
        { label: 'Hồ sơ', to: '/teacher/profile' },
      ]
    case 'ADMIN':
      return [
        { label: 'Dashboard', to: '/admin' },
        { label: 'Tạo giảng viên', to: '/admin/teachers/new' },
      ]
  }
}
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: pass, không lỗi.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/lib/auth/routes.ts
git commit -m "feat: add teacher profile and teacher list routes with nav"
```

---

### Task 11: Verify toàn project + test thủ công

**Files:** không có (chạy lệnh)

- [ ] **Step 1: Chạy lint + build toàn project**

Run: `npm run lint && npm run build`
Expected: cả hai pass, không lỗi.

- [ ] **Step 2: Test thủ công bằng Playwright (Docker stack đang chạy)**

Chạy script kiểm tra ở `C:\Users\Admin\AppData\Local\Temp\opencode\test_phase3.py` (tạo mới, xem mô tả dưới). Cần stack Docker dev đang chạy (frontend :5173, backend :8080).

Script kiểm tra:

1. **notEqualTo:** login admin → `/change-password` → nhập newPassword = currentPassword (`Admin123`) → submit → lỗi "Mật khẩu mới không được trùng mật khẩu hiện tại." hiển thị dưới "Mật khẩu mới", **không có** request tới `/api/auth/change-password`.
2. **Teacher Profile:** admin tạo teacher mới (email `gv_profile@test.local`) → login teacher → `/teacher/profile` hiển thị view (avatar fallback chữ cái đầu) → chỉnh sửa bio/expertise/years → lưu → view mode hiển thị dữ liệu mới + badge "Hồ sơ công khai".
3. **List:** login student → `/student/teachers` → thấy teacher `gv_profile@test.local` (đã hoàn tất).
4. **Detail:** click card → `/student/teachers/:id` hiển thị bio đầy đủ.

Script Playwright mẫu (tạo tại `C:\Users\Admin\AppData\Local\Temp\opencode\test_phase3.py`):

```python
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:5173'
RESULTS = []

def check(name, cond, detail=''):
    RESULTS.append((name, bool(cond), detail))
    print(('PASS' if cond else 'FAIL'), '-', name, ('' if cond else f' [{detail}]'))

def field(page, label):
    return page.locator(f'label:has(> span:text-is("{label}"))').locator('input')

def errors_under(page, label):
    return page.locator(f'label:has(> span:text-is("{label}"))').locator('span.text-red-600').all_text_contents()

def fill_submit(page, values, submit_text):
    for label, val in values.items():
        if val is None:
            continue
        el = field(page, label)
        el.fill('')
        el.fill(val)
    page.locator('button', has_text=submit_text).click()

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # ===== 1. notEqualTo =====
    ctx = browser.new_context()
    page = ctx.new_page()
    api_calls = []
    page.on('request', lambda r: api_calls.append(r.url) if '/api/' in r.url else None)
    page.goto(BASE + '/login'); page.wait_for_load_state('networkidle')
    fill_submit(page, {'Email': 'admin@learne.local', 'Mật khẩu': 'Admin123'}, 'Đăng nhập')
    page.wait_for_url('**/admin*', timeout=8000)
    page.goto(BASE + '/change-password'); page.wait_for_load_state('networkidle')
    page.evaluate("document.querySelectorAll('form').forEach(f => f.noValidate = true)")
    fill_submit(page, {
        'Mật khẩu hiện tại': 'Admin123', 'Mật khẩu mới': 'Admin123',
        'Xác nhận mật khẩu mới': 'Admin123'}, 'Cập nhật mật khẩu')
    page.wait_for_timeout(300)
    check('1a. notEqualTo error shown', errors_under(page, 'Mật khẩu mới') == ['Mật khẩu mới không được trùng mật khẩu hiện tại.'], str(errors_under(page, 'Mật khẩu mới')))
    check('1b. no API call', all('/change-password' not in c for c in api_calls), str(api_calls))
    ctx.close()

    # ===== 2. Teacher profile (create via API, login, edit) =====
    import requests
    # admin login to get token
    r = requests.post('http://localhost:8080/api/auth/login', json={'email': 'admin@learne.local', 'password': 'Admin123'})
    token = r.json()['accessToken']
    requests.post('http://localhost:8080/api/admin/teachers', json={'email': 'gv_profile@test.local', 'fullName': 'Giang Vien Profile'},
                  headers={'Authorization': f'Bearer {token}'})

    ctx = browser.new_context()
    page = ctx.new_page()
    page.goto(BASE + '/login'); page.wait_for_load_state('networkidle')
    page.evaluate("document.querySelectorAll('form').forEach(f => f.noValidate = true)")
    # teacher created with mustChangePassword=true -> login -> forced change password
    r2 = requests.post('http://localhost:8080/api/auth/login', json={'email': 'gv_profile@test.local', 'password': 'TempPass123'})
    # read temp password from mailpit
    mail = requests.get('http://localhost:8025/api/v1/messages').json()
    import re
    text = mail['messages'][0]['Text'] if mail['messages'] else ''
    m = re.search(r'[A-Za-z][A-Za-z0-9]*[0-9][A-Za-z0-9]*|[0-9][A-Za-z0-9]*[A-Za-z][A-Za-z0-9]*', text)
    temp_pw = m.group(0) if m else 'TempPass123'
    fill_submit(page, {'Email': 'gv_profile@test.local', 'Mật khẩu': temp_pw}, 'Đăng nhập')
    page.wait_for_url('**/change-password*', timeout=8000)
    page.evaluate("document.querySelectorAll('form').forEach(f => f.noValidate = true)")
    fill_submit(page, {
        'Mật khẩu hiện tại': temp_pw, 'Mật khẩu mới': 'NewPass123',
        'Xác nhận mật khẩu mới': 'NewPass123'}, 'Đổi mật khẩu')
    page.wait_for_url('**/login*', timeout=8000)
    fill_submit(page, {'Email': 'gv_profile@test.local', 'Mật khẩu': 'NewPass123'}, 'Đăng nhập')
    page.wait_for_url('**/teacher*', timeout=8000)
    page.goto(BASE + '/teacher/profile'); page.wait_for_load_state('networkidle')
    page.wait_for_selector('text=Hồ sơ giảng viên', timeout=8000)
    check('2a. profile view loads', page.locator('text=Hồ sơ chưa hoàn tất').count() > 0, '')
    page.locator('button', has_text='Chỉnh sửa').click()
    page.wait_for_timeout(300)
    page.locator('textarea').fill('Giao vien tieng Anh giao tiep, 10 nam kinh nghiem')
    page.locator('input').nth(0).fill('Giao tiep, IELTS')
    page.locator('input').nth(1).fill('10')
    page.locator('button', has_text='Lưu hồ sơ').click()
    page.wait_for_selector('text=Hồ sơ đã được lưu.', timeout=8000)
    check('2b. profile saved', page.locator('text=Hồ sơ công khai').count() > 0, '')
    check('2c. saved bio shown', page.locator('text=Giao vien tieng Anh giao tiep').count() > 0, '')
    ctx.close()

    # ===== 3. Student list + detail =====
    ctx = browser.new_context()
    page = ctx.new_page()
    page.goto(BASE + '/login'); page.wait_for_load_state('networkidle')
    page.evaluate("document.querySelectorAll('form').forEach(f => f.noValidate = true)")
    # register a student
    page.goto(BASE + '/register'); page.wait_for_load_state('networkidle')
    page.evaluate("document.querySelectorAll('form').forEach(f => f.noValidate = true)")
    fill_submit(page, {'Họ và tên': 'Hoc Vien', 'Email': 'sv_phase3@test.local',
                       'Mật khẩu': 'Student123', 'Xác nhận mật khẩu': 'Student123'}, 'Tiếp tục')
    otp_el = page.locator('label:has(> span:text-is("Mã OTP (6 chữ số)"))').locator('input')
    try:
        otp_el.wait_for(state='visible', timeout=5000)
    except Exception:
        pass
    if otp_el.count() > 0:
        mail = requests.get('http://localhost:8025/api/v1/messages').json()
        text = mail['messages'][0]['Text'] if mail['messages'] else ''
        m = re.search(r'\b\d{6}\b', text)
        otp = m.group(0) if m else '000000'
        otp_el.fill(otp)
        page.evaluate("document.querySelectorAll('form').forEach(f => f.noValidate = true)")
        page.locator('button', has_text='Xác nhận').click()
        page.wait_for_url('**/login*', timeout=8000)
    fill_submit(page, {'Email': 'sv_phase3@test.local', 'Mật khẩu': 'Student123'}, 'Đăng nhập')
    page.wait_for_url('**/student*', timeout=8000)
    page.goto(BASE + '/student/teachers'); page.wait_for_load_state('networkidle')
    page.wait_for_selector('text=Đội ngũ giảng viên', timeout=8000)
    check('3a. teacher in list', page.locator('text=Giang Vien Profile').count() > 0, '')
    page.locator('text=Giang Vien Profile').first.click()
    page.wait_for_url('**/student/teachers/*', timeout=8000)
    page.wait_for_selector('text=Giao vien tieng Anh giao tiep', timeout=8000)
    check('3b. detail bio shown', True, '')
    ctx.close()

    browser.close()

passed = sum(1 for _, ok, _ in RESULTS if ok)
print(f'\n===== {passed}/{len(RESULTS)} PASSED =====')
```

Lưu ý: script dùng thư viện `requests` của Python — kiểm tra cài đặt: `python -c "import requests"`. Nếu chưa có, chạy `pip install requests` trước.

- [ ] **Step 3: Cập nhật docs tiến độ**

Trong submodule docs (`C:\baobao\KLTN\learne-platform\docs`), cập nhật file `Docs_Capstone/Project_Plan_Trello_Kanban.md`:

- Vào mục `### Cập Nhật Tiến Độ Phase 3` (đầu file), thêm các mục vào `#### Đã Hoàn Thành`:
  - Đã bổ sung validate client-side cho form đổi mật khẩu: mật khẩu mới không được trùng mật khẩu hiện tại; backend vẫn là lớp kiểm tra cuối cùng.
  - Đã xây dựng UI hồ sơ giảng viên tại `/teacher/profile` với chế độ xem và chỉnh sửa inline, badge trạng thái và trạng thái hồ sơ công khai, avatar hiển thị URL hoặc chữ cái đầu.
  - Đã xây dựng UI danh sách giảng viên tại `/student/teachers` (grid card) và chi tiết giảng viên tại `/student/teachers/:id` dựa trên API `GET /api/teachers` và `GET /api/teachers/{teacherId}`.
- Trong `#### Đang Làm Tiếp Theo`, bỏ mục "Hoàn thiện nốt validate client-side cho form đổi mật khẩu..." và cập nhật mục UI còn lại.

- [ ] **Step 4: Commit docs**

```bash
cd C:/baobao/KLTN/learne-platform/docs
git add Docs_Capstone/Project_Plan_Trello_Kanban.md Docs_Capstone/Phase2_UI_Implementation.md
git commit -m "docs: update phase 3 teacher profile UI progress"
```

- [ ] **Step 5: Commit plan tick trong frontend**

```bash
cd C:/baobao/KLTN/learne-platform/frontend
git add docs/superpowers/plans/2026-08-19-phase3-teacher-profile-ui.md
git commit -m "docs: mark phase 3 plan tasks complete"
```

---

## Kiểm Tra Spec Coverage

| Yêu cầu spec | Task |
| --- | --- |
| `notEqualTo` validator + áp dụng ChangePasswordPage | Task 1, 2 |
| `maxLength`, `numberRange` validators | Task 1 |
| Types: TeacherProfile, TeacherProfileSummary, UpdateTeacherProfileRequest | Task 3 |
| teacherApi.ts (4 hàm) | Task 4 |
| Textarea component | Task 5 |
| Avatar component (URL hoặc initials) | Task 6 |
| TeacherProfilePage (view + edit inline) | Task 7 |
| TeacherListPage (grid cards) | Task 8 |
| TeacherDetailPage (chi tiết + 404) | Task 9 |
| Routes + nav (App.tsx, routes.ts) | Task 10 |
| Lint/build + test thủ công + docs | Task 11 |
| Không thêm dependency, backend không đổi | Tất cả |