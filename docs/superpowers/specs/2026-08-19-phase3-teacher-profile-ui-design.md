# Phase 3 Frontend: Teacher Profile & Password Validation Design

Ngày: 2026-08-19

## Mục Đích

Hoàn thiện các việc còn lại đầu Phase 3 theo plan Kanban:

1. Bổ sung validate client-side cho form đổi mật khẩu: mật khẩu mới không được trùng mật khẩu hiện tại; backend vẫn là lớp kiểm tra cuối cùng.
2. Xây dựng 3 UI: trang hồ sơ giảng viên (tự quản lý), danh sách giảng viên và chi tiết giảng viên cho học viên — dựa trên các API backend đã hoàn thành.

## Bối Cảnh

- Backend đã có:
  - `GET /api/teacher/profile` — trả `TeacherProfileResponse`; tự tạo hồ sơ mặc định trống nếu chưa có.
  - `PUT /api/teacher/profile` — cập nhật `{ bio, expertise, yearsOfExperience, avatarUrl?, introductionVideoUrl? }`; validate `bio` required ≤2000, `expertise` required ≤255, `yearsOfExperience` 0–80, URL ≤1024 (empty → null). Không cho đổi `status`.
  - `GET /api/teachers` — danh sách công khai (STUDENT): `TeacherProfileSummaryResponse` (`teacherId, fullName, email, avatarUrl?, expertise, yearsOfExperience`).
  - `GET /api/teachers/{teacherId}` — chi tiết công khai (STUDENT): `TeacherProfileResponse` đầy đủ; 404 nếu không công khai/hồ sơ chưa hoàn tất.
- `completed` là flag tính toán = `!bio.isBlank() && !expertise.isBlank()`; `status` riêng biệt (ACTIVE/INACTIVE/SUSPENDED) không đổi được qua PUT.
- Frontend chưa có types/API/page nào cho teacher profile; hệ thống validate là validator tự viết (`validators.ts` + `validateForm.ts`); UI dùng Tailwind v4, màu indigo/gray, component `Card/Field/Input/PasswordInput/Button/Alert/Spinner`. Không có icon library.

## Phạm Vi

**Trong phạm vi:**
- Validator mới `notEqualTo` + áp dụng vào `ChangePasswordPage`.
- `Textarea` + `Avatar` components mới.
- Types + `teacherApi.ts` cho 4 endpoint.
- 3 trang UI: Teacher Profile (view+edit inline), Student teacher list, Student teacher detail.
- Cập nhật route + nav (`App.tsx`, `routes.ts`).
- Docs tiến độ.

**Ngoài phạm vi (YAGNI):**
- Không thêm icon library / dependency mới.
- Không cho phép cập nhật avatar/ảnh (backend không có upload; chỉ hiển thị URL nếu có, fallback chữ cái đầu).
- Không làm UI quản lý khóa/mở khóa giảng viên cho Admin (đã có API, để phase sau).
- Không thay đổi backend.

## Kiến Trúc

Tuân theo pattern hiện có (feature-based, validator tự viết, component dùng chung).

```
src/
  lib/validation/validators.ts      → + notEqualTo(referenceKey, message)
  lib/api/types.ts                  → + TeacherProfile, TeacherProfileSummary
  lib/api/teacherApi.ts             → mới (4 hàm)
  components/ui/Textarea.tsx        → mới
  components/ui/Avatar.tsx          → mới
  pages/teacher/TeacherProfilePage.tsx   → mới (view + edit inline)
  pages/student/TeacherListPage.tsx      → mới (grid cards)
  pages/student/TeacherDetailPage.tsx     → mới (chi tiết)
  App.tsx                           → + 3 route
  lib/auth/routes.ts                → + nav items TEACHER ("Hồ sơ"), STUDENT ("Giảng viên")
```

## Chi Tiết Thiết Kế

### 1. Validator `notEqualTo`

`validators.ts` — đối xứng hoàn toàn với `confirmPassword`:

```ts
export function notEqualTo(
  referenceKey: string,
  message = 'Mật khẩu mới không được trùng mật khẩu hiện tại.',
): Validator {
  return (value, values) => (value === values[referenceKey] ? message : null)
}
```

### 2. ChangePasswordPage

Thay đổi duy nhất trong `handleSubmit`:

```ts
newPassword: [passwordPolicy(), notEqualTo('currentPassword')],
```

Backend vẫn là lớp kiểm tra cuối cùng — không đổi gì backend.

### 3. Types (`lib/api/types.ts`)

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

Lưu ý: backend không serialize null fields (`avatarUrl`, `introductionVideoUrl`) → khai optional. `UpdateTeacherProfileRequest` chỉ gửi bio/expertise/yearsOfExperience (không gửi avatar/status).

### 4. API (`lib/api/teacherApi.ts`)

Pattern theo `authApi.ts` (hàm export thuần, dùng `http` từ `client.ts`):

```ts
export async function getTeacherProfile(): Promise<TeacherProfile>
export async function updateTeacherProfile(data: UpdateTeacherProfileRequest): Promise<TeacherProfile>
export async function getTeachers(): Promise<TeacherProfileSummary[]>
export async function getTeacherDetail(teacherId: number): Promise<TeacherProfile>
```

### 5. Components mới

**`Textarea.tsx`** — giống `Input` về style nhưng là textarea:

```tsx
<textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" {...props} />
```

**`Avatar.tsx`** — hiển thị ảnh hoặc chữ cái đầu:

```tsx
interface AvatarProps { name: string; url?: string; size?: 'sm' | 'md' | 'lg' }
```

- `url` có → `<img src={url} className="rounded-full object-cover" />`.
- Không có → div tròn `bg-indigo-600 text-white` chứa 2 chữ cái đầu của `name` (uppercase).
- Size: sm (h-8 w-8 text-sm), md (h-16 w-16 text-xl), lg (h-24 w-24 text-3xl).

### 6. Teacher Profile Page (`/teacher/profile`)

- Load `getTeacherProfile()` khi mount; trạng thái: loading (`Spinner`), error (`Alert`).
- **View mode:**
  - Header card: `Avatar` (lg), fullName (heading), email (muted), badge status (ACTIVE=green "Hoạt động", INACTIVE=gray "Ngừng hoạt động", SUSPENDED=red "Bị khóa"), badge completed ("Hồ sơ công khai" / "Hồ sơ chưa hoàn tất").
  - Body: 3 section — **Giới thiệu** (bio), **Chuyên môn** (expertise), **Kinh nghiệm** ("X năm kinh nghiệm").
  - Nút "Chỉnh sửa" → chuyển edit mode.
- **Edit mode:**
  - Form (pattern CreateTeacherPage): Field+Textarea "Giới thiệu" (maxLength 2000), Field+Input "Chuyên môn" (maxLength 255), Field+Input number "Số năm kinh nghiệm" (min 0, max 80).
  - Validate client-side mirror backend: required bio/expertise, range yearsOfExperience, max lengths; dùng `validateForm` + validators mới (cần thêm validator tương ứng cho bio/expertise — dùng `required` với message override hoặc `fullName`-style; đề xuất dùng `required('Vui lòng nhập giới thiệu.')` và `required('Vui lòng nhập chuyên môn.')`).
  - Lưu → `updateTeacherProfile` → thành công: Alert success + quay về view mode với dữ liệu mới; thất bại: `getApiErrorMessage`.
  - Nút "Hủy" → về view mode, không gửi API.
  - Avatar không nằm trong form (chỉ hiển thị view mode).

### 7. Student Teacher List (`/student/teachers`)

- Load `getTeachers()`; grid `grid gap-6 sm:grid-cols-2 lg:grid-cols-3`.
- Card: `Avatar` (md) + fullName (font-semibold), email (muted, truncate), expertise (text-sm, line-clamp-2), "X năm kinh nghiệm" (text-xs gray).
- Click card → navigate `/student/teachers/:id`.
- Trạng thái: loading, empty ("Chưa có giảng viên nào."), error (Alert).

### 8. Student Teacher Detail (`/student/teachers/:id`)

- Load `getTeacherDetail(id)`; 404 → Alert "Không tìm thấy giảng viên.".
- Header card giống profile view: Avatar (lg), fullName, email, expertise, "X năm kinh nghiệm".
- Body: section **Giới thiệu** (bio đầy đủ).
- Nút "Quay lại danh sách" (navigate `/student/teachers`).

### 9. Route + Nav

`App.tsx`:
- Trong block `RequireRole role="TEACHER"` → `<Route element={<TeacherLayout />}>`: thêm `<Route path="/teacher/profile" element={<TeacherProfilePage />} />`.
- Trong block `RequireRole role="STUDENT"` → `<Route element={<StudentLayout />}>`: thêm `<Route path="/student/teachers" element={<TeacherListPage />} />` và `<Route path="/student/teachers/:id" element={<TeacherDetailPage />} />`.

`routes.ts` — `navItemsFor`:
- TEACHER: `[{ label: 'Dashboard', to: '/teacher' }, { label: 'Hồ sơ', to: '/teacher/profile' }]`.
- STUDENT: `[{ label: 'Trang chủ', to: '/student' }, { label: 'Giảng viên', to: '/student/teachers' }]`.

## Xử Lý Lỗi

- Lỗi API: dùng `getApiErrorMessage(err, fallback)` — hiển thị `Alert`; tiếng Việt.
- Validate form: `validateForm` → field errors dưới từng `Field`.
- 404 detail: hiển thị Alert thân thiện, không crash.
- Loading: `Spinner` với `aria-label="Đang tải"`.

## Testing

Không có unit test frontend (theo thỏa thuận trước) → xác minh bằng:

1. `npm run lint` — sạch, không warning.
2. `npm run build` (`tsc -b && vite build`) — thành công.
3. Test thủ công Playwright trên Docker stack (đang chạy):
   - **notEqualTo:** login admin → `/change-password` → nhập newPassword trùng currentPassword → lỗi hiển thị ngay dưới "Mật khẩu mới", **không có** request API.
   - **Teacher Profile:** admin tạo teacher → login teacher → `/teacher/profile` hiển thị view → chỉnh sửa bio/expertise/years → lưu → xem lại dữ liệu mới; avatar fallback chữ cái đầu.
   - **List:** login student → `/student/teachers` → thấy teacher đã hoàn tất hồ sơ; teacher chưa hoàn tất không xuất hiện.
   - **Detail:** click card → `/student/teachers/:id` hiển thị bio đầy đủ.

## Docs

- Cập nhật `docs/Docs_Capstone/Phase2_UI_Implementation.md` (hoặc thêm mục Phase 3 ghi chú) và plan Kanban `Project_Plan_Trello_Kanban.md` tiến độ Phase 3.

## Commit Liên Quan (dự kiến)

- Frontend: branch mới từ `main` (sau khi merge `fix/add_validation_OTP`) — các commit tương ứng từng task.
- Docs: cập nhật tiến độ sau khi hoàn thành.