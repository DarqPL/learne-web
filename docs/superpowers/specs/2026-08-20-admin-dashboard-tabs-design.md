# Thiết kế: Admin Dashboard Tabs — Quản lý giảng viên trong Dashboard

## Mục tiêu

Rút gọn navigation của ADMIN từ 3 mục ("Dashboard", "Tạo giảng viên", "Quản lý giảng viên") xuống còn **1 mục "Dashboard"**. Bên trong dashboard có thanh tab điều hướng 2 khu vực: **"Tổng quan"** và **"Quản lý giảng viên"** (gồm danh sách + form tạo tài khoản giảng viên).

## Phạm vi

- Chỉ thay đổi frontend (submodule `frontend`), không đổi backend, không đổi schema.
- Giữ nguyên toàn bộ route hiện tại: `/admin`, `/admin/teachers`, `/admin/teachers/new`.
- Giữ nguyên component `AdminTeacherListPage` và `CreateTeacherPage` (chỉ thêm nút điều hướng).

## Kiến trúc / Thành phần

### 1. Component mới `AdminTabs` (`frontend/src/layouts/AdminTabs.tsx`)

- Thanh tab nằm ngang, dùng `NavLink` để đồng bộ trạng thái active với URL.
- 2 tab:
  - **"Tổng quan"** → `to="/admin"`, dùng prop `end` (chỉ active khi URL chính xác `/admin`).
  - **"Quản lý giảng viên"** → `to="/admin/teachers"`, active cho cả `/admin/teachers` và `/admin/teachers/new` (khi đang tạo GV tab vẫn sáng).
- Style: container `border-b border-gray-200`, mỗi tab `px-4 py-2.5 text-sm font-medium`, active: `border-indigo-600 text-indigo-700`, inactive: `border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300`; dùng border-bottom như tab convention.

### 2. `AdminLayout.tsx` — đặt tab phía trên `<Outlet />`

```tsx
<AppShell>
  <AdminTabs />
  <Outlet />
</AppShell>
```

### 3. `routes.ts` — rút nav ADMIN còn 1 mục

Mục `ADMIN` trong `navItemsFor`:
```ts
case 'ADMIN':
  return [
    { label: 'Dashboard', to: '/admin' },
  ]
```

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
- Kiểm tra thủ công trên browser: nav chỉ còn "Dashboard", tab chuyển đổi giữa Tổng quan và Quản lý giảng viên, nút tạo/quit lại hoạt động, refresh giữ đúng tab.

## YAGNI

- Không tạo tab mới ngoài 2 tab trên (không có tab Student, không có tab Kiểm duyệt).
- Không dùng state nội bộ cho tab (dùng route) — không có query string, không có modal.