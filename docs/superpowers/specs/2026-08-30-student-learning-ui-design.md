# Phase 6 Student Learning UI Design

## Context

Phase 6 trong `Project_Plan_Trello_Kanban.md` tập trung vào việc cho phép học viên chọn giảng viên, chọn khóa học và học nhiều khóa học cùng lúc. Backend Phase 6 đã có module Student Learning dưới namespace `/api/student/**`, bao gồm danh sách khóa học đã duyệt, chi tiết khóa học, đăng ký khóa học, danh sách enrollment, tiến độ enrollment, bắt đầu bài học và hoàn thành bài học.

Frontend hiện đã có layout Student, dashboard cơ bản, danh sách giảng viên và chi tiết giảng viên. Frontend chưa có API client, routes hoặc màn hình cho khóa học, enrollment và tiến độ học tập.

## Goal

Xây dựng frontend Phase 6 ở mức MVP mở rộng: học viên xem khóa học đã được duyệt, đăng ký khóa học, xem các khóa đã đăng ký, mở tiến độ học tập và học bài cơ bản bằng nội dung lesson. Luồng này xác nhận yêu cầu học viên chỉ thấy nội dung `APPROVED` thông qua Student API backend.

## Non-Goals

- Không triển khai quiz attempt hoặc chấm điểm câu trả lời.
- Không hiển thị đáp án đúng, option đúng/sai hoặc dữ liệu chấm điểm câu hỏi.
- Không triển khai XP/streak, AI recommendation hoặc learning path cá nhân hóa.
- Không triển khai upload media hoặc lesson media management.
- Không thay đổi backend API/schema nếu backend contract hiện tại đã đủ.

## Routes

- `/student`: dashboard học viên, đóng vai trò entry point đến danh sách khóa học và khóa đã đăng ký.
- `/student/courses`: danh sách khóa học đã duyệt, hỗ trợ lọc theo cấp độ, giảng viên và từ khóa nếu backend hỗ trợ.
- `/student/courses/:id`: chi tiết khóa học, hiển thị thông tin giảng viên, topic, lesson và nút đăng ký.
- `/student/enrollments`: danh sách khóa học học viên đã đăng ký.
- `/student/enrollments/:id`: tiến độ enrollment và màn học bài cơ bản.

Nếu cần điều hướng nhất quán, thêm `StudentSidebar` hoặc student navigation tối giản trong `StudentLayout`, tương tự định hướng hiện có của Admin/Teacher nhưng giữ UI nhẹ.

## API Client

Thêm `src/lib/api/studentLearningApi.ts` dùng `http` từ `src/lib/api/client.ts` và trả Axios response trực tiếp, nhất quán với các module API hiện tại.

Các hàm dự kiến:

- `listStudentCourses(params?: { level?: string; teacherId?: number })` gọi `GET /api/student/courses`.
- `getStudentCourse(courseId: number)` gọi `GET /api/student/courses/{courseId}`.
- `enrollStudentCourse(courseId: number)` gọi `POST /api/student/courses/{courseId}/enroll`.
- `listStudentEnrollments()` gọi `GET /api/student/enrollments`.
- `getStudentEnrollment(enrollmentId: number)` gọi `GET /api/student/enrollments/{enrollmentId}`.
- `getStudentEnrollmentProgress(enrollmentId: number)` gọi `GET /api/student/enrollments/{enrollmentId}/progress` nếu cần route tách riêng.
- `startStudentLesson(enrollmentId: number, lessonId: number)` gọi `POST /api/student/enrollments/{enrollmentId}/lessons/{lessonId}/start`.
- `completeStudentLesson(enrollmentId: number, lessonId: number)` gọi `POST /api/student/enrollments/{enrollmentId}/lessons/{lessonId}/complete`.

Backend controller hiện chỉ nhận `level` và `teacherId`; nếu cần tìm kiếm theo từ khóa trong Phase 6, frontend chỉ thực hiện search cục bộ trên danh sách đã tải hoặc để lại cho phase sau.

## Types

Mở rộng `src/lib/api/types.ts` với các DTO khớp backend:

- `StudentCourseSummary`: id, name, description, type, level, teacherId, teacherName, teacherEmail, teacherAvatarUrl, topicCount, lessonCount, questionCount, publishedAt, enrolled.
- `StudentCourseDetail`: thông tin course, teacher, `publishedAt`, `enrolled`, `activeEnrollmentId`, danh sách topics.
- `StudentTopic`: id, name, description, orderIndex, lessons.
- `StudentLesson`: id, title, description, content, skillType, orderIndex, xpReward, questionCount, questions.
- `StudentQuestionSummary`: id, type, questionText, knowledgePoint, difficulty, xpReward, optionCount.
- `StudentEnrollment`: id, courseId, courseName, teacherId, teacherName, status, progressPercent, completedLessonCount, totalLessonCount, enrolledAt, completedAt.
- `StudentEnrollmentProgress`: enrollmentId, status, progressPercent, completedLessonCount, totalLessonCount, course, topics.
- `StudentProgressCourse`, `StudentProgressTopic`, `StudentLessonProgress` theo response backend.

Các union đã có như `CourseType`, `SkillType`, `QuestionType` nên được tái sử dụng. Thêm `EnrollmentStatus` và `LessonProgressStatus` nếu chưa có.

## Course Catalog

Trang `/student/courses` hiển thị các khóa học backend trả từ `GET /api/student/courses`. Vì endpoint backend chỉ trả approved courses, frontend không cần tự lọc theo `ContentStatus`, nhưng UI và Playwright phải kiểm chứng rằng course pending/rejected không xuất hiện.

Mỗi course card hiển thị tên khóa, mô tả ngắn, cấp độ, loại khóa học, giảng viên, số topic/lesson/question, ngày publish và badge đã đăng ký nếu `enrolled = true`. Card dẫn đến `/student/courses/:id`.

Filter cấp độ và giảng viên dùng query params backend đang hỗ trợ. Search keyword chỉ được thêm nếu backend có contract tương ứng; nếu chưa có, dùng search cục bộ hoặc để lại cho phase sau.

## Course Detail And Enrollment

Trang `/student/courses/:id` gọi `GET /api/student/courses/{courseId}` và hiển thị thông tin khóa học, giảng viên, danh sách topic và lesson đã approved. Lesson card hiển thị tiêu đề, mô tả, skill type, XP reward, số câu hỏi và preview nội dung ngắn nếu có.

Nếu `enrolled = false`, hiển thị nút `Đăng ký khóa học`. Khi enroll thành công, dùng response enrollment để chuyển đến `/student/enrollments/:id` hoặc cập nhật detail nếu backend đã trả `activeEnrollmentId`. Nếu `enrolled = true`, hiển thị nút `Tiếp tục học` dẫn đến enrollment hiện tại.

## My Enrollments

Trang `/student/enrollments` gọi `GET /api/student/enrollments` và hiển thị các khóa đã đăng ký. Mỗi card hiển thị tên khóa, giảng viên, trạng thái, tiến độ phần trăm, số lesson hoàn thành/tổng lesson, ngày đăng ký và ngày hoàn thành nếu có. Card dẫn đến `/student/enrollments/:id`.

Nếu chưa có enrollment, hiển thị empty state hướng học viên sang `/student/courses`.

## Enrollment Progress And Basic Learning

Trang `/student/enrollments/:id` gọi `GET /api/student/enrollments/{enrollmentId}`. Màn hình gồm phần tổng quan khóa học, progress bar, danh sách topic/lesson và panel học bài.

Mỗi lesson progress hiển thị title, status, progressPercent, skillType và nội dung bài học. Với MVP Phase 6, lesson content có thể hiển thị trực tiếp trong panel khi học viên chọn lesson. Các nút hành động:

- `Bắt đầu học` gọi start lesson khi status là `UNLOCKED`.
- `Hoàn thành bài học` gọi complete lesson khi status là `IN_PROGRESS`; lesson `LOCKED` không hiển thị nội dung học và không có nút hành động.
- Sau mỗi action, reload enrollment progress từ response hoặc gọi lại detail để cập nhật tiến độ.

Questions trong Phase 6 chỉ hiển thị như preview học tập nếu backend response có trong course detail; không làm form trả lời, không chấm điểm và không hiển thị đáp án/options.

## Error Handling And Loading

Các trang dùng `Spinner` khi loading và `Alert` khi lỗi, theo pattern frontend hiện có. Error message dùng `getApiErrorMessage` với fallback tiếng Việt cụ thể theo từng màn:

- Không thể tải danh sách khóa học.
- Không thể tải chi tiết khóa học.
- Không thể đăng ký khóa học.
- Không thể tải danh sách khóa đã đăng ký.
- Không thể cập nhật tiến độ bài học.

Trong các action enroll/start/complete, disable nút đang thao tác để tránh double-submit. Nếu người dùng chuyển route trong lúc request đang chạy, dùng cancellation guard hoặc mounted ref để tránh set state sau unmount.

## Approved-Only Requirement

Frontend Phase 6 dựa trên Student API backend để đảm bảo học viên chỉ nhận nội dung `APPROVED`. UI không gọi Teacher/Admin content API và không hiển thị trạng thái nội dung nội bộ. Verification phải tạo ít nhất một course pending/rejected và một course approved, sau đó xác nhận Student chỉ thấy course approved trong `/student/courses` và enrollment flow.

## Verification Plan

Static verification:

- Chạy `npm.cmd run lint; if ($?) { npm.cmd run build }` trong frontend.

Manual Playwright verification:

- Dùng Admin/Teacher setup tạo dữ liệu hoặc dùng API với token hợp lệ.
- Tạo một course approved với topic, lesson và question summary.
- Tạo thêm course pending hoặc rejected để kiểm chứng không xuất hiện ở Student.
- Login Student bằng UI.
- Mở `/student/courses`, xác nhận chỉ thấy approved course.
- Mở chi tiết course, xác nhận topic/lesson/question summary hiển thị và không có đáp án/options đúng sai.
- Enroll course, xác nhận chuyển đến hoặc mở enrollment detail.
- Start lesson, complete lesson, xác nhận progress cập nhật.
- Mở `/student/enrollments`, xác nhận enrollment xuất hiện với tiến độ mới.

## Implementation Boundaries

Plan implementation nên chia thành các bước nhỏ:

1. Thêm types và API client Student Learning.
2. Thêm labels/utils cho course, enrollment và lesson progress.
3. Xây dựng course catalog.
4. Xây dựng course detail và enroll flow.
5. Xây dựng enrollments list.
6. Xây dựng enrollment progress/basic learning page.
7. Wire routes/navigation/dashboard.
8. Playwright verification và cập nhật Kanban Phase 6.
