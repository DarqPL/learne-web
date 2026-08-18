# Thiết Kế: Reusable Form Validation

## Mục đích

Tạo bộ validator tái sử dụng cho các form trong web frontend, thay thế validation rời rạc hiện có. Mục tiêu:

- Dùng chung cho nhiều form (đăng nhập, đăng ký, quên mật khẩu, đặt lại mật khẩu, đổi mật khẩu, tạo giảng viên).
- Message lỗi tiếng Việt, tùy chỉnh được từng form.
- Kiểm tra trước khi gọi API để tránh request không hợp lệ lên backend.
- Không thêm dependency ngoài.

## Kiến trúc

Tạo thư mục `frontend/src/lib/validation/` gồm 2 file:

### 1. `validators.ts` — các hàm field-level (pure)

Mỗi validator là hàm: `(value: string, values: Record<string, string>) => string | null`
- Trả `null` nếu hợp lệ.
- Trả message lỗi (string) nếu không hợp lệ.

```ts
export type Validator = (value: string, values: Record<string, string>) => string | null

export function required(message = 'Trường này là bắt buộc.'): Validator
export function email(message = 'Email không hợp lệ.'): Validator
export function fullName(message = 'Vui lòng nhập họ và tên.'): Validator
export function passwordPolicy(
  message = 'Mật khẩu phải có ít nhất 8 ký tự, gồm cả chữ và số.',
): Validator
export function confirmPassword(referenceKey: string, message = 'Mật khẩu xác nhận không khớp.'): Validator
export function otp(message = 'Mã OTP phải gồm đúng 6 chữ số.'): Validator
```

Quy tắc kiểm tra:
- `required`: `value.trim().length === 0` → lỗi.
- `email`: `!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)` → lỗi.
- `fullName`: `value.trim().length === 0` → lỗi.
- `passwordPolicy`: `value.length < 8 || !/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)` → lỗi (trùng backend `PasswordPolicy`).
- `confirmPassword(referenceKey)`: `value !== values[referenceKey]` → lỗi.
- `otp`: `!/^\d{6}$/.test(value)` → lỗi (đúng 6 chữ số, chặn request không hợp lệ lên backend).

### 2. `validateForm.ts` — hàm gom lỗi theo field

```ts
import type { Validator } from './validators'

export function validateForm(
  values: Record<string, string>,
  rules: Record<string, Validator[]>,
): Record<string, string>
```

- Với mỗi field có rules, chạy lần lượt các validator theo thứ tự.
- Dừng ở lỗi đầu tiên của field đó (lỗi đầu thắng).
- Chỉ thêm key vào kết quả khi field có lỗi (field hợp lệ → không có key).
- Kết quả dùng để:
  - Kiểm tra `Object.keys(errors).length === 0` → hợp lệ, gọi API.
  - Truyền từng lỗi vào prop `error` của component `Field`.

## Cách dùng trong mỗi page

### Form 1 bước (login, forgot-password, reset-password, change-password, create-teacher)

```ts
const errors = validateForm(
  { email, password },
  {
    email: [required(), email()],
    password: [required()],
  },
)
if (Object.keys(errors).length > 0) {
  setFieldErrors(errors)
  return
}
// gọi API
```

JSX: `<Field label="Email" error={fieldErrors.email}>`

### Form 2 bước (register)

- Bước 1 (form thông tin): `validateForm` với rules `fullName`, `email`, `password`, `confirmPassword`.
- Bước 2 (OTP): `validateForm` với rules `otp` — thay cho check `/^\d{6}$/` inline hiện tại.

## Xử lý state lỗi

Mỗi page thêm state `fieldErrors: Record<string, string>` bên cạnh state `error` (lỗi toàn form từ API):
- `fieldErrors` hiển thị dưới từng input (prop `error` của `Field`).
- `error` (Alert toàn form) chỉ dùng cho lỗi API trả về.
- Khi user nhập lại (onChange), xóa lỗi của field tương ứng: `setFieldErrors((prev) => ({ ...prev, [field]: undefined }))` hoặc xóa cả form trước khi submit.

## Các page được áp dụng

| Page | File | Rules |
| --- | --- | --- |
| Đăng nhập | `src/pages/auth/LoginPage.tsx` | `email`, `password` |
| Đăng ký (bước 1) | `src/pages/auth/RegisterPage.tsx` | `fullName`, `email`, `password`, `confirmPassword` |
| Đăng ký (bước 2 OTP) | `src/pages/auth/RegisterPage.tsx` | `otp` |
| Quên mật khẩu | `src/pages/auth/ForgotPasswordPage.tsx` | `email` |
| Đặt lại mật khẩu | `src/pages/auth/ResetPasswordPage.tsx` | `email`, `otp` (dùng rule `otp` cho mã reset token — đúng 6 chữ số), `password`, `confirmPassword` |
| Đổi mật khẩu | `src/pages/auth/ChangePasswordPage.tsx` | `currentPassword`, `newPassword`, `confirmNewPassword` |
| Tạo giảng viên | `src/pages/admin/CreateTeacherPage.tsx` | `email`, `fullName` |

Ghi chú reset-password: backend yêu cầu reset token dạng 6 chữ số (giống OTP), nên dùng lại rule `otp` cho field token.

## Ràng buộc kỹ thuật

- `tsconfig.app.json`: `verbatimModuleSyntax` → dùng `import type { Validator }` khi chỉ import type.
- `erasableSyntaxOnly`: không dùng enum.
- ESLint `react-refresh/only-export-components`: validator file không export component → không vi phạm.
- Giữ message mặc định tiếng Việt; mỗi page có thể truyền message override.

## Test

- Không có test framework frontend (đã chốt test thủ công).
- Verify: `npm run lint` + `npm run build` pass.
- Test thủ công 6 form: nhập giá trị không hợp lệ → hiện lỗi dưới từng field, không gọi API; nhập hợp lệ → gọi API bình thường.
