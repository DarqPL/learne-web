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
import { TeacherCourseBuilderPage } from './pages/teacher/content/TeacherCourseBuilderPage'
import { TeacherContentPage } from './pages/teacher/content/TeacherContentPage'
import { TeacherLessonWorkspacePage } from './pages/teacher/content/TeacherLessonWorkspacePage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { CreateTeacherPage } from './pages/admin/CreateTeacherPage'
import { AdminTeacherListPage } from './pages/admin/AdminTeacherListPage'
import { AdminContentReviewPage } from './pages/admin/review/AdminContentReviewPage'
import { TeacherProfilePage } from './pages/teacher/TeacherProfilePage'
import { TeacherListPage } from './pages/student/TeacherListPage'
import { TeacherDetailPage } from './pages/student/TeacherDetailPage'
import { StudentCourseListPage } from './pages/student/learning/StudentCourseListPage'
import { StudentCourseDetailPage } from './pages/student/learning/StudentCourseDetailPage'
import { StudentEnrollmentsPage } from './pages/student/learning/StudentEnrollmentsPage'
import { StudentLearningPathPage } from './pages/student/learning/StudentLearningPathPage'
import { StudentPlacementTestPage } from './pages/student/learning/StudentPlacementTestPage'
import { StudentCourseRecommendationsPage } from './pages/student/learning/StudentCourseRecommendationsPage'
import { StudentGrammarCheckPage } from './pages/student/learning/StudentGrammarCheckPage'
import { StudentEnrollmentProgressPage } from './pages/student/learning/StudentEnrollmentProgressPage'
import { StudentLessonDetailPage } from './pages/student/learning/StudentLessonDetailPage'
import { StudentLessonQuizPage } from './pages/student/learning/StudentLessonQuizPage'
import { StudentQuizResultPage } from './pages/student/learning/StudentQuizResultPage'
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
              <Route path="/student/learning-path" element={<StudentLearningPathPage />} />
              <Route path="/student/placement-test" element={<StudentPlacementTestPage />} />
              <Route path="/student/course-recommendations" element={<StudentCourseRecommendationsPage />} />
              <Route path="/student/grammar-check" element={<StudentGrammarCheckPage />} />
              <Route path="/student/teachers" element={<TeacherListPage />} />
              <Route path="/student/teachers/:id" element={<TeacherDetailPage />} />
              <Route path="/student/courses" element={<StudentCourseListPage />} />
              <Route path="/student/courses/:id" element={<StudentCourseDetailPage />} />
              <Route path="/student/enrollments" element={<StudentEnrollmentsPage />} />
              <Route path="/student/enrollments/:id" element={<StudentEnrollmentProgressPage />} />
              <Route path="/student/enrollments/:enrollmentId/lessons/:lessonId" element={<StudentLessonDetailPage />} />
              <Route path="/student/enrollments/:enrollmentId/lessons/:lessonId/quiz" element={<StudentLessonQuizPage />} />
              <Route path="/student/quiz-attempts/:attemptId" element={<StudentQuizResultPage />} />
            </Route>
          </Route>
          <Route element={<RequireRole role="TEACHER" />}>
            <Route element={<TeacherLayout />}>
              <Route path="/teacher" element={<TeacherDashboardPage />} />
              <Route path="/teacher/content" element={<TeacherContentPage />} />
              <Route path="/teacher/content/courses/:courseId" element={<TeacherCourseBuilderPage />} />
              <Route path="/teacher/content/courses/:courseId/lessons/:lessonId" element={<TeacherLessonWorkspacePage />} />
              <Route path="/teacher/profile" element={<TeacherProfilePage />} />
            </Route>
          </Route>
          <Route element={<RequireRole role="ADMIN" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/teachers/new" element={<CreateTeacherPage />} />
              <Route path="/admin/teachers" element={<AdminTeacherListPage />} />
              <Route path="/admin/reviews" element={<AdminContentReviewPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
