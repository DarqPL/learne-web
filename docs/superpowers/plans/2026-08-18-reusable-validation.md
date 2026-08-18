# Reusable Form Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng bộ validator tái sử dụng cho các form auth và áp dụng vào 6 form hiện có.

**Architecture:** Thư mục `src/lib/validation/` chứa 2 file: `validators.ts` (6 rule field-level pure function trả `string | null`) và `validateForm.ts` (hàm gom lỗi theo field, dừng ở lỗi đầu tiên). Mỗi page auth khai báo rules theo field, lỗi hiển thị qua prop `error` của component `Field`.

**Tech Stack:** React 19, TypeScript (strict, `verbatimModuleSyntax`, `erasableSyntaxOnly`), Tailwind CSS v4, Vite. Không có test framework frontend — verify bằng `npm run lint` + `npm run build`.

---

### Task 1: Tạo validators.ts

**Files:**
- Create: `src/lib/validation/validators.ts`

- [ ] **Step 1: Tạo file validators.ts**

```ts
export type Validator = (value: string, values: Record<string, string>) => string | null

export function required(message = 'Trường này là bắt buộc.'): Validator {
  return (value) => (value.trim().length === 0 ? message : null)
}

export function email(message = 'Email không hợp lệ.'): Validator {
  return (value) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : message)
}

export function fullName(message = 'Vui lòng nhập họ và tên.'): Validator {
  return (value) => (value.trim().length === 0 ? message : null)
}

export function passwordPolicy(
  message = 'Mật khẩu phải có ít nhất 8 ký tự, gồm cả chữ và số.',
): Validator {
  return (value) =>
    value.length >= 8 && /[a-zA-Z]/.test(value) && /[0-9]/.test(value) ? null : message
}

export function confirmPassword(
  referenceKey: string,
  message = 'Mật khẩu xác nhận không khớp.',
): Validator {
  return (value, values) => (value === values[referenceKey] ? null : message)
}

export function otp(message = 'Mã OTP phải gồm đúng 6 chữ số.'): Validator {
  return (value) => (/^\d{6}$/.test(value) ? null : message)
}
```

- [ ] **Step 2: Kiểm tra lint + build**

Run: `npm run lint && npm run build`
Expected: pass, không lỗi.

- [ ] **Step 3: Commit**

```bash
git add src/lib/validation/validators.ts
git commit -m "feat: add reusable field validators"
```

---

### Task 2: Tạo validateForm.ts

**Files:**
- Create: `src/lib/validation/validateForm.ts`

- [ ] **Step 1: Tạo file validateForm.ts**

```ts
import type { Validator } from './validators'

export function validateForm(
  values: Record<string, string>,
  rules: Record<string, Validator[]>,
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const [field, validators] of Object.entries(rules)) {
    for (const validator of validators) {
      const message = validator(values[field] ?? '', values)
      if (message !== null) {
        errors[field] = message
        break
      }
    }
  }
  return errors
}
```

- [ ] **Step 2: Kiểm tra lint + build**

Run: `npm run lint && npm run build`
Expected: pass, không lỗi.

- [ ] **Step 3: Commit**

```bash
git add src/lib/validation/validateForm.ts
git commit -m "feat: add validateForm helper"
```

---

### Task 3: Áp dụng vào RegisterPage

**Files:**
- Modify: `src/pages/auth/RegisterPage.tsx`

- [ ] **Step 1: Cập nhật RegisterPage.tsx**

Thay import: xóa `PasswordInput` cũ giữ nguyên; thêm:

```ts
import { validateForm } from '../../lib/validation/validateForm'
import { confirmPassword, email, fullName, otp, passwordPolicy, required } from '../../lib/validation/validators'
```

Thay interface + state:

```ts
interface RegistrationForm {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

const initialForm: RegistrationForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
}

const emptyFieldErrors = {}
```

Trong component, thay state:

```ts
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>(emptyFieldErrors)
```

Thay `setField`:

```ts
const setField = (name: keyof RegistrationForm, value: string) => {
  setForm((prev) => ({ ...prev, [name]: value }))
  setFieldErrors((prev) => ({ ...prev, [name]: '' }))
}
```

Thay `validateStep1` + `handleRequestOtp` (bỏ validateStep1 inline):

```ts
const handleRequestOtp = async (event: FormEvent) => {
  event.preventDefault()
  const errors = validateForm(
    { fullName: form.fullName, email: form.email, password: form.password, confirmPassword: form.confirmPassword },
    {
      fullName: [fullName()],
      email: [required(), email()],
      password: [passwordPolicy()],
      confirmPassword: [confirmPassword('password')],
    },
  )
  if (Object.keys(errors).length > 0) {
    setFieldErrors(errors)
    return
  }
  setFieldErrors(emptyFieldErrors)
  setError(null)
  setInfo(null)
  setSubmitting(true)
  try {
    await requestRegistrationOtp(form)
    setInfo('Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (kể cả thư rác).')
    setStep(2)
  } catch (err) {
    setError(getApiErrorMessage(err, 'Không thể gửi mã OTP. Vui lòng thử lại.'))
  } finally {
    setSubmitting(false)
  }
}
```

Thay `handleVerifyOtp` (bỏ check `/^\d{6}$/` inline, dùng validator):

```ts
const handleVerifyOtp = async (event: FormEvent) => {
  event.preventDefault()
  const errors = validateForm({ otp }, { otp: [otp()] })
  if (Object.keys(errors).length > 0) {
    setFieldErrors(errors)
    return
  }
  setFieldErrors(emptyFieldErrors)
  setError(null)
  setSubmitting(true)
  try {
    await verifyRegistrationOtp({ email: form.email, otp })
    navigate('/login', { replace: true, state: { message: 'Đăng ký thành công, vui lòng đăng nhập.' } })
  } catch (err) {
    setError(getApiErrorMessage(err, 'Mã OTP không hợp lệ.'))
  } finally {
    setSubmitting(false)
  }
}
```

Thêm prop `error` vào các Field:

```tsx
<Field label="Họ và tên" error={fieldErrors.fullName}>
<Field label="Email" error={fieldErrors.email}>
<Field label="Mật khẩu" error={fieldErrors.password}>
<Field label="Xác nhận mật khẩu" error={fieldErrors.confirmPassword}>
<Field label="Mã OTP (6 chữ số)" error={fieldErrors.otp}>
```

Note: `fieldErrors.fullName` có thể là `''` (đã clear) → `Field` kiểm tra truthy nên `''` không hiển thị lỗi. Tốt.

- [ ] **Step 2: Kiểm tra lint + build**

Run: `npm run lint && npm run build`
Expected: pass. Lỗi cũ về OTP đã bị thay bằng validator.

- [ ] **Step 3: Commit**

```bash
git add src/pages/auth/RegisterPage.tsx
git commit -m "feat: apply reusable validation to register page"
```

---

### Task 4: Áp dụng vào LoginPage + ForgotPasswordPage

**Files:**
- Modify: `src/pages/auth/LoginPage.tsx`
- Modify: `src/pages/auth/ForgotPasswordPage.tsx`

- [ ] **Step 1: Cập nhật LoginPage.tsx**

Thêm imports:

```ts
import { validateForm } from '../../lib/validation/validateForm'
import { email, required } from '../../lib/validation/validators'
```

Thêm state:

```ts
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
```

Trong `handleSubmit`, thêm validation trước khi setSubmitting:

```ts
const handleSubmit = async (event: FormEvent) => {
  event.preventDefault()
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
  setFieldErrors({})
  setError(null)
  setSubmitting(true)
  try {
    ...
```

Thêm prop `error`:

```tsx
<Field label="Email" error={fieldErrors.email}>
<Field label="Mật khẩu" error={fieldErrors.password}>
```

- [ ] **Step 2: Cập nhật ForgotPasswordPage.tsx**

Thêm imports:

```ts
import { validateForm } from '../../lib/validation/validateForm'
import { email, required } from '../../lib/validation/validators'
```

Thêm state:

```ts
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
```

Trong `handleSubmit`:

```ts
const handleSubmit = async (event: FormEvent) => {
  event.preventDefault()
  const errors = validateForm({ email }, { email: [required(), email()] })
  if (Object.keys(errors).length > 0) {
    setFieldErrors(errors)
    return
  }
  setFieldErrors({})
  setError(null)
  setSubmitting(true)
  try {
    ...
```

Thêm prop `error`:

```tsx
<Field label="Email" error={fieldErrors.email}>
```

- [ ] **Step 3: Kiểm tra lint + build**

Run: `npm run lint && npm run build`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add src/pages/auth/LoginPage.tsx src/pages/auth/ForgotPasswordPage.tsx
git commit -m "feat: apply reusable validation to login and forgot password pages"
```

---

### Task 5: Áp dụng vào ResetPasswordPage

**Files:**
- Modify: `src/pages/auth/ResetPasswordPage.tsx`

- [ ] **Step 1: Cập nhật ResetPasswordPage.tsx**

Thêm imports:

```ts
import { validateForm } from '../../lib/validation/validateForm'
import { confirmPassword, email, otp, passwordPolicy, required } from '../../lib/validation/validators'
```

Thêm state:

```ts
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
```

Trong `handleSubmit`:

```ts
const handleSubmit = async (event: FormEvent) => {
  event.preventDefault()
  const errors = validateForm(
    { email, token, newPassword, confirmNewPassword },
    {
      email: [required(), email()],
      token: [otp()],
      newPassword: [passwordPolicy()],
      confirmNewPassword: [confirmPassword('newPassword')],
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
    ...
```

Thêm prop `error`:

```tsx
<Field label="Email" error={fieldErrors.email}>
<Field label="Mã đặt lại mật khẩu" error={fieldErrors.token}>
<Field label="Mật khẩu mới" error={fieldErrors.newPassword}>
<Field label="Xác nhận mật khẩu mới" error={fieldErrors.confirmNewPassword}>
```

- [ ] **Step 2: Kiểm tra lint + build**

Run: `npm run lint && npm run build`
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add src/pages/auth/ResetPasswordPage.tsx
git commit -m "feat: apply reusable validation to reset password page"
```

---

### Task 6: Áp dụng vào ChangePasswordPage

**Files:**
- Modify: `src/pages/auth/ChangePasswordPage.tsx`

- [ ] **Step 1: Cập nhật ChangePasswordPage.tsx**

Thêm imports:

```ts
import { validateForm } from '../../lib/validation/validateForm'
import { confirmPassword, passwordPolicy, required } from '../../lib/validation/validators'
```

Thêm state:

```ts
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
```

Trong `handleSubmit`:

```ts
const handleSubmit = async (event: FormEvent) => {
  event.preventDefault()
  const errors = validateForm(
    { currentPassword, newPassword, confirmNewPassword },
    {
      currentPassword: [required()],
      newPassword: [passwordPolicy()],
      confirmNewPassword: [confirmPassword('newPassword')],
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
    ...
```

Thêm prop `error`:

```tsx
<Field label="Mật khẩu hiện tại" error={fieldErrors.currentPassword}>
<Field label="Mật khẩu mới" error={fieldErrors.newPassword}>
<Field label="Xác nhận mật khẩu mới" error={fieldErrors.confirmNewPassword}>
```

- [ ] **Step 2: Kiểm tra lint + build**

Run: `npm run lint && npm run build`
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add src/pages/auth/ChangePasswordPage.tsx
git commit -m "feat: apply reusable validation to change password page"
```

---

### Task 7: Áp dụng vào CreateTeacherPage

**Files:**
- Modify: `src/pages/admin/CreateTeacherPage.tsx`

- [ ] **Step 1: Cập nhật CreateTeacherPage.tsx**

Thêm imports:

```ts
import { validateForm } from '../../lib/validation/validateForm'
import { email, fullName, required } from '../../lib/validation/validators'
```

Thêm state:

```ts
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
```

Trong `handleSubmit`:

```ts
const handleSubmit = async (event: FormEvent) => {
  event.preventDefault()
  const errors = validateForm(
    { email, fullName },
    {
      fullName: [fullName()],
      email: [required(), email()],
    },
  )
  if (Object.keys(errors).length > 0) {
    setFieldErrors(errors)
    return
  }
  setFieldErrors({})
  setError(null)
  setInfo(null)
  setSubmitting(true)
  try {
    ...
```

Thêm prop `error`:

```tsx
<Field label="Họ và tên" error={fieldErrors.fullName}>
<Field label="Email" error={fieldErrors.email}>
```

- [ ] **Step 2: Kiểm tra lint + build**

Run: `npm run lint && npm run build`
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/CreateTeacherPage.tsx
git commit -m "feat: apply reusable validation to create teacher page"
```

---

### Task 8: Kiểm tra hoàn tất

**Files:** không có

- [x] **Step 1: Chạy lint + build toàn project**

Run: `npm run lint && npm run build`
Expected: cả hai pass, không lỗi.

- [ ] **Step 2: Test thủ công 6 form (Docker dev, http://localhost:5173)**

Checklist:
1. **Login** `/login`: bỏ trống email/password → lỗi "Trường này là bắt buộc." dưới từng field, không gọi API. Email sai định dạng → "Email không hợp lệ."
2. **Register** `/register`: bỏ trống → lỗi. Password yếu (vd `abc`) → "Mật khẩu phải có ít nhất 8 ký tự...". Confirm sai → "Mật khẩu xác nhận không khớp.". Bước 2: OTP < 6 hoặc có chữ → "Mã OTP phải gồm đúng 6 chữ số.", không gọi `/api/auth/register/verify-otp`.
3. **Forgot** `/forgot-password`: email sai định dạng → "Email không hợp lệ."
4. **Reset** `/reset-password`: token sai → "Mã OTP phải gồm đúng 6 chữ số.". Password yếu / confirm sai → lỗi tương ứng.
5. **Change password** `/change-password`: password mới yếu / confirm sai → lỗi tương ứng.
6. **Create teacher** `/admin/teachers/new`: fullName rỗng → "Vui lòng nhập họ và tên.". Email sai → "Email không hợp lệ.".

Mỗi trường hợp: thấy lỗi dưới field, xác nhận trong Network tab KHÔNG có request API mới.

- [x] **Step 3: Cập nhật tiến độ docs (nếu cần)**

Trong `../docs/Docs_Capstone/Phase2_UI_Implementation.md` (submodule docs), thêm mục ghi chú validator tái sử dụng vào "Công Việc Đã Làm" nếu thấy phù hợp. Commit:

```bash
cd ../docs && git add Docs_Capstone/Phase2_UI_Implementation.md && git commit -m "docs: note reusable form validation"
```

---

## Kiểm Tra Spec Coverage

| Yêu cầu spec | Task |
| --- | --- |
| validators.ts: required, email, fullName, passwordPolicy, confirmPassword, otp | Task 1 |
| validateForm.ts: gom lỗi, dừng lỗi đầu tiên | Task 2 |
| Register bước 1 (4 rules) + bước 2 OTP | Task 3 |
| Login, Forgot | Task 4 |
| Reset (email, token=otp, password, confirm) | Task 5 |
| Change password (required, passwordPolicy, confirm) | Task 6 |
| Create teacher (fullName, email) | Task 7 |
| Lint/build + test thủ công | Task 8 |
| Không dependency ngoài, message tiếng Việt override được | Tất cả |
