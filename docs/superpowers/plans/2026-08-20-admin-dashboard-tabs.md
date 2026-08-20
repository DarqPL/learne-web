# Admin Dashboard Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gỡ hẳn nav ADMIN trên header (chỉ còn logo + avatar) và đưa toàn bộ điều hướng admin vào **sidebar dọc full-height bên trái** với 2 tab: "Tổng quan" và "Quản lý giảng viên" (gồm danh sách + form tạo ở view riêng).

**Architecture:** Giữ nguyên route hiện tại (`/admin`, `/admin/teachers`, `/admin/teachers/new`) — tab dùng `NavLink` đồng bộ với URL (approach B, ít sửa nhất). Thêm component `AdminSidebar` đặt trong `AdminLayout` (flex: sidebar trái + nội dung phải). Nav ADMIN trong `routes.ts` trả về mảng rỗng (header admin không còn nav). `AdminTeacherListPage` và `CreateTeacherPage` giữ nguyên nội dung, chỉ thêm nút điều hướng.

**Tech Stack:** React 19, react-router-dom (NavLink), TypeScript (`verbatimModuleSyntax`, `noUnusedLocals`, `erasableSyntaxOnly`), Tailwind CSS, Vite. Không có test framework frontend — verify bằng `npm run lint` + `npm run build` + Playwright `test_admin_manage.py`.

---

### Task 1: Component `AdminSidebar` (thay `AdminTabs` đã tạo sơ bộ)

**Files:**
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\layouts\AdminSidebar.tsx`
- Delete: `C:\baobao\KLTN\learne-platform\frontend\src\layouts\AdminTabs.tsx`

**Step 0: Xóa file `AdminTabs.tsx`**

File `AdminTabs.tsx` (thanh tab ngang) đã được tạo ở commit trước (thiết kế cũ). Xóa nó vì thiết kế mới dùng sidebar dọc:

```bash
git rm src/layouts/AdminTabs.tsx
```

**Step 1: Tạo file `AdminSidebar.tsx`**

Tạo `src/layouts/AdminSidebar.tsx` với nội dung:

```tsx
import { NavLink } from 'react-router-dom'

const tabs = [
  { label: 'Tổng quan', to: '/admin', end: true },
  { label: 'Quản lý giảng viên', to: '/admin/teachers', end: false },
]

export function AdminSidebar() {
  return (
    <aside className="w-56 shrink-0">
      <nav className="flex flex-col gap-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
```

Lưu ý: style tab trong sidebar dùng dạng nav-link (`rounded-lg`, `bg-indigo-50`) — đồng bộ với nav header hiện tại trong `AppShell.tsx`. Kích thước `w-56` cố định, full-height do flex container trong `AdminLayout`.

**Step 2: Verify line ending**

```powershell
$b = [System.IO.File]::ReadAllBytes("C:\baobao\KLTN\learne-platform\frontend\src\layouts\AdminSidebar.tsx"); $s = [System.Text.Encoding]::UTF8.GetString($b); "BOM=$($b[0] -eq 0xEF) CRLF=$(([regex]::Matches($s, "`r`n")).Count)"
```
Expected: `BOM=False CRLF=0`. Nếu Write tool sinh CRLF, viết lại dạng UTF8 no-BOM + LF.

**Step 3: Commit**

```bash
git add src/layouts/AdminSidebar.tsx src/layouts/AdminTabs.tsx
git commit -m "feat: replace admin tabs with left sidebar"
```

---

### Task 2: Gắn `AdminSidebar` vào `AdminLayout`

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\layouts\AdminLayout.tsx`

**Step 1: Sửa `AdminLayout.tsx`**

File hiện tại (sau commit Task 2 trước đó đã gắn `AdminTabs`):

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

Sửa thành:

```tsx
import { Outlet } from 'react-router-dom'
import { AdminSidebar } from './AdminSidebar'
import { AppShell } from './AppShell'

export function AdminLayout() {
  return (
    <AppShell>
      <div className="flex gap-8">
        <AdminSidebar />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </AppShell>
  )
}
```

**Step 2: Verify line ending**

```powershell
$b = [System.IO.File]::ReadAllBytes("C:\baobao\KLTN\learne-platform\frontend\src\layouts\AdminLayout.tsx"); $s = [System.Text.Encoding]::UTF8.GetString($b); "BOM=$($b[0] -eq 0xEF) CRLF=$(([regex]::Matches($s, "`r`n")).Count)"
```
Expected: `BOM=False CRLF=0`.

**Step 3: Commit**

```bash
git add src/layouts/AdminLayout.tsx
git commit -m "feat: render admin sidebar inside admin layout"
```

---

### Task 3: Gỡ hẳn nav ADMIN (trả về mảng rỗng)

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\lib\auth\routes.ts`

**Step 1: Sửa `routes.ts`**

File hiện tại (sau commit Task 3 trước đó) có case `ADMIN`:

```ts
    case 'ADMIN':
      return [
        { label: 'Dashboard', to: '/admin' },
      ]
```

Sửa thành:

```ts
    case 'ADMIN':
      return []
```

`AppShell.tsx` tự render nav từ mảng này — mảng rỗng nghĩa là header admin chỉ còn logo + thông tin người dùng.

**Step 2: Verify line ending**

```powershell
$b = [System.IO.File]::ReadAllBytes("C:\baobao\KLTN\learne-platform\frontend\src\lib\auth\routes.ts"); $s = [System.Text.Encoding]::UTF8.GetString($b); "BOM=$($b[0] -eq 0xEF) CRLF=$(([regex]::Matches($s, "`r`n")).Count)"
```
Expected: `BOM=False CRLF=0`.

**Step 3: Typecheck**

```powershell
node node_modules/typescript/bin/tsc --noEmit
```
Expected: exit 0, không lỗi (không có unused — `navItemsFor` vẫn được dùng cho các role khác).

**Step 4: Commit**

```bash
git add src/lib/auth/routes.ts
git commit -m "feat: remove admin nav items entirely"
```

---

### Task 4: Thêm nút "Tạo giảng viên" vào `AdminTeacherListPage`

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\pages\admin\AdminTeacherListPage.tsx`

- [x] **Step 1: Thêm import `useNavigate` và `Button` (nếu chưa có)**

File hiện tại đã import `Button`. Thêm `useNavigate` vào import react-router-dom. Hiện tại file KHÔNG import react-router-dom — thêm dòng import đầu file:

```tsx
import { useNavigate } from 'react-router-dom'
```

Import `useEffect`, `useState` hiện có giữ nguyên.

- [x] **Step 2: Thêm `navigate` vào component**

Trong `export function AdminTeacherListPage() {`, thêm dòng đầu:

```tsx
export function AdminTeacherListPage() {
  const navigate = useNavigate()
  const [teachers, setTeachers] = useState<AdminTeacher[] | null>(null)
```

- [x] **Step 3: Tạo header dùng chung**

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

- [x] **Step 4: Verify line ending**

```powershell
$b = [System.IO.File]::ReadAllBytes("C:\baobao\KLTN\learne-platform\frontend\src\pages\admin\AdminTeacherListPage.tsx"); $s = [System.Text.Encoding]::UTF8.GetString($b); "BOM=$($b[0] -eq 0xEF) CRLF=$(([regex]::Matches($s, "`r`n")).Count)"
```
Expected: `BOM=False CRLF=0`.

- [x] **Step 5: Lint + build**

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```
Expected: ESLint 0 errors; build thành công.

- [x] **Step 6: Commit**

```bash
git add src/pages/admin/AdminTeacherListPage.tsx
git commit -m "feat: add create teacher button to admin teacher list"
```

---

### Task 5: Thêm nút "Quay lại" vào `CreateTeacherPage`

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\pages\admin\CreateTeacherPage.tsx`

- [x] **Step 1: Thêm import `useNavigate`**

File hiện tại import: `useState, type FormEvent` từ react. Thêm import mới:

```tsx
import { useNavigate } from 'react-router-dom'
```

- [x] **Step 2: Thêm `navigate` vào component**

```tsx
export function CreateTeacherPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
```

- [x] **Step 3: Thêm nút "Quay lại" phía trên form**

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

- [x] **Step 4: Verify line ending**

```powershell
$b = [System.IO.File]::ReadAllBytes("C:\baobao\KLTN\learne-platform\frontend\src\pages\admin\CreateTeacherPage.tsx"); $s = [System.Text.Encoding]::UTF8.GetString($b); "BOM=$($b[0] -eq 0xEF) CRLF=$(([regex]::Matches($s, "`r`n")).Count)"
```
Expected: `BOM=False CRLF=0`.

- [x] **Step 5: Lint + build**

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```
Expected: ESLint 0 errors; build thành công.

- [x] **Step 6: Commit**

```bash
git add src/pages/admin/CreateTeacherPage.tsx
git commit -m "feat: add back button to create teacher page"
```

---

### Task 6: Kiểm thử Playwright thủ công

**Files:**
- Test: `C:\Users\Admin\AppData\Local\Temp\opencode\test_admin_manage.py`

- [x] **Step 1: Kiểm tra Playwright + requests đã cài**

```powershell
python -c "import playwright, requests; print('ok')"
```
Expected: `ok`.

- [x] **Step 2: Chạy test**

```powershell
python test_admin_manage.py
```
(workdir: `C:\Users\Admin\AppData\Local\Temp\opencode`)
Expected: `6/6 PASSED` — script hiện dùng `page.goto` trực tiếp vào `/admin/teachers` và `/admin/teachers/new` nên không phụ thuộc nav; không cần sửa script.

- [x] **Step 3: Chạy kiểm tra bổ sung nav + tab (tạo script tạm hoặc thêm check)**

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
    check("nav header admin rong (khong con link)", len(nav_labels) == 0, str(nav_labels))

    page.goto(f"{BASE}/admin/teachers")
    page.wait_for_load_state("networkidle")
    sidebar_labels = page.locator("aside a").all_text_contents()
    check("sidebar co Tổng quan + Quản lý giảng viên", "Tổng quan" in sidebar_labels and "Quản lý giảng viên" in sidebar_labels, str(sidebar_labels))

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

- [x] **Step 1: Chạy lại toàn bộ kiểm tra cuối**

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```
Expected: ESLint 0 errors; build thành công.

```powershell
python test_admin_manage.py
```
(workdir: `C:\Users\Admin\AppData\Local\Temp\opencode`)
Expected: `6/6 PASSED`.

- [x] **Step 2: Review toàn bộ diff**

```bash
git log --oneline main..HEAD
git diff main..HEAD --stat
```
Expected: chỉ gồm các commit của feature này (spec + 5 task) và file thay đổi gồm: `docs/superpowers/specs/2026-08-20-admin-dashboard-tabs-design.md`, `docs/superpowers/plans/2026-08-20-admin-dashboard-tabs.md`, `src/layouts/AdminSidebar.tsx`, `src/layouts/AdminTabs.tsx` (xóa), `src/layouts/AdminLayout.tsx`, `src/lib/auth/routes.ts`, `src/pages/admin/AdminTeacherListPage.tsx`, `src/pages/admin/CreateTeacherPage.tsx`.

- [x] **Step 3: Cập nhật plan tick checkboxes**

Tick tất cả checkbox `- [x]` trong file plan này thành `- [x]` (trừ dòng note trong blockquote header). Commit:

```bash
git add docs/superpowers/plans/2026-08-20-admin-dashboard-tabs.md
git commit -m "docs: mark admin dashboard tabs plan complete"
```

- [x] **Step 4: Push nhánh**

```bash
git push -u origin feature/admin-dashboard-tabs
```

- [x] **Step 5: Báo user tạo PR trên GitHub**

Trình bày: 1 PR cần tạo (frontend `feature/admin-dashboard-tabs`), test summary (lint/build pass, Playwright pass), nhắc sau khi merge GitHub Actions bot sẽ tự cập nhật pointer superproject như các lần trước.

---

## Self-Review Notes (cho người viết plan — KHÔNG phải task)

- **Spec coverage:** mọi mục trong spec (AdminSidebar, AdminLayout, gỡ nav admin, nút tạo giảng viên, nút quay lại, giữ route) đều có task tương ứng: Task 1 (AdminSidebar + xóa AdminTabs), Task 2 (AdminLayout), Task 3 (routes.ts), Task 4 (AdminTeacherListPage), Task 5 (CreateTeacherPage), Task 6 (Playwright), Task 7 (finish).
- **YAGNI:** không thêm route mới, không đổi backend, không state nội bộ, không modal, không icon/avatar trong sidebar.
- **Lưu ý thực thi:** `Button` đã có sẵn trong cả 2 page (import không cần thêm). `AdminTeacherListPage` hiện chưa import react-router-dom — cần thêm `useNavigate`. Header dùng chung cho cả 2 nhánh (error + bình thường) để nút "Tạo giảng viên" luôn hiển thị.
- **Đã chốt thiết kế:** user yêu cầu sidebar trái full-height thay vì tab ngang; nav admin gỡ hẳn (header chỉ logo + avatar). Tasks 1-3 cũ (AdminTabs tab ngang) được thay bằng bản mới (AdminSidebar dọc).
- **Tại sao không TDD:** repo không có test framework frontend (đã xác nhận ở Phase 3); verification dùng lint + build + Playwright.
- **Lưu ý `test_admin_tabs.py`:** token không nằm trong localStorage (giữ trong module variable `tokenStore` + cookie refresh_token) → script phải đăng nhập qua UI như `test_admin_manage.py` (dùng `login(page, ...)` pattern), không dùng `add_init_script` với localStorage. Đã áp dụng trong code trên.