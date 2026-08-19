# Admin Teacher Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng màn hình quản lý giảng viên phía Admin: danh sách giảng viên (bảng) với trạng thái tài khoản/hồ sơ và nút Khóa/Mở khóa, hoàn thiện task Phase 3 còn lại.

**Architecture:** Backend thêm endpoint `GET /api/admin/teachers` (DTO `AdminTeacherResponse`) tái sử dụng 2 endpoint lock/unlock đã có. Frontend thêm `adminApi.ts`, type `AdminTeacher`, trang `/admin/teachers` dạng bảng theo convention hiện có (in-effect async IIFE + cờ `cancelled`, `Alert`, `Spinner`, badge pill inline, `window.confirm`).

**Tech Stack:** Backend: Spring Boot 4, Java 21, JPA/Hibernate, JUnit 6 + MockMvc (test profile H2). Frontend: React 19, Vite 8, TypeScript ~6.0, Tailwind v4, axios. Test thủ công: Playwright + Docker Compose dev (`infra/docker-compose.dev.yml`).

---

## File Structure

**Backend (`C:\baobao\KLTN\learne-platform\backend`, nhánh `feature/admin-teacher-management`):**
- Modify: `src/main/java/com/learne/backend/domain/auth/UserRepository.java` — thêm `findByRoleOrderByCreatedAtAsc`
- Create: `src/main/java/com/learne/backend/admin/user/AdminTeacherResponse.java` — DTO
- Modify: `src/main/java/com/learne/backend/admin/user/AdminUserService.java` — thêm `listTeachers()`
- Modify: `src/main/java/com/learne/backend/admin/user/AdminUserController.java` — thêm `GET /teachers`
- Test: `src/test/java/com/learne/backend/admin/user/AdminUserApiTests.java` — thêm test

**Frontend (`C:\baobao\KLTN\learne-platform\frontend`, nhánh `feature/admin-teacher-management`):**
- Modify: `src/lib/api/types.ts` — thêm `AdminTeacher`
- Create: `src/lib/api/adminApi.ts` — 3 hàm
- Create: `src/pages/admin/AdminTeacherListPage.tsx` — trang bảng
- Modify: `src/App.tsx` — route `/admin/teachers`
- Modify: `src/lib/auth/routes.ts` — nav ADMIN

**Docs (submodule `docs`):**
- Modify: `Docs_Capstone/Project_Plan_Trello_Kanban.md` — đánh dấu task hoàn thành

**Test script (ngoài repo, `C:\Users\Admin\AppData\Local\Temp\opencode\`):**
- Create: `test_admin_manage.py` — Playwright test thủ công

---

## QUAN TRỌNG — Quy ước môi trường

- Shell trên máy này là PowerShell-like: `&&` FAILS. Phải dùng `cmd1; if ($?) { cmd2 }`.
- Frontend: `npm` bị chặn bởi execution policy → dùng `npm.cmd`.
- Backend: `.\mvnw.cmd` từ thư mục backend submodule (Windows).
- **Line ending:** repo dùng LF, `core.autocrlf=false`. Công cụ edit có thể chèn CRLF → SAU mỗi edit, chạy lệnh kiểm tra: đếm CRLF phải = 0, BOM phải false (xem bước verify mẫu bên dưới). Nếu file bị CRLF, fix bằng PowerShell `WriteAllText` UTF8 no-BOM trước khi commit.
- **Lint rule frontend:** `react-hooks/set-state-in-effect` là error-level. KHÔNG gọi setState đồng bộ trong thân effect. Fetch khi mount phải dùng in-effect async IIFE + cờ `cancelled`. KHÔNG dùng eslint-disable.
- **TS:** `verbatimModuleSyntax` (dùng `import type` cho type-only), `erasableSyntaxOnly` (không dùng enum), `noUnusedLocals`.
- Backend test dùng Spring Boot `@SpringBootTest` + H2 (profile `test`), `@BeforeEach` xóa dữ liệu.

### Bước verify line ending (chạy sau mỗi lần edit backend/frontend)

```powershell
$b = [System.IO.File]::ReadAllBytes("PATH_TO_FILE"); $s = [System.Text.Encoding]::UTF8.GetString($b); "BOM=$($b[0] -eq 0xEF) CRLF=$(([regex]::Matches($s, "`r`n")).Count)"
```
Expected: `BOM=False CRLF=0`

---

### Task 1: Backend — Repository method + DTO

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\backend\src\main\java\com\learne\backend\domain\auth\UserRepository.java`
- Create: `C:\baobao\KLTN\learne-platform\backend\src\main\java\com\learne\backend\admin\user\AdminTeacherResponse.java`

- [ ] **Step 1: Thêm method vào `UserRepository`**

Sửa `src/main/java/com/learne/backend/domain/auth/UserRepository.java` thành nội dung:

```java
package com.learne.backend.domain.auth;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    List<User> findByRoleOrderByCreatedAtAsc(UserRole role);
}
```

- [ ] **Step 2: Tạo DTO `AdminTeacherResponse`**

Tạo file `src/main/java/com/learne/backend/admin/user/AdminTeacherResponse.java`:

```java
package com.learne.backend.admin.user;

import com.learne.backend.domain.auth.User;
import com.learne.backend.teacher.profile.TeacherProfile;
import com.learne.backend.teacher.profile.TeacherProfileStatus;

public record AdminTeacherResponse(
        Long userId,
        String fullName,
        String email,
        boolean locked,
        boolean mustChangePassword,
        TeacherProfileStatus profileStatus,
        boolean completed) {

    public static AdminTeacherResponse from(User user, TeacherProfile profile) {
        return new AdminTeacherResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.isLocked(),
                user.isMustChangePassword(),
                profile != null ? profile.getStatus() : null,
                profile != null && !profile.getBio().isBlank() && !profile.getExpertise().isBlank());
    }
}
```

- [ ] **Step 3: Verify line ending**

```powershell
$b = [System.IO.File]::ReadAllBytes("C:\baobao\KLTN\learne-platform\backend\src\main\java\com\learne\backend\domain\auth\UserRepository.java"); $s = [System.Text.Encoding]::UTF8.GetString($b); "BOM=$($b[0] -eq 0xEF) CRLF=$(([regex]::Matches($s, "`r`n")).Count)"
```
Expected: `BOM=False CRLF=0`. Làm tương tự cho `AdminTeacherResponse.java`.

- [ ] **Step 4: Commit**

```bash
git add src/main/java/com/learne/backend/domain/auth/UserRepository.java src/main/java/com/learne/backend/admin/user/AdminTeacherResponse.java
git commit -m "feat: add repository query and admin teacher response DTO"
```

---

### Task 2: Backend — Service + Controller endpoint

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\backend\src\main\java\com\learne\backend\admin\user\AdminUserService.java`
- Modify: `C:\baobao\KLTN\learne-platform\backend\src\main\java\com\learne\backend\admin\user\AdminUserController.java`

- [ ] **Step 1: Thêm `listTeachers()` vào `AdminUserService`**

Trong `AdminUserService.java`:
- Thêm import: `com.learne.backend.teacher.profile.TeacherProfile`, `com.learne.backend.teacher.profile.TeacherProfileRepository`, `java.util.List`.
- Thêm field `private final TeacherProfileRepository teacherProfileRepository;` và tham số tương ứng vào constructor (sau `userRepository`).
- Thêm method:

```java
    @Transactional(readOnly = true)
    List<AdminTeacherResponse> listTeachers() {
        return userRepository.findByRoleOrderByCreatedAtAsc(UserRole.TEACHER)
                .stream()
                .map(user -> AdminTeacherResponse.from(user, teacherProfileRepository.findByUser(user).orElse(null)))
                .toList();
    }
```

- [ ] **Step 2: Thêm endpoint vào `AdminUserController`**

Trong `AdminUserController.java`:
- Thêm imports: `org.springframework.web.bind.annotation.GetMapping`, `java.util.List`.
- Thêm method:

```java
    @GetMapping("/teachers")
    List<AdminTeacherResponse> listTeachers() {
        return adminUserService.listTeachers();
    }
```

- [ ] **Step 3: Verify line ending + compile**

```powershell
$b = [System.IO.File]::ReadAllBytes("C:\baobao\KLTN\learne-platform\backend\src\main\java\com\learne\backend\admin\user\AdminUserService.java"); $s = [System.Text.Encoding]::UTF8.GetString($b); "BOM=$($b[0] -eq 0xEF) CRLF=$(([regex]::Matches($s, "`r`n")).Count)"
```
Expected: `BOM=False CRLF=0`. Làm tương tự cho `AdminUserController.java`. Sau đó chạy:

```powershell
.\mvnw.cmd compile
```
Expected: BUILD SUCCESS (compile chưa có test mới vẫn pass).

- [ ] **Step 4: Commit**

```bash
git add src/main/java/com/learne/backend/admin/user/AdminUserService.java src/main/java/com/learne/backend/admin/user/AdminUserController.java
git commit -m "feat: add admin teacher list endpoint"
```

---

### Task 3: Backend — Tests (TDD)

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\backend\src\test\java\com\learne\backend\admin\user\AdminUserApiTests.java`

- [ ] **Step 1: Thêm `TeacherProfileRepository` vào test class**

Trong `AdminUserApiTests.java`:
- Thêm import: `com.learne.backend.teacher.profile.TeacherProfile`, `com.learne.backend.teacher.profile.TeacherProfileRepository`.
- Thêm field:

```java
    @Autowired
    private TeacherProfileRepository teacherProfileRepository;
```

- Trong `@BeforeEach setUp()`, thêm `teacherProfileRepository.deleteAll();` TRƯỚC `userRepository.deleteAll();` (FK constraint).

- [ ] **Step 2: Thêm import static `get`**

Sửa import static:

```java
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
```

- [ ] **Step 3: Thêm test method `listTeachersRequiresAdminRole`**

```java
    @Test
    void listTeachersRequiresAdminRole() throws Exception {
        User student = saveUser("student@example.com", "Password123", UserRole.STUDENT);

        mockMvc.perform(get("/api/admin/teachers"))
                .andExpect(status().isUnauthorized());

        String studentToken = loginAndGetAccessToken("student@example.com", "Password123");

        mockMvc.perform(get("/api/admin/teachers")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }
```

- [ ] **Step 4: Thêm test method `adminCanListTeachersWithProfileStatus`**

```java
    @Test
    void adminCanListTeachersWithProfileStatus() throws Exception {
        saveUser("admin@example.com", "Password123", UserRole.ADMIN);
        User teacherWithProfile = saveUser("teacher-a@example.com", "Password123", UserRole.TEACHER);
        User teacherWithoutProfile = saveUser("teacher-b@example.com", "Password123", UserRole.TEACHER);
        User lockedTeacher = saveLockedUser("teacher-c@example.com", "Password123", UserRole.TEACHER);
        saveUser("student@example.com", "Password123", UserRole.STUDENT);

        TeacherProfile profile = new TeacherProfile();
        profile.setUser(teacherWithProfile);
        profile.setBio("Giang vien tieng Anh giao tiep");
        profile.setExpertise("Communication, Grammar");
        profile.setYearsOfExperience(3);
        teacherProfileRepository.save(profile);

        String adminToken = loginAndGetAccessToken("admin@example.com", "Password123");

        mockMvc.perform(get("/api/admin/teachers")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[?(@.userId == %d)].fullName".formatted(teacherWithProfile.getId())).value("TEACHER User"))
                .andExpect(jsonPath("$[?(@.userId == %d)].locked".formatted(teacherWithProfile.getId())).value(false))
                .andExpect(jsonPath("$[?(@.userId == %d)].mustChangePassword".formatted(teacherWithProfile.getId())).value(false))
                .andExpect(jsonPath("$[?(@.userId == %d)].profileStatus".formatted(teacherWithProfile.getId())).value("ACTIVE"))
                .andExpect(jsonPath("$[?(@.userId == %d)].completed".formatted(teacherWithProfile.getId())).value(true))
                .andExpect(jsonPath("$[?(@.userId == %d)].profileStatus".formatted(teacherWithoutProfile.getId())).value((Object) null))
                .andExpect(jsonPath("$[?(@.userId == %d)].completed".formatted(teacherWithoutProfile.getId())).value(false))
                .andExpect(jsonPath("$[?(@.userId == %d)].locked".formatted(lockedTeacher.getId())).value(true));
    }
```

- [ ] **Step 5: Chạy test mới**

```powershell
.\mvnw.cmd test -Dtest=AdminUserApiTests
```
Expected: `Tests run: 12, Failures: 0, Errors: 0, Skipped: 0` (9 cũ + 2 mới + 1 lockUserRequiresAdminRole tồn tại sẵn... đếm lại theo test thực tế — yêu cầu: tất cả PASS). Nếu test fail → sửa implementation ở Task 2 rồi chạy lại.

- [ ] **Step 6: Chạy full backend test suite**

```powershell
.\mvnw.cmd test
```
Expected: `Tests run: 55, Failures: 0, Errors: 0, Skipped: 0` (53 + 2 mới).

- [ ] **Step 7: Commit**

```bash
git add src/test/java/com/learne/backend/admin/user/AdminUserApiTests.java
git commit -m "test: add admin teacher list endpoint tests"
```

---

### Task 4: Frontend — Types + adminApi

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\lib\api\types.ts`
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\lib\api\adminApi.ts`

- [ ] **Step 1: Thêm type `AdminTeacher` vào `types.ts`**

Thêm vào cuối `src/lib/api/types.ts`:

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

- [ ] **Step 2: Tạo `adminApi.ts`**

Tạo `src/lib/api/adminApi.ts`:

```ts
import { http } from './client'
import type { AdminTeacher, ApiMessageResponse } from './types'

export function adminListTeachers() {
  return http.get<AdminTeacher[]>('/api/admin/teachers')
}

export function adminLockTeacher(userId: number) {
  return http.post<ApiMessageResponse>(`/api/admin/users/${userId}/lock`)
}

export function adminUnlockTeacher(userId: number) {
  return http.post<ApiMessageResponse>(`/api/admin/users/${userId}/unlock`)
}
```

- [ ] **Step 3: Verify line ending**

```powershell
$b = [System.IO.File]::ReadAllBytes("C:\baobao\KLTN\learne-platform\frontend\src\lib\api\types.ts"); $s = [System.Text.Encoding]::UTF8.GetString($b); "BOM=$($b[0] -eq 0xEF) CRLF=$(([regex]::Matches($s, "`r`n")).Count)"
```
Expected: `BOM=False CRLF=0`. Làm tương tự cho `adminApi.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/types.ts src/lib/api/adminApi.ts
git commit -m "feat: add admin teacher api functions"
```

---

### Task 5: Frontend — AdminTeacherListPage

**Files:**
- Create: `C:\baobao\KLTN\learne-platform\frontend\src\pages\admin\AdminTeacherListPage.tsx`

- [ ] **Step 1: Tạo file trang**

Tạo `src/pages/admin/AdminTeacherListPage.tsx` với nội dung:

```tsx
import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../lib/api/client'
import { adminListTeachers, adminLockTeacher, adminUnlockTeacher } from '../../lib/api/adminApi'
import type { AdminTeacher } from '../../lib/api/types'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'

type AccountStatus = 'locked' | 'mustChange' | 'active'

const accountStatusOf = (teacher: AdminTeacher): AccountStatus => {
  if (teacher.locked) return 'locked'
  if (teacher.mustChangePassword) return 'mustChange'
  return 'active'
}

const accountStatusLabels: Record<AccountStatus, string> = {
  locked: 'Bị khóa',
  mustChange: 'Chưa đổi mật khẩu',
  active: 'Đang hoạt động',
}

const accountStatusStyles: Record<AccountStatus, string> = {
  locked: 'bg-red-100 text-red-700',
  mustChange: 'bg-amber-100 text-amber-800',
  active: 'bg-green-100 text-green-800',
}

const profileStatusLabels: Record<NonNullable<AdminTeacher['profileStatus']>, string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Ngừng hoạt động',
  SUSPENDED: 'Bị khóa',
}

const profileStatusStyles: Record<NonNullable<AdminTeacher['profileStatus']>, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-700',
  SUSPENDED: 'bg-red-100 text-red-700',
}

export function AdminTeacherListPage() {
  const [teachers, setTeachers] = useState<AdminTeacher[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [actionUserId, setActionUserId] = useState<number | null>(null)

  const load = async () => {
    try {
      const response = await adminListTeachers()
      setTeachers(response.data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải danh sách giảng viên.'))
    }
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await adminListTeachers()
        if (!cancelled) setTeachers(response.data)
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Không thể tải danh sách giảng viên.'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleToggleLock = async (teacher: AdminTeacher) => {
    const confirmed = window.confirm(
      teacher.locked
        ? `Bạn có chắc muốn mở khóa tài khoản ${teacher.fullName} (${teacher.email})?`
        : `Bạn có chắc muốn khóa tài khoản ${teacher.fullName} (${teacher.email})?`,
    )
    if (!confirmed) return
    setActionUserId(teacher.userId)
    setInfo(null)
    setError(null)
    try {
      if (teacher.locked) {
        await adminUnlockTeacher(teacher.userId)
      } else {
        await adminLockTeacher(teacher.userId)
      }
      setInfo(teacher.locked ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật trạng thái tài khoản.'))
    } finally {
      setActionUserId(null)
    }
  }

  if (error) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Quản lý giảng viên</h1>
        <Alert>{error}</Alert>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Quản lý giảng viên</h1>
      {info ? (
        <div className="mb-4">
          <Alert variant="success">{info}</Alert>
        </div>
      ) : null}
      {teachers === null ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : teachers.length === 0 ? (
        <p className="text-gray-600">Chưa có giảng viên nào.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                {['Họ và tên', 'Email', 'Trạng thái tài khoản', 'Trạng thái hồ sơ', 'Hồ sơ công khai', 'Thao tác'].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teachers.map((teacher) => {
                const accountStatus = accountStatusOf(teacher)
                return (
                  <tr key={teacher.userId} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{teacher.fullName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{teacher.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${accountStatusStyles[accountStatus]}`}>
                        {accountStatusLabels[accountStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {teacher.profileStatus ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${profileStatusStyles[teacher.profileStatus]}`}
                        >
                          {profileStatusLabels[teacher.profileStatus]}
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Chưa tạo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          teacher.completed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {teacher.completed ? 'Công khai' : 'Chưa hoàn tất'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant={teacher.locked ? 'secondary' : 'danger'}
                        loading={actionUserId === teacher.userId}
                        disabled={actionUserId !== null && actionUserId !== teacher.userId}
                        onClick={() => handleToggleLock(teacher)}
                      >
                        {teacher.locked ? 'Mở khóa' : 'Khóa'}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify line ending**

```powershell
$b = [System.IO.File]::ReadAllBytes("C:\baobao\KLTN\learne-platform\frontend\src\pages\admin\AdminTeacherListPage.tsx"); $s = [System.Text.Encoding]::UTF8.GetString($b); "BOM=$($b[0] -eq 0xEF) CRLF=$(([regex]::Matches($s, "`r`n")).Count)"
```
Expected: `BOM=False CRLF=0`.

- [ ] **Step 3: Lint + build**

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```
Expected: ESLint 0 error; `tsc -b && vite build` thành công.

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/AdminTeacherListPage.tsx
git commit -m "feat: add admin teacher list page with lock and unlock actions"
```

---

### Task 6: Frontend — Route + Nav

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\App.tsx`
- Modify: `C:\baobao\KLTN\learne-platform\frontend\src\lib\auth\routes.ts`

- [ ] **Step 1: Thêm route vào `App.tsx`**

- Thêm import: `import { AdminTeacherListPage } from './pages/admin/AdminTeacherListPage'`
- Trong khối `RequireRole role="ADMIN"`, thêm dòng sau route `/admin/teachers/new`:

```tsx
<Route path="/admin/teachers" element={<AdminTeacherListPage />} />
```

- [ ] **Step 2: Thêm nav item vào `routes.ts`**

Trong `navItemsFor`, case `ADMIN`, thêm item sau `Tạo giảng viên`:

```ts
{ label: 'Quản lý giảng viên', to: '/admin/teachers' },
```

- [ ] **Step 3: Lint + build**

```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```
Expected: ESLint 0 error; build thành công.

- [ ] **Step 4: Verify line ending + commit**

```powershell
$b = [System.IO.File]::ReadAllBytes("C:\baobao\KLTN\learne-platform\frontend\src\App.tsx"); $s = [System.Text.Encoding]::UTF8.GetString($b); "BOM=$($b[0] -eq 0xEF) CRLF=$(([regex]::Matches($s, "`r`n")).Count)"
```
Expected: `BOM=False CRLF=0` (cho cả 2 file). Commit:

```bash
git add src/App.tsx src/lib/auth/routes.ts
git commit -m "feat: add admin teacher management route and nav item"
```

---

### Task 7: Backend + Frontend — Push nhánh và chuẩn bị môi trường

**Files:** không có (git operations + docker)

- [ ] **Step 1: Commit toàn bộ thay đổi chưa commit ở cả 2 submodule**

```bash
git status --short
```
Nếu còn file thay đổi chưa commit (trừ file ngoài scope), commit chúng với message phù hợp.

- [ ] **Step 2: Khởi động Docker stack dev**

```powershell
docker compose -f infra/docker-compose.dev.yml up -d --build
```
(workdir: `C:\baobao\KLTN\learne-platform\infra`)
Expected: frontend 5173, backend 8080, mailpit 8025, postgres lên.

- [ ] **Step 3: Chờ backend/frontend sẵn sàng**

```powershell
Start-Sleep -Seconds 30
Invoke-WebRequest -Uri http://localhost:5173 -UseBasicParsing | Select-Object StatusCode
```
Expected: 200. Nếu backend chưa sẵn sàng (vì backend submodule chưa build image mới), kiểm tra log:

```powershell
docker compose -f infra/docker-compose.dev.yml logs backend --tail 30
```
Nếu backend image không có code mới → build lại image backend trong `infra` hoặc báo lại controller (backend thay đổi cần rebuild Docker image).

---

### Task 8: Kiểm thử thủ công Playwright

**Files:**
- Create: `C:\Users\Admin\AppData\Local\Temp\opencode\test_admin_manage.py`

- [ ] **Step 1: Tạo script Playwright**

Tạo `C:\Users\Admin\AppData\Local\Temp\opencode\test_admin_manage.py`:

```python
import re
import time
import requests
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173"
MAILPIT = "http://localhost:8025"
ADMIN_EMAIL = "admin@learne.local"
ADMIN_PASSWORD = "Admin123"
STUDENT_EMAIL = "student@learne.local"
STUDENT_PASSWORD = "Student123"

def mailpit_messages():
    r = requests.get(f"{MAILPIT}/api/v1/messages")
    return r.json()["messages"]

def latest_mail_text():
    mails = mailpit_messages()
    assert mails, "no emails in mailpit"
    return mails[0]["Snippet"]

def login(page, email, password):
    page.goto(f"{BASE}/login")
    page.get_by_label("Email").fill(email)
    page.get_by_label("Mật khẩu").fill(password)
    page.get_by_role("button", name="Đăng nhập").click()
    page.wait_for_url(lambda u: "/login" not in u)

def logout(page):
    page.get_by_role("button", name="Đăng xuất").click()

def create_teacher_via_admin(page, full_name, email):
    page.goto(f"{BASE}/admin/teachers/new")
    page.get_by_label("Họ và tên").fill(full_name)
    page.get_by_label("Email").fill(email)
    page.get_by_role("button", name="Tạo tài khoản").click()
    page.get_by_text("Đã tạo tài khoản giảng viên").wait_for()

def main():
    suffix = str(int(time.time()))
    t1_email = f"teacher1_{suffix}@learne.local"
    t2_email = f"teacher2_{suffix}@learne.local"
    t1_name = "Giang Vien Mot"
    t2_name = "Giang Vien Hai"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        login(page, ADMIN_EMAIL, ADMIN_PASSWORD)

        create_teacher_via_admin(page, t1_name, t1_email)
        create_teacher_via_admin(page, t2_name, t2_email)

        page.goto(f"{BASE}/admin/teachers")
        page.get_by_text(t1_name).wait_for()
        page.get_by_text(t2_name).wait_for()
        print("PASS - danh sach hien thi 2 giang vien")

        row1 = page.locator("tr", has_text=t1_email)
        row1.get_by_role("button", name="Khóa").click()
        page.on("dialog", lambda d: d.accept())
        page.get_by_text("Đã khóa tài khoản").wait_for()
        row1.get_by_text("Bị khóa").wait_for()
        print("PASS - khóa giảng viên 1, badge Bị khóa")

        page.goto(f"{BASE}/admin/teachers")
        page.get_by_text(t2_name).wait_for()
        row1 = page.locator("tr", has_text=t1_email)
        row1.get_by_role("button", name="Mở khóa").click()
        page.on("dialog", lambda d: d.accept())
        page.get_by_text("Đã mở khóa tài khoản").wait_for()
        row1.get_by_text("Đang hoạt động").wait_for()
        print("PASS - mở khóa giảng viên 1")

        logout(page)
        login(page, STUDENT_EMAIL, STUDENT_PASSWORD)
        page.goto(f"{BASE}/student/teachers")
        page.get_by_text(t2_name).wait_for()
        print("PASS - giảng viên 2 trong danh sách học viên")

        page.goto(f"{BASE}/admin/teachers")
        page.get_by_text("Quản lý giảng viên").wait_for()
        print("PASS - admin truy cap duoc trang quan ly")

        browser.close()
    print("===== ALL PASSED =====")

if __name__ == "__main__":
    main()
```

LƯU Ý: `page.on("dialog", ...)` phải được đăng ký TRƯỚC khi bấm nút gây ra `window.confirm` — nếu cần, đăng ký dialog handler ngay sau khi mở browser:
```python
page.on("dialog", lambda d: d.accept())
```

- [ ] **Step 2: Kiểm tra Playwright + requests đã cài**

```powershell
python -c "import playwright, requests; print('ok')"
```
Nếu thiếu: `pip install playwright requests; python -m playwright install chromium`.

- [ ] **Step 3: Chạy test**

```powershell
python test_admin_manage.py
```
(workdir: `C:\Users\Admin\AppData\Local\Temp\opencode`)
Expected: tất cả `PASS` + `===== ALL PASSED =====`.

LƯU Ý: cần 1 tài khoản Student seed sẵn (`student@learne.local` / `Student123`) — nếu chưa có, tạo qua UI đăng ký hoặc báo controller. Nếu dialog handler không nhận được sự kiện (Playwright default block), thêm `page.on("dialog", lambda d: d.accept())` ngay sau `browser.new_page()`.

- [ ] **Step 4: Nếu test fail do `window.confirm` bị chặn**

Thay `window.confirm` trong `AdminTeacherListPage.tsx` bằng state xác nhận nội bộ nếu Playwright không accept được dialog. Verify lại lint + build sau khi sửa.

---

### Task 9: Cập nhật Docs (Kanban)

**Files:**
- Modify: `C:\baobao\KLTN\learne-platform\docs\Docs_Capstone\Project_Plan_Trello_Kanban.md`

- [ ] **Step 1: Cập nhật mục Phase 3 trong Kanban**

Trong `Docs_Capstone/Project_Plan_Trello_Kanban.md`, phần "Cập Nhật Tiến Độ Phase 3":
- Thêm vào **Đã Hoàn Thành**:

```markdown
- Đã xây dựng màn hình Admin quản lý giảng viên tại `/admin/teachers` (`frontend/src/pages/admin/AdminTeacherListPage.tsx`): bảng danh sách giảng viên với trạng thái tài khoản (Đang hoạt động/Bị khóa/Chưa đổi mật khẩu), trạng thái hồ sơ (ACTIVE/INACTIVE/SUSPENDED/Chưa tạo), trạng thái công khai hồ sơ và nút Khóa/Mở khóa tài khoản.
- Đã thêm endpoint backend `GET /api/admin/teachers` (`AdminTeacherController`/`AdminUserController`) trả `AdminTeacherResponse` (userId, fullName, email, locked, mustChangePassword, profileStatus, completed); tái sử dụng `POST /api/admin/users/{userId}/lock|unlock` đã có.
- Đã thêm nav item "Quản lý giảng viên" cho ADMIN và route `/admin/teachers` trong `frontend/src/lib/auth/routes.ts` và `frontend/src/App.tsx`.
```

- Thêm vào **Đã Kiểm Tra**:

```markdown
- `.\mvnw.cmd test` chạy thành công toàn bộ backend test suite với kết quả `Tests run: 55, Failures: 0, Errors: 0, Skipped: 0` (gồm test mới cho `GET /api/admin/teachers`: yêu cầu ADMIN, trả đúng danh sách TEACHER kèm profileStatus/completed, giảng viên chưa có hồ sơ → profileStatus null).
- `npm run lint` chạy sạch, `npm run build` thành công.
- Đã chạy test thủ công Playwright trên Docker Compose development: tạo 2 giảng viên, hiển thị đúng trong bảng quản lý, khóa → badge "Bị khóa", mở khóa → "Đang hoạt động", giảng viên đang hoạt động xuất hiện trong danh sách học viên.
```

- Cập nhật **Đang Làm Tiếp Theo**: xóa dòng "Tiếp tục phần UI còn lại của Phase 3 cho màn hình quản lý tài khoản giảng viên phía Admin..." (đã hoàn thành), giữ dòng còn lại nếu phù hợp.

- [ ] **Step 2: Verify line ending + commit + push docs**

```powershell
$b = [System.IO.File]::ReadAllBytes("C:\baobao\KLTN\learne-platform\docs\Docs_Capstone\Project_Plan_Trello_Kanban.md"); $s = [System.Text.Encoding]::UTF8.GetString($b); "BOM=$($b[0] -eq 0xEF) CRLF=$(([regex]::Matches($s, "`r`n")).Count)"
```
Expected: `BOM=False CRLF>0` (file docs dùng CRLF — giữ nguyên quy ước file này). Commit trong docs submodule:

```bash
git add Docs_Capstone/Project_Plan_Trello_Kanban.md
git commit -m "docs: mark admin teacher management phase 3 task complete"
git push origin main
```

---

### Task 10: Kết thúc — Review toàn bộ + hoàn tất branch

**Files:** không có (git operations)

- [ ] **Step 1: Chạy lại toàn bộ kiểm tra cuối**

Backend:
```powershell
.\mvnw.cmd test
```
Frontend:
```powershell
npm.cmd run lint; if ($?) { npm.cmd run build }
```
Test thủ công:
```powershell
python test_admin_manage.py
```
(workdir: `C:\Users\Admin\AppData\Local\Temp\opencode`)
Tất cả phải PASS.

- [ ] **Step 2: Review toàn bộ diff**

```bash
git -C C:\baobao\KLTN\learne-platform\frontend log --oneline main..HEAD
git -C C:\baobao\KLTN\learne-platform\backend log --oneline main..HEAD
```
Xác nhận chỉ gồm các commit của feature này.

- [ ] **Step 3: Push cả 2 nhánh submodule**

```bash
git -C C:\baobao\KLTN\learne-platform\frontend push -u origin feature/admin-teacher-management
git -C C:\baobao\KLTN\learne-platform\backend push -u origin feature/admin-teacher-management
```

- [ ] **Step 4: Báo user tạo PR trên GitHub**

Trình bày: 2 PR cần tạo (backend + frontend), tiêu đề gợi ý `feat: admin teacher management`, test summary (backend 55/55, lint/build pass, Playwright pass), và nhắc: sau khi merge, GitHub Actions bot sẽ tự cập nhật pointer superproject như lần trước.

---

## Self-Review Notes (cho người viết plan — KHÔNG phải task)

- **Spec coverage:** mọi mục trong spec (endpoint GET, DTO, frontend table 6 cột, badge pill, window.confirm, route, nav, test backend, Playwright, docs) đều có task tương ứng: Task 1-2 (backend), Task 3 (test), Task 4-6 (frontend), Task 8 (Playwright), Task 9 (docs).
- **Type consistency:** `AdminTeacherResponse` (Java) ↔ `AdminTeacher` (TS) cùng 7 field. `adminListTeachers()` trả `AdminTeacher[]`. `adminLockTeacher`/`adminUnlockTeacher` nhận `userId` (đúng — endpoint lock/unlock nhận userId, không phải teacherId).
- **YAGNI:** không phân trang, không tìm kiếm, không trang chi tiết Admin, không component Modal mới.
- **Lưu ý thực thi:** có thể backend container Docker cần rebuild để lấy endpoint mới; nếu test thủ công fail vì điều này, build lại image backend. Playwright `page.on("dialog")` phải đăng ký trước khi bấm nút. Student seed `student@learne.local` cần tồn tại.