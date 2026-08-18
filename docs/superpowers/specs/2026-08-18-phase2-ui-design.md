# Thiết Kế UI Phase 2 — Nền Tảng Hệ Thống Và Authentication

Ngày: 2026-08-18
Phạm vi: frontend submodule (`learne-web`), branch `phase2-ui`

## 1. Mục Đích

Hoàn tất phần UI còn thiếu của Phase 2 theo `Project_Plan_Trello_Kanban.md` (mục 8 — "Chưa Thực Hiện Trong Phase 2" và card "Đang Làm Tiếp Theo" về UI đăng nhập kèm cơ chế tránh gọi refresh song song khi nhiều request cùng gặp 401). Toàn bộ frontend gọi đúng các API auth hiện có của backend, không thêm/sửa API backend.

## 2. Phạm Vi

### Bao Gồm

- UI đăng nhập (`/login`) kèm cơ chế refresh-on-401 single-flight cho API client.
- UI đăng ký tài khoản Student bằng OTP (`/register`, 2 bước: form → OTP, có gửi lại OTP).
- UI quên mật khẩu (`/forgot-password`) và đặt lại mật khẩu (`/reset-password`).
- UI đổi mật khẩu (`/change-password`), bao gồm luồng bắt buộc đổi mật khẩu lần đầu cho Teacher (`mustChangePassword`).
- Layout dashboard riêng cho Student, Teacher, Admin với route guard theo role.
- UI Admin tạo tài khoản Teacher (`/admin/teachers/new`).
- Đăng xuất từ mọi layout.

### Không Bao Gồm

- UI Admin khóa tài khoản user (chưa có API list user backend).
- Bất kỳ thay đổi API/backend nào.
- Unit test frontend (test thủ công bằng trình duyệt).

## 3. Quyết Định Kỹ Thuật

| Vấn đề | Quyết định |
| --- | --- |
| Routing | `react-router-dom` |
| Styling | Tailwind CSS v4 (plugin `@tailwindcss/vite`) |
| HTTP client | `axios` (instance + interceptor cho refresh-on-401) |
| Auth state | React Context (`AuthProvider`) + module singleton giữ access token trong memory (không localStorage) |
| Kết nối backend | Vite dev proxy `/api` → `http://localhost:8080` (cookie same-origin, không cần CORS) |
| Ngôn ngữ UI | Tiếng Việt; message lỗi backend (tiếng Anh) hiển thị nguyên bản |

## 4. API Backend Được Sử Dụng

| Endpoint | Body | Response |
| --- | --- | --- |
| `POST /api/auth/register/request-otp` | `{fullName, email, password, confirmPassword}` | `{message}` |
| `POST /api/auth/register/verify-otp` | `{email, otp}` (otp 6 chữ số) | `{message}` |
| `POST /api/auth/register/resend-otp` | `{email}` | `{message}` |
| `POST /api/auth/login` | `{email, password}` | 200 + Set-Cookie refresh (HttpOnly) + `{accessToken, expiresInSeconds, user}` |
| `POST /api/auth/refresh` | (cookie refresh) | 200 + cookie mới + `{accessToken, expiresInSeconds, user}` |
| `POST /api/auth/logout` | (cookie refresh) | xóa cookie + `{message}` |
| `GET /api/auth/me` | — | `AuthUserResponse` |
| `POST /api/auth/change-password` | `{currentPassword, newPassword, confirmNewPassword}` | `{message}` |
| `POST /api/auth/password-reset/request` | `{email}` | `{message}` |
| `POST /api/auth/password-reset/confirm` | `{email, token, newPassword, confirmNewPassword}` | `{message}` |
| `POST /api/admin/teachers` | `{email, fullName}` | 201 `AuthUserResponse` |

`AuthUserResponse`: `{id, email, fullName, role: STUDENT|TEACHER|ADMIN, mustChangePassword}`.
Lỗi: `ApiErrorResponse {message}` kèm HTTP status; validation → 400 `{message: "Invalid request."}`.
Chính sách mật khẩu (backend): ≥8 ký tự, có chữ và số, confirm khớp.

## 5. Cấu Trúc Thư Mục

```
src/
  main.tsx                 BrowserRouter + AuthProvider + App
  App.tsx                  định nghĩa Routes
  lib/api/
    client.ts              axios instance + interceptor refresh-on-401 + retry queue
    authApi.ts             các hàm gọi API có kiểu
    types.ts               AuthUser, AuthTokenResponse, UserRole, ...
  lib/auth/
    tokenStore.ts          singleton giữ access token trong memory, cho phép subscribe
    AuthContext.tsx        AuthProvider + useAuth()
    guards.tsx             RequireAuth, RequireRole, RequirePasswordChange
  layouts/
    AuthLayout.tsx         layout trung tâm cho trang auth (logo + card)
    AppShell.tsx           shell dùng chung (header, nav, menu user, logout)
    StudentLayout.tsx / TeacherLayout.tsx / AdminLayout.tsx   bọc AppShell, nav riêng theo role
  components/ui/           Button, Input, PasswordInput, Alert, Card, Spinner
  pages/auth/              LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, ChangePasswordPage
  pages/student/           StudentDashboardPage
  pages/teacher/           TeacherDashboardPage
  pages/admin/             AdminDashboardPage, CreateTeacherPage
  pages/NotFoundPage.tsx
```

## 6. API Client (Axios) — Refresh-On-401 Single-Flight

- Instance axios: `baseURL: ''`, `withCredentials: true`, `headers: { 'Content-Type': 'application/json' }`.
- Request interceptor: nếu có access token, gắn `Authorization: Bearer <token>`.
- Response interceptor xử lý `401`:
  - Bỏ qua (không retry/refresh) với các request: `/api/auth/login`, `/api/auth/refresh`, `/api/auth/register/*`, `/api/auth/password-reset/*`.
  - Với request khác: chờ **một promise refresh dùng chung duy nhất** (`refreshPromise`). Nếu chưa có promise đang chạy thì tạo `doRefresh()`; mọi request 401 đồng thời cùng await promise này (tránh gọi refresh song song).
  - `doRefresh()` gọi `POST /api/auth/refresh` (cookie tự gửi same-origin). Thành công → ghi đè token, trả token mới. Thất bại → xóa token, thông báo `onUnauthorized()` để AuthContext logout và redirect `/login`.
  - Sau khi có token mới, **retry lại request ban đầu** với token mới.
- Request `login` trả về access token → ghi vào tokenStore.

### Khôi Phục Phiên Khi Load Lại Trang

- AuthProvider khi mount: nếu chưa có token, gọi `POST /api/auth/refresh` để khôi phục user (cookie vẫn còn). Thành công → set user; thất bại → trạng thái chưa đăng nhập.
- Token chỉ ở memory: reload mất token, phải dựa vào refresh cookie.

## 7. Luồng Auth

### Đăng Nhập
1. `POST /api/auth/login` → `{accessToken, user}` (+ cookie do trình duyệt lưu).
2. Lưu token, set user.
3. Redirect theo role: `user.role` → `/student`, `/teacher`, `/admin`.
4. Nếu `user.mustChangePassword === true` → redirect `/change-password?forced=1`.

### Đăng Ký Student (2 bước)
1. Bước 1: form họ tên, email, mật khẩu, xác nhận. Validate client (≥8 ký tự + chữ + số, confirm khớp) → `request-otp`.
2. Bước 2: nhập OTP 6 số (email giữ sẵn), nút "Gửi lại OTP" → `resend-otp`. `verify-otp` thành công → redirect `/login` kèm thông báo "Đăng ký thành công, vui lòng đăng nhập".

### Quên Mật Khẩu
- `/forgot-password`: nhập email → `password-reset/request` → hiện thông báo chung (không leak email).
- `/reset-password`: email, token, mật khẩu mới, xác nhận → `password-reset/confirm` → redirect `/login`.

### Đổi Mật Khẩu / Buộc Đổi Mật Khẩu
- Form: mật khẩu hiện tại, mật khẩu mới, xác nhận → `change-password`.
- Sau khi thành công: backend thu hồi toàn bộ refresh token → frontend chủ động xóa auth state và redirect `/login` kèm thông báo "Đổi mật khẩu thành công, vui lòng đăng nhập lại".
- Khi `forced=1` (mustChangePassword): ẩn nav, chặn mọi điều hướng ra ngoài cho tới khi đổi xong.

### Đăng Xuất
- Nút logout trong AppShell → `POST /api/auth/logout` (xóa cookie) → xóa auth state → redirect `/login`.

## 8. Routing Và Guard

```
/login                public
/register             public
/forgot-password      public
/reset-password       public
/change-password      RequireAuth (mọi role), nhận query `forced`
/                     redirect theo role
/student              RequireAuth + RequireRole(STUDENT) → StudentLayout
/teacher              RequireAuth + RequireRole(TEACHER) → TeacherLayout
/admin                RequireAuth + RequireRole(ADMIN) → AdminLayout
/admin/teachers/new   RequireAuth + RequireRole(ADMIN) → AdminLayout
*                     NotFound
```

- `RequireAuth`: chưa đăng nhập → `/login` (kèm `next` nếu muốn quay lại).
- `RequireRole`: sai role → redirect về dashboard của role hiện tại.
- `RequirePasswordChange`: `mustChangePassword` → ép `/change-password?forced=1`, chặn mọi trang protected khác.
- `/` (chưa đăng nhập) → `/login`; (đã đăng nhập) → redirect theo role.

## 9. Xử Lý Lỗi

- Response interceptor parse lỗi: đọc `{message}` từ body; nếu không phải JSON (vd 401 từ entry point) → thông báo chung "Phiên đăng nhập hết hạn".
- UI hiển thị lỗi qua `Alert` (màu đỏ), nội dung tiếng Việt + message backend nguyên bản.
- Form validate client-side tiếng Việt: email hợp lệ, mật khẩu ≥8 + chữ + số, confirm khớp, OTP 6 số.
- Nút submit: disabled + spinner khi đang gọi API; chống submit trùng.

## 10. Cấu Hình Môi Trường

- `vite.config.ts`: thêm `server.proxy = { '/api': { target: 'http://localhost:8080', changeOrigin: true } }`.
- `infra/docker-compose.dev.yml`: đổi `VITE_API_BASE_URL` thành chuỗi rỗng (không gọi thẳng `http://localhost:8080`).
- Không cần thêm CORS backend (proxy làm mọi request same-origin).

## 11. Kiểm Tra (Verification)

- `npm run lint` — không lỗi ESLint.
- `npm run build` — build TypeScript + Vite thành công.
- Test thủ công bằng trình duyệt: toàn bộ luồng login, register OTP, forgot/reset, change password (kể cả forced), admin tạo teacher, phân quyền redirect, refresh token sau hết hạn access token.

## 12. Tiêu Chí Hoàn Thành (Definition Of Done)

- Tất cả trang UI Phase 2 chạy được với dữ liệu mẫu qua Docker Compose dev.
- Access token hết hạn → request tự refresh một lần, không gọi refresh song song; refresh thất bại → logout sạch.
- Teacher đăng nhập lần đầu bị ép đổi mật khẩu; sau khi đổi phải đăng nhập lại.
- Không làm hỏng các chức năng backend đã có (không đổi API).