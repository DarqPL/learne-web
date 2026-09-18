import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { RequireAuth, RequirePasswordChange, RequireRole, PublicOnly, RootRedirect } from './lib/auth/guards'
import { AuthLayout } from './layouts/AuthLayout'
import { StudentLayout } from './layouts/StudentLayout'
import { TeacherLayout } from './layouts/TeacherLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { Spinner } from './components/ui/Spinner'

const LoginPage = lazy(() => import('./pages/auth/LoginPage').then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then((module) => ({ default: module.RegisterPage })))
const ForgotPasswordPage = lazy(() =>
  import('./pages/auth/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage })),
)
const ResetPasswordPage = lazy(() =>
  import('./pages/auth/ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage })),
)
const ChangePasswordPage = lazy(() =>
  import('./pages/auth/ChangePasswordPage').then((module) => ({ default: module.ChangePasswordPage })),
)
const StudentDashboardPage = lazy(() =>
  import('./pages/student/StudentDashboardPage').then((module) => ({ default: module.StudentDashboardPage })),
)
const TeacherDashboardPage = lazy(() =>
  import('./pages/teacher/TeacherDashboardPage').then((module) => ({ default: module.TeacherDashboardPage })),
)
const TeacherCourseBuilderPage = lazy(() =>
  import('./pages/teacher/content/TeacherCourseBuilderPage').then((module) => ({
    default: module.TeacherCourseBuilderPage,
  })),
)
const TeacherContentPage = lazy(() =>
  import('./pages/teacher/content/TeacherContentPage').then((module) => ({ default: module.TeacherContentPage })),
)
const TeacherLessonWorkspacePage = lazy(() =>
  import('./pages/teacher/content/TeacherLessonWorkspacePage').then((module) => ({
    default: module.TeacherLessonWorkspacePage,
  })),
)
const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })),
)
const AdminStudentDetailPage = lazy(() =>
  import('./pages/admin/AdminStudentDetailPage').then((module) => ({ default: module.AdminStudentDetailPage })),
)
const AdminStudentListPage = lazy(() =>
  import('./pages/admin/AdminStudentListPage').then((module) => ({ default: module.AdminStudentListPage })),
)
const CreateTeacherPage = lazy(() =>
  import('./pages/admin/CreateTeacherPage').then((module) => ({ default: module.CreateTeacherPage })),
)
const AdminTeacherListPage = lazy(() =>
  import('./pages/admin/AdminTeacherListPage').then((module) => ({ default: module.AdminTeacherListPage })),
)
const AdminContentReviewPage = lazy(() =>
  import('./pages/admin/review/AdminContentReviewPage').then((module) => ({ default: module.AdminContentReviewPage })),
)
const TeacherProfilePage = lazy(() =>
  import('./pages/teacher/TeacherProfilePage').then((module) => ({ default: module.TeacherProfilePage })),
)
const TeacherListPage = lazy(() =>
  import('./pages/student/TeacherListPage').then((module) => ({ default: module.TeacherListPage })),
)
const TeacherDetailPage = lazy(() =>
  import('./pages/student/TeacherDetailPage').then((module) => ({ default: module.TeacherDetailPage })),
)
const StudentCourseListPage = lazy(() =>
  import('./pages/student/learning/StudentCourseListPage').then((module) => ({ default: module.StudentCourseListPage })),
)
const StudentCourseDetailPage = lazy(() =>
  import('./pages/student/learning/StudentCourseDetailPage').then((module) => ({
    default: module.StudentCourseDetailPage,
  })),
)
const StudentEnrollmentsPage = lazy(() =>
  import('./pages/student/learning/StudentEnrollmentsPage').then((module) => ({ default: module.StudentEnrollmentsPage })),
)
const StudentLearningPathPage = lazy(() =>
  import('./pages/student/learning/StudentLearningPathPage').then((module) => ({ default: module.StudentLearningPathPage })),
)
const StudentPlacementTestPage = lazy(() =>
  import('./pages/student/learning/StudentPlacementTestPage').then((module) => ({
    default: module.StudentPlacementTestPage,
  })),
)
const StudentCourseRecommendationsPage = lazy(() =>
  import('./pages/student/learning/StudentCourseRecommendationsPage').then((module) => ({
    default: module.StudentCourseRecommendationsPage,
  })),
)
const StudentGrammarCheckPage = lazy(() =>
  import('./pages/student/learning/StudentGrammarCheckPage').then((module) => ({ default: module.StudentGrammarCheckPage })),
)
const StudentGrammarCheckHistoryPage = lazy(() =>
  import('./pages/student/learning/StudentGrammarCheckHistoryPage').then((module) => ({
    default: module.StudentGrammarCheckHistoryPage,
  })),
)
const StudentAiTutorPage = lazy(() =>
  import('./pages/student/learning/StudentAiTutorPage').then((module) => ({ default: module.StudentAiTutorPage })),
)
const StudentEnrollmentProgressPage = lazy(() =>
  import('./pages/student/learning/StudentEnrollmentProgressPage').then((module) => ({
    default: module.StudentEnrollmentProgressPage,
  })),
)
const StudentLessonDetailPage = lazy(() =>
  import('./pages/student/learning/StudentLessonDetailPage').then((module) => ({ default: module.StudentLessonDetailPage })),
)
const StudentLessonQuizPage = lazy(() =>
  import('./pages/student/learning/StudentLessonQuizPage').then((module) => ({ default: module.StudentLessonQuizPage })),
)
const StudentQuizResultPage = lazy(() =>
  import('./pages/student/learning/StudentQuizResultPage').then((module) => ({ default: module.StudentQuizResultPage })),
)
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-slate-600">
      <Spinner />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
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
                <Route path="/student/grammar-check/history" element={<StudentGrammarCheckHistoryPage />} />
                <Route path="/student/ai-tutor" element={<StudentAiTutorPage />} />
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
                <Route path="/admin/students" element={<AdminStudentListPage />} />
                <Route path="/admin/students/:id" element={<AdminStudentDetailPage />} />
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
    </Suspense>
  )
}
