# Thiết kế: Admin Dashboard Sidebar — Quản lý giảng viên trong Dashboard

## Mục tiêu

Gỡ bỏ navigation ADMIN trên header (hiện có "Dashboard", "Tạo giảng viên", "Quản lý giảng viên") — header admin chỉ còn logo + thông tin người dùng. Bên trong dashboard có **sidebar dọc full-height bên trái** điều hướng 2 khu vực: **"Tổng quan"** và **"Quản lý giảng viên"** (gồm danh sách + form tạo tài khoản giảng viên).

## Phạm vi

- Chỉ thay đổi frontend (submodule `frontend`), không đổi backend, không đổi schema.
- Giữ nguyên toàn bộ route hiện tại: `/admin`, `/admin/teachers`, `/admin/teachers/new`.
- Giữ nguyên component `AdminTeacherListPage` và `CreateTeacherPage` (chỉ thêm nút điều hướng).

## Kiến trúc / Thành phần

### 1. Component mới `AdminSidebar` (`frontend/src/layouts/AdminSidebar.tsx`)

- Sidebar dọc full-height bên trái, dùng `NavLink` để đồng bộ trạng thái active với URL.
- 2 tab:
  - **"Tổng quan"** → `to="/admin"`, dùng prop `end` (chỉ active khi URL chính xác `/admin`).
  - **"Quản lý giảng viên"** → `to="/admin/teachers"`, active cho cả `/admin/teachers` và `/admin/teachers/new` (khi đang tạo GV tab vẫn sáng).
- Style: `aside` có `border-r`, chiều rộng cố định (vd `w-56`), full-height (`sticky top-16 h-[calc(100vh-4rem)]` để đè lên vùng nội dung bên phải). Mỗi tab `rounded-lg px-3 py-2 text-sm font-medium`, active: `bg-indigo-50 text-indigo-700`, inactive: `text-gray-600 hover:bg-gray-100 hover:text-gray-900` — đồng bộ style với nav hiện tại trong `AppShell.tsx`.

### 2. `AdminLayout.tsx` — đặt sidebar cạnh `<Outlet />`

```tsx
<AppShell>
  <div className="flex gap-8">
    <AdminSidebar />
    <div className="min-w-0 flex-1">
      <Outlet />
    </div>
  </div>
</AppShell>
```

### 3. `routes.ts` — gỡ hẳn nav ADMIN

Mục `ADMIN` trong `navItemsFor` trả về mảng rỗng:
```ts
case 'ADMIN':
  return []
```

Header admin chỉ còn logo + thông tin người dùng + nút đăng xuất (logic `AppShell.tsx` giữ nguyên, tự render mảng rỗng).

### 4. `AdminTeacherListPage.tsx` — thêm nút "Tạo giảng viên"

- Thay thế 2 chỗ `<h1>` hiện có (nhánh error trả về sớm và nhánh trả về chính) bằng một header dùng chung: tiêu đề "Quản lý giảng viên" bên trái, nút **"Tạo giảng viên"** (variant `primary`) bên phải.
- Header xuất hiện ở **cả** trạng thái error lẫn trạng thái bình thường (nút vẫn có thể bấm khi list lỗi — vẫn điều hướng sang form tạo được).
- Bấm nút → `useNavigate` → `/admin/teachers/new` (view form riêng, không phải accordion/modal).
- Cấu trúc: header `flex items-center justify-between mb-6`, nút dùng component `Button` có sẵn.
- Triển khai: một biến `header` (hoặc helper render) dùng chung cho cả 2 nhánh để tránh duplicate.

### 5. `CreateTeacherPage.tsx` — thêm nút "Quay lại"

- Thêm nút **"Quay lại"** (variant `secondary`) phía trên form → `useNavigate('/admin/teachers')`.
- Form và logic submit giữ nguyên.

## Luồng dữ liệu

Không có luồng dữ liệu mới. Tất cả thay đổi là điều hướng UI:
- Dashboard (`/admin`) → tab "Tổng quan" (nội dung hiện tại của `AdminDashboardPage`).
- Tab "Quản lý giảng viên" → `/admin/teachers` → danh sách → nút "Tạo giảng viên" → `/admin/teachers/new` → nút "Quay lại" → `/admin/teachers`.

## Xử lý lỗi

- Không có xử lý lỗi mới cần thêm; giữ nguyên cơ chế error/loading của từng page hiện có.

## Kiểm thử

- `npm.cmd run lint` — 0 error.
- `npm.cmd run build` — thành công.
- Chạy lại Playwright `test_admin_manage.py` (script hiện tại dùng `page.goto` trực tiếp vào `/admin/teachers`, `/admin/teachers/new` nên vẫn pass; nếu nav thay đổi làm lệch selector thì cập nhật script).
- Kiểm tra thủ công trên browser: header admin không còn nav (chỉ logo + avatar), sidebar trái hiển thị "Tổng quan" và "Quản lý giảng viên", chuyển đổi giữa 2 tab hoạt động, nút tạo/quay lại hoạt động, refresh giữ đúng tab.

## YAGNI

- Không tạo tab mới ngoài 2 tab trên (không có tab Student, không có tab Kiểm duyệt).
- Không dùng state nội bộ cho tab (dùng route) — không có query string, không có modal.
- Không thêm icon/avatar placeholder cho sidebar (chỉ text label).