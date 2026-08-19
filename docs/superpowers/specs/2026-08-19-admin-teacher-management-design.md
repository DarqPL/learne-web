# Phase 3: Admin Quản Lý Giảng Viên Design

Ngày: 2026-08-19

## Mục Đích

Hoàn thành task còn lại của Phase 3 trong plan Kanban: **"Admin quản lý trạng thái/khóa/mở khóa giảng viên"** — xây dựng màn hình quản lý giảng viên phía Admin (danh sách + khóa/mở khóa), dựa trên các API admin đã hoàn thành.

## Bối Cảnh

- Backend đã có:
  - `POST /api/admin/teachers` — tạo giảng viên (trả `AuthUserResponse`).
  - `POST /api/admin/users/{userId}/lock` — khóa tài khoản; không cho Admin khóa chính mình; thu hồi toàn bộ refresh token.
  - `POST /api/admin/users/{userId}/unlock` — mở khóa tài khoản (mở khóa đặt `locked_at=null`).
  - Toàn bộ `/api/admin/**` yêu cầu role `ADMIN` (`SecurityConfig`).
  - **Chưa có endpoint liệt kê giảng viên cho Admin.** Endpoint public `GET /api/teachers` chỉ dành cho STUDENT, chỉ trả hồ sơ công khai (bỏ qua giảng viên bị khóa/chưa hoàn tất), không có thông tin quản lý.
- Backend entity `User` đã có đủ trường: `locked`, `active`, `createdAt`, `mustChangePassword`; hồ sơ giảng viên nằm ở bảng `teacher_profiles` (`TeacherProfileStatus`: ACTIVE/INACTIVE/SUSPENDED, `completed` = bio+expertise đủ).
- Frontend: chưa có trang quản lý giảng viên Admin; `adminCreateTeacher` hiện nằm trong `authApi.ts`; có sẵn pattern: in-effect async IIFE + cờ `cancelled`, `Alert`, `Spinner`, `Avatar`, badge dạng pill inline (pattern trong `TeacherProfilePage`), bảng chưa có component riêng (dựng Tailwind inline).

## Phạm Vi

**Trong phạm vi:**
- Backend: thêm `GET /api/admin/teachers` trả danh sách giảng viên kèm thông tin quản lý.
- Frontend: `adminApi.ts` (3 hàm), type `AdminTeacher`, trang `AdminTeacherListPage` dạng bảng tại `/admin/teachers`, nav item ADMIN, route.
- Test backend (TDD) + lint/build + test thủ công Playwright.
- Docs tiến độ (Kanban).

**Ngoài phạm vi (YAGNI):**
- Không thêm component Modal/Badge/Table mới — dùng `window.confirm` + pill inline + bảng Tailwind trực tiếp.
- Không làm trang chi tiết giảng viên riêng cho Admin (chỉ danh sách + khóa/mở khóa).
- Không thêm phân trang/tìm kiếm — danh sách nhỏ, trả toàn bộ.
- Không thay đổi 2 endpoint lock/unlock hiện có.
- Không đổi thứ tự sắp xếp ngoài quy ước backend (createdAt tăng dần).

## Kiến Trúc

Tuân theo pattern hiện có của cả hai submodule.

### Backend

**Endpoint mới:** `GET /api/admin/teachers` trong `AdminUserController`.

**DTO response `AdminTeacherResponse`:**
```java
record AdminTeacherResponse(
    Long userId,
    String fullName,
    String email,
    boolean locked,
    boolean mustChangePassword,
    TeacherProfileStatus profileStatus,  // null nếu giảng viên chưa có hồ sơ
    boolean completed                    // false nếu chưa có hồ sơ
)
```

**Triển khai:**
- `UserRepository`: thêm `List<User> findByRoleOrderByCreatedAtAsc(UserRole role)`.
- `AdminUserService`: thêm `listTeachers()` — gọi repository lấy user TEACHER, với mỗi user tìm `TeacherProfile` (theo `userId`); map sang DTO (`profileStatus`/`completed` = null/false nếu chưa có hồ sơ).
- `AdminUserController`: thêm `@GetMapping("/teachers") List<AdminTeacherResponse> listTeachers()`.
- Phân quyền tự động qua `SecurityConfig` (`/api/admin/**` → ADMIN).

### Frontend

**`src/lib/api/types.ts`** — thêm:
```ts
export interface AdminTeacher {
  userId: number
  fullName: string
  email: string
  locked: boolean
  mustChangePassword: boolean
  profileStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | null
  completed: boolean
}
```

**`src/lib/api/adminApi.ts`** (mới):
```ts
adminListTeachers()                  // GET /api/admin/teachers -> AdminTeacher[]
adminLockTeacher(userId)             // POST /api/admin/users/{userId}/lock
adminUnlockTeacher(userId)           // POST /api/admin/users/{userId}/unlock
```

**`src/pages/admin/AdminTeacherListPage.tsx`** (mới):
- Fetch khi mount: in-effect async IIFE + cờ `cancelled` (không vi phạm `react-hooks/set-state-in-effect`).
- State: `teachers: AdminTeacher[] | null`, `error: string | null`, `info: string | null`, `actionUserId: number | null` (khóa/mở khóa đang chạy cho dòng nào).
- Render:
  - `error` → `<h1>` + `Alert` (fallback "Không thể tải danh sách giảng viên.").
  - `teachers === null` → Spinner giữa (`flex justify-center py-16`).
  - rỗng → "Chưa có giảng viên nào."
  - Bảng Tailwind: header `text-left text-xs font-medium uppercase tracking-wide text-gray-500`, hàng `border-b border-gray-200`, hover nhẹ.
- Cột:
  1. **Họ và tên** (`fullName`)
  2. **Email** (`email`)
  3. **Trạng thái tài khoản** — pill:
     - `locked` → "Bị khóa" (red)
     - `mustChangePassword` → "Chưa đổi mật khẩu" (amber)
     - else → "Đang hoạt động" (green)
  4. **Trạng thái hồ sơ** — pill theo `profileStatus` (ACTIVE "Hoạt động"/green, INACTIVE "Ngừng hoạt động"/gray, SUSPENDED "Bị khóa"/red, null "Chưa tạo"/amber)
  5. **Hồ sơ công khai** — pill `completed ? 'Công khai' (green) : 'Chưa hoàn tất' (amber)`
  6. **Thao tác** — nút:
     - `locked` → Button variant `secondary` "Mở khóa"
     - else → Button variant `danger` "Khóa"
     - `loading={actionUserId === userId}`; các nút khác bị disable khi `actionUserId !== null`
- Hành động khóa/mở khóa: `window.confirm` tiếng Việt → gọi API → thành công: set `info` ("Đã khóa/mở khóa tài khoản...") + reload danh sách; thất bại: `Alert` với `getApiErrorMessage`.
- Không gọi `load()` tách rời (in-effect fetch theo convention list page); sau mutation reload bằng cách gọi lại hàm fetch inline.

**`src/App.tsx`** — thêm route bên trong khối `RequireRole role="ADMIN"`:
```tsx
<Route path="/admin/teachers" element={<AdminTeacherListPage />} />
```

**`src/lib/auth/routes.ts`** — ADMIN thêm:
```ts
{ label: 'Quản lý giảng viên', to: '/admin/teachers' }
```

## Luồng Dữ Liệu

1. Admin mở `/admin/teachers` → `adminListTeachers()` → render bảng.
2. Bấm "Khóa" → `window.confirm('Bạn có chắc muốn khóa tài khoản ... ?')` → `adminLockTeacher(userId)` → refresh danh sách + `info` Alert.
3. Bấm "Mở khóa" → tương tự với `adminUnlockTeacher(userId)`.

## Xử Lý Lỗi

- Fetch lỗi → `Alert` page-level, không có nút retry (theo convention list page).
- Khóa/mở khóa lỗi → `Alert` hiển thị message từ `getApiErrorMessage`.
- `401` → interceptor tự refresh; nếu refresh fail thì đưa về login (cơ chế có sẵn).

## Kiểm Thử

**Backend (TDD):**
- Thêm `AdminTeacherApiTests` (hoặc mở rộng `AdminUserApiTests`):
  - 401 khi chưa đăng nhập, 403 khi không phải ADMIN.
  - Trả đúng danh sách TEACHER (không gồm STUDENT/ADMIN), sắp theo createdAt.
  - Trường đúng: `userId`, `fullName`, `email`, `locked`, `mustChangePassword`, `profileStatus`, `completed`.
  - Giảng viên chưa có hồ sơ → `profileStatus=null`, `completed=false`.
- `.\mvnw.cmd test -Dtest=AdminUserApiTests` rồi `.\mvnw.cmd test`.

**Frontend:**
- `npm run lint` (0 lỗi), `npm run build`.
- Test thủ công Playwright trên Docker Compose dev:
  - Tạo 2 giảng viên → bảng hiển thị đúng 2 dòng, badge phù hợp.
  - Khóa 1 giảng viên → badge "Bị khóa"; giảng viên đó biến mất khỏi danh sách học viên (`/student/teachers`).
  - Mở khóa → badge trở lại "Đang hoạt động"; xuất hiện lại ở học viên.

**Docs:**
- Cập nhật `Project_Plan_Trello_Kanban.md` (đánh dấu task Admin quản lý giảng viên), ghi chú UI vào `Phase2_UI_Implementation.md` nếu cần.