# Admin Dashboard Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rút gọn nav ADMIN còn 1 mục "Dashboard" và đưa "Quản lý giảng viên" vào thành tab bên trong dashboard (kèm nút tạo giảng viên và form tạo ở view riêng).

**Architecture:** Giữ nguyên route hiện tại (`/admin`, `/admin/teachers`, `/admin/teachers/new`) — tab dùng `NavLink` đồng bộ với URL (approach B, ít sửa nhất). Thêm component `AdminTabs` đặt trong `AdminLayout` phía trên `<Outlet />`. Nav ADMIN trong `routes.ts` rút về 1 mục "Dashboard". `AdminTeacherListPage` và `CreateTeacherPage` giữ nguyên nội dung, chỉ thêm nút điều hướng.

**Tech Stack:** React 19, react-router-dom (NavLink), TypeScript (`verbatimModuleSyntax`, `noUnusedLocals`, `erasableSyntaxOnly`), Tailwind CSS, Vite. Không có test framework frontend — verify bằng `npm run lint` + `npm run build` + Playwright `test_admin_manage.py`.

---

### Task 1: Component `AdminTabs`

**Files:**
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\layouts\AdminTabs.tsx`

- [ ] **Step 1: Tạo file `AdminTabs.tsx`**

Tạo `src/layouts/AdminTabs.tsx` với nội dung:

```tsx
import { NavLink } from 'react-router-dom'

const tabs = [
  { label: 'Tổng quan', to: '/admin', end: true },
  { label: 'Quản lý giảng viên', to: '/admin/teachers', end: false },
]

export function AdminTabs() {
  return (
    <nav className="border-b border-gray-200">
      <div className="mx-auto flex max-w-6xl gap-1 px-4">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `-mb-px border-b-2 px-4 py-2.5 text-sm font-medium ${
                isActive
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
```

Lưu ý: `-mb-px` cần thiết để border-bottom 2px khớp với `border-b` của nav (đè lên đường viền container).

- [ ] **Step 2: Verify line ending**

```powershell
$b = [System.IO.File]::ReadAllBytes("C:\baobao\KLTN\learne-platform\frontend\src\layouts\AdminTabs.tsx"); $s = [System.Text.Encoding]::UTF8.GetString($b); "BOM=$($b[0] -eq 0xEF) CRLF=$(([regex]::Matches($s, "`r`n")).Count)"
```
Expected: `BOM=False CRLF=0`. Nếu Write tool sinh CRLF, viết lại dạng UTF8 no-BOM + LF.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/AdminTabs.tsx
git commit -m "feat: add admin dashboard tabs component"
```

---

### Task 2: Gắn `AdminTabs` vào `AdminLayout`

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\layouts\AdminLayout.tsx`

- [ ] **Step 1: Sửa `AdminLayout.tsx`**

File hiện tại:

```tsx
import { Outlet } from 'react-router-dom'
import { AppShell } from './AppShell'

export function AdminLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
```

Sửa thành:

```tsx
import { Outlet } from 'react-router-dom'
import { AdminTabs } from './AdminTabs'
import { AppShell } from './AppShell'

export function AdminLayout() {
  return (
    <AppShell>
      <AdminTabs />
      <Outlet />
    </AppShell>
  )
}
```

- [ ] **Step 2: Verify line ending**

```powershell
$b = [System.IO.File]::ReadAllBytes("C:\baobao\KLTN\learne-platform\frontend\src\layouts\AdminLayout.tsx"); $s = [System.Text.Encoding]::UTF8.GetString($b); "BOM=$($b[0] -eq 0xEF) CRLF=$(([regex]::Matches($s, "`r`n")).Count)"
```
Expected: `BOM=False CRLF=0`.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/AdminLayout.tsx
git commit -m "feat: render admin tabs inside admin layout"
```

---

### Task 3: Rút nav ADMIN còn 1 mục

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\lib\auth\routes.ts`

- [ ] **Step 1: Sửa `routes.ts`**

File hiện tại có case `ADMIN`:

```ts
    case 'ADMIN':
      return [
        { label: 'Dashboard', to: '/admin' },
        { label: 'Tạo giảng viên', to: '/admin/teachers/new' },
        { label: 'Quản lý giảng viên', to: '/admin/teachers' },
      ]
```

Sửa thành:

```ts
    case 'ADMIN':
      return [
        { label: 'Dashboard', to: '/admin' },
      ]
```

- [ ] **Step 2: Verify line ending**

```powershell
$b = [System.IO.File]::ReadAllBytes("C:\baobao\KLTN\learne-platform\frontend\src\lib\auth\routes.ts"); $s = [System.Text.Encoding]::UTF8.GetString($b); "BOM=$($b[0] -eq 0xEF) CRLF=$(([regex]::Matches($s, "`r`n")).Count)"
```
Expected: `BOM=False CRLF=0`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth/routes.ts
git commit -m "feat: reduce admin nav to dashboard only"
```

---

### Task 4: Thêm nút "Tạo giảng viên" vào `AdminTeacherListPage`

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\pages\admin\AdminTeacherListPage.tsx`

- [ ] **Step 1: Thêm import `useNavigate` và `Button` (nếu chưa có)**

File hiện tại đã import `Button`. Thêm `useNavigate` vào import react-router-dom. Hiện tại file KHÔNG import react-router-dom — thêm dòng import đầu file:

```tsx
import { useNavigate } from 'react-router-dom'
```

Import `useEffect`, `useState` hiện có giữ nguyên.

- [ ] **Step 2: Thêm `navigate` vào component**

Trong `export function AdminTeacherListPage() {`, thêm dòng đầu:

```tsx
export function AdminTeacherListPage() {
  const navigate = useNavigate()
  const [teachers, setTeachers] = useState<AdminTeacher[] | null>(null)
```

- [ ] **Step 3: Tạo header dùng chung**

Thay 2 chỗ `<h1>` (nhánh error và nhánh chính) bằng một header dùng chung. Chèn một biến `header` ngay trước `if (error) {`:

```tsx
  const header = (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-900">Quản lý giảng viên</h1>
      <Button variant="primary" onClick={() => navigate('/admin/teachers/new')}>
        Tạo giảng viên
      </Button>
    </div>
  )

  if (error) {
    return (
      <div>
        {header}
        <Alert>{error}</Alert>
      </div>
    )
  }

  return (
    <div>
      {header}
      {info ? (
```

Lưu ý: xóa 2 `<h1 className="mb-6 text-2xl font-bold text-gray-900">Quản lý giảng viên</h1>` cũ (một ở nhánh error, một ở nhánh chính) — thay bằng `{header}`.

- [ ] **Step 4: Verify line ending**

```powershell
$b = [System.IO.File]::ReadAllBytes("C:\baobao\KLTN\learne-platform\frontend\src\pages\admin\AdminTeacherListPage.tsx"); $s = [System.Text.Encoding]::UTF8.GetString($b); "BOM=$($b[0] -eq 0xEF) CRLF=$(([regex]::Matches($s, "`r`n")).Count)"
```
Expected: `BOM=False CRLF=0`.

- [ ] **Step 5: Lint + build**

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```
Expected: ESLint 0 errors; build thành công.

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/AdminTeacherListPage.tsx
git commit -m "feat: add create teacher button to admin teacher list"
```

---

### Task 5: Thêm nút "Quay lại" vào `CreateTeacherPage`

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\pages\admin\CreateTeacherPage.tsx`

- [ ] **Step 1: Thêm import `useNavigate`**

File hiện tại import: `useState, type FormEvent` từ react. Thêm import mới:

```tsx
import { useNavigate } from 'react-router-dom'
```

- [ ] **Step 2: Thêm `navigate` vào component**

```tsx
export function CreateTeacherPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
```

- [ ] **Step 3: Thêm nút "Quay lại" phía trên form**

Thay đoạn đầu của return hiện tại:

```tsx
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Tạo tài khoản giảng viên</h1>
```

bằng:

```tsx
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4">
        <Button variant="secondary" onClick={() => navigate('/admin/teachers')}>
          Quay lại
        </Button>
      </div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Tạo tài khoản giảng viên</h1>
```

`Button` đã được import sẵn trong file.

- [ ] **Step 4: Verify line ending**

```powershell
$b = [System.IO.File]::ReadAllBytes("C:\baobao\KLTN\learne-platform\frontend\src\pages\admin\CreateTeacherPage.tsx"); $s = [System.Text.Encoding]::UTF8.GetString($b); "BOM=$($b[0] -eq 0xEF) CRLF=$(([regex]::Matches($s, "`r`n")).Count)"
```
Expected: `BOM=False CRLF=0`.

- [ ] **Step 5: Lint + build**

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```
Expected: ESLint 0 errors; build thành công.

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/CreateTeacherPage.tsx
git commit -m "feat: add back button to create teacher page"
```

---

### Task 6: Kiểm thử Playwright thủ công

**Files:**
- Test: `C:\Users\Admin\AppData\Local\Temp\opencode\test_admin_manage.py`

- [ ] **Step 1: Kiểm tra Playwright + requests đã cài**

```powershell
python -c "import playwright, requests; print('ok')"
```
Expected: `ok`.

- [ ] **Step 2: Chạy test**

```powershell
python test_admin_manage.py
```
(workdir: `C:\Users\Admin\AppData\Local\Temp\opencode`)
Expected: `6/6 PASSED` — script hiện dùng `page.goto` trực tiếp vào `/admin/teachers` và `/admin/teachers/new` nên không phụ thuộc nav; không cần sửa script.

- [ ] **Step 3: Chạy kiểm tra bổ sung nav + tab (tạo script tạm hoặc thêm check)**

Tạo `C:\Users\Admin\AppData\Local\Temp\opencode\test_admin_tabs.py`:

```python
import sys
import time
import requests
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")

BASE = "http://localhost:5173"
RESULTS = []


def check(name, cond, detail=""):
    RESULTS.append((name, bool(cond), detail))
    print(("PASS" if cond else "FAIL"), "-", name, ("" if cond else f" [{detail}]"))


def login(page, email, password, expect_home):
    page.goto(f"{BASE}/login")
    page.wait_for_load_state("networkidle")
    page.get_by_label("Email").fill(email)
    page.get_by_label("Mật khẩu").fill(password)
    page.get_by_role("button", name="Đăng nhập").click()
    page.wait_for_url(expect_home, timeout=8000)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    login(page, "admin@learne.local", "Admin123", "**/admin*")

    page.goto(f"{BASE}/admin")
    page.wait_for_load_state("networkidle")
    nav_labels = page.locator("header nav a").all_text_contents()
    check("nav chi con 1 muc Dashboard", len(nav_labels) == 1 and nav_labels[0] == "Dashboard", str(nav_labels))

    tab_labels = page.locator("main > nav a, div > nav a").all_text_contents()
    check("tab Tổng quan + Quản lý giảng viên hiển thị", "Tổng quan" in tab_labels and "Quản lý giảng viên" in tab_labels, str(tab_labels))

    page.goto(f"{BASE}/admin/teachers")
    page.wait_for_load_state("networkidle")
    page.get_by_role("button", name="Tạo giảng viên").wait_for(timeout=8000)
    page.get_by_role("button", name="Tạo giảng viên").click()
    page.wait_for_url("**/admin/teachers/new*", timeout=8000)
    page.get_by_role("button", name="Quay lại").wait_for(timeout=8000)
    page.get_by_role("button", name="Quay lại").click()
    page.wait_for_url("**/admin/teachers*", timeout=8000)
    check("nut Tao giang vien -> form -> Quay lai -> danh sach", True)

    browser.close()

print(f"\n===== {sum(1 for _, ok, _ in RESULTS if ok)}/{len(RESULTS)} PASSED =====")
```

Chạy:

```powershell
python test_admin_tabs.py
```
Expected: tất cả `PASS`.

Lưu ý: nếu selector nav/tab không khớp do cấu trúc DOM, mở browser kiểm tra thủ công hoặc điều chỉnh locator trong script (đây là script tạm để verify, không commit).

---

### Task 7: Review toàn bộ + hoàn tất branch

**Files:** không có (git operations)

- [ ] **Step 1: Chạy lại toàn bộ kiểm tra cuối**

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```
Expected: ESLint 0 errors; build thành công.

```powershell
python test_admin_manage.py
```
(workdir: `C:\Users\Admin\AppData\Local\Temp\opencode`)
Expected: `6/6 PASSED`.

- [ ] **Step 2: Review toàn bộ diff**

```bash
git log --oneline main..HEAD
git diff main..HEAD --stat
```
Expected: chỉ gồm các commit của feature này (spec + 5 task) và file thay đổi gồm: `docs/superpowers/specs/2026-08-20-admin-dashboard-tabs-design.md`, `src/layouts/AdminTabs.tsx`, `src/layouts/AdminLayout.tsx`, `src/lib/auth/routes.ts`, `src/pages/admin/AdminTeacherListPage.tsx`, `src/pages/admin/CreateTeacherPage.tsx`.

- [ ] **Step 3: Cập nhật plan tick checkboxes**

Tick tất cả checkbox `- [ ]` trong file plan này thành `- [x]` (trừ dòng note trong blockquote header). Commit:

```bash
git add docs/superpowers/plans/2026-08-20-admin-dashboard-tabs.md
git commit -m "docs: mark admin dashboard tabs plan complete"
```

- [ ] **Step 4: Push nhánh**

```bash
git push -u origin feature/admin-dashboard-tabs
```

- [ ] **Step 5: Báo user tạo PR trên GitHub**

Trình bày: 1 PR cần tạo (frontend `feature/admin-dashboard-tabs`), test summary (lint/build pass, Playwright pass), nhắc sau khi merge GitHub Actions bot sẽ tự cập nhật pointer superproject như các lần trước.

---

## Self-Review Notes (cho người viết plan — KHÔNG phải task)

- **Spec coverage:** mọi mục trong spec (AdminTabs, AdminLayout, nav rút gọn, nút tạo giảng viên, nút quay lại, giữ route) đều có task tương ứng: Task 1 (AdminTabs), Task 2 (AdminLayout), Task 3 (routes.ts), Task 4 (AdminTeacherListPage), Task 5 (CreateTeacherPage), Task 6 (Playwright), Task 7 (finish).
- **YAGNI:** không thêm route mới, không đổi backend, không state nội bộ, không modal.
- **Lưu ý thực thi:** `Button` đã có sẵn trong cả 2 page (import không cần thêm). `AdminTeacherListPage` hiện chưa import react-router-dom — cần thêm `useNavigate`. Header dùng chung cho cả 2 nhánh (error + bình thường) để nút "Tạo giảng viên" luôn hiển thị.
- **Tại sao không TDD:** repo không có test framework frontend (đã xác nhận ở Phase 3); verification dùng lint + build + Playwright.
- **Lưu ý `test_admin_tabs.py`:** token không nằm trong localStorage (giữ trong module variable `tokenStore` + cookie refresh_token) → script phải đăng nhập qua UI như `test_admin_manage.py` (dùng `login(page, ...)` pattern), không dùng `add_init_script` với localStorage. Đã áp dụng trong code trên.