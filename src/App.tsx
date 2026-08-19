import { Route, Routes } from 'react-router-dom'
import { RequireAuth, RequirePasswordChange, RequireRole, PublicOnly, RootRedirect } from './lib/auth/guards'
import { AuthLayout } from './layouts/AuthLayout'
import { StudentLayout } from './layouts/StudentLayout'
import { TeacherLayout } from './layouts/TeacherLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage'
import { StudentDashboardPage } from './pages/student/StudentDashboardPage'
import { TeacherDashboardPage } from './pages/teacher/TeacherDashboardPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { CreateTeacherPage } from './pages/admin/CreateTeacherPage'
import { TeacherProfilePage } from './pages/teacher/TeacherProfilePage'
import { TeacherListPage } from './pages/student/TeacherListPage'
import { TeacherDetailPage } from './pages/student/TeacherDetailPage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route element={<RequirePasswordChange />}>
          <Route element={<RequireRole role="STUDENT" />}>
            <Route element={<StudentLayout />}>
              <Route path="/student" element={<StudentDashboardPage />} />
              <Route path="/student/teachers" element={<TeacherListPage />} />
              <Route path="/student/teachers/:id" element={<TeacherDetailPage />} />
            </Route>
          </Route>
          <Route element={<RequireRole role="TEACHER" />}>
            <Route element={<TeacherLayout />}>
              <Route path="/teacher" element={<TeacherDashboardPage />} />
              <Route path="/teacher/profile" element={<TeacherProfilePage />} />
            </Route>
          </Route>
          <Route element={<RequireRole role="ADMIN" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/teachers/new" element={<CreateTeacherPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
