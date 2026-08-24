# Thiet Ke: Phase 4 Teacher Content UI

## Muc Tieu

Hoan thien phan con lai cua Phase 4 theo Kanban: Teacher co the quan ly noi dung hoc tap cua minh tren frontend, bao gom course, topic, lesson va question, sau do gui course sang trang thai `PENDING_REVIEW`.

Scope nay **khong** trien khai upload, delete hoac update media cho lesson. Cac cot audio/video da co trong database se chua duoc dung tren UI/API frontend trong dot nay.

## Pham Vi

- Frontend submodule `frontend`.
- Khong doi backend, khong doi schema, khong them endpoint media.
- Su dung cac endpoint backend da co duoi `/api/teacher/content/**`.
- Them UI mot man hinh chinh `/teacher/content` de demo duoc luong end-to-end:
  - Teacher dang nhap.
  - Tao course.
  - Tao topic trong course.
  - Tao lesson text trong topic.
  - Tao question trong lesson.
  - Gui course sang `PENDING_REVIEW`.

## Route Va Navigation

- Them route moi trong `App.tsx`:
  - `/teacher/content` -> `TeacherContentPage`.
- Them nav item cho role `TEACHER` trong `routes.ts`:
  - label: `Noi dung hoc tap`
  - path: `/teacher/content`
- Giữ `/teacher` va `/teacher/profile` hien co.

## API Frontend

Them file moi `src/lib/api/teacherContentApi.ts` de tach API noi dung hoc tap khoi API profile hien tai trong `teacherApi.ts`.

Ham can co:

- `listTeacherCourses()` -> `GET /api/teacher/content/courses`
- `createTeacherCourse(payload)` -> `POST /api/teacher/content/courses`
- `getTeacherCourse(courseId)` -> `GET /api/teacher/content/courses/{courseId}`
- `updateTeacherCourse(courseId, payload)` -> `PUT /api/teacher/content/courses/{courseId}`
- `deleteTeacherCourse(courseId)` -> `DELETE /api/teacher/content/courses/{courseId}`
- `createTeacherTopic(courseId, payload)` -> `POST /api/teacher/content/courses/{courseId}/topics`
- `updateTeacherTopic(topicId, payload)` -> `PUT /api/teacher/content/topics/{topicId}`
- `deleteTeacherTopic(topicId)` -> `DELETE /api/teacher/content/topics/{topicId}`
- `createTeacherLesson(topicId, payload)` -> `POST /api/teacher/content/topics/{topicId}/lessons`
- `updateTeacherLesson(lessonId, payload)` -> `PUT /api/teacher/content/lessons/{lessonId}`
- `deleteTeacherLesson(lessonId)` -> `DELETE /api/teacher/content/lessons/{lessonId}`
- `createTeacherQuestion(lessonId, payload)` -> `POST /api/teacher/content/lessons/{lessonId}/questions`
- `updateTeacherQuestion(questionId, payload)` -> `PUT /api/teacher/content/questions/{questionId}`
- `deleteTeacherQuestion(questionId)` -> `DELETE /api/teacher/content/questions/{questionId}`
- `submitTeacherCourse(courseId)` -> `POST /api/teacher/content/courses/{courseId}/submit`

## Types Frontend

Mo rong `src/lib/api/types.ts` voi cac type:

- `ContentStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'HIDDEN'`
- `CourseType = 'COMPREHENSIVE' | 'GRAMMAR' | 'LISTENING' | 'SPEAKING' | 'READING' | 'WRITING' | 'VOCABULARY' | 'PRONUNCIATION'`
- `SkillType = 'GRAMMAR' | 'LISTENING' | 'SPEAKING' | 'READING' | 'WRITING' | 'VOCABULARY' | 'PRONUNCIATION'`
- `QuestionType = 'MULTIPLE_CHOICE' | 'FILL_BLANK' | 'WORD_ORDER' | 'TRANSLATION' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'PRONUNCIATION'`
- `TeacherCourse`, `TeacherTopic`, `TeacherLesson`, `TeacherQuestion`, `TeacherQuestionOption`
- Request types tuong ung: `TeacherCourseRequest`, `TeacherTopicRequest`, `TeacherLessonRequest`, `TeacherQuestionRequest`, `TeacherQuestionOptionRequest`

Lesson type trong frontend dot nay chi expose cac field backend dang tra ve: `id`, `title`, `description`, `content`, `skillType`, `orderIndex`, `xpReward`, `placementTest`, `status`, `rejectionReason`, `questions`. Khong them field media vao UI dot nay.

## UI Tong The

Tao page `src/pages/teacher/TeacherContentPage.tsx` theo huong one-page content studio.

Layout:

- Header: tieu de `Noi dung hoc tap`, mo ta ngan, nut `Tao khoa hoc`.
- Cot trai: danh sach course cua teacher.
- Cot phai: chi tiet course dang chon.

Desktop:

- Dung grid/flex 2 cot.
- Cot trai khoang `w-80` hoac `max-w-sm`, cot phai `flex-1`.

Mobile:

- Stack doc: danh sach course truoc, chi tiet sau.

## Course List

Moi course card hien:

- Ten course.
- Level.
- Course type.
- Badge status.
- So luong topic, lesson, question tinh tu response long nhau.
- Neu course co `rejectionReason`, hien badge/canh bao ngan.

Click course -> load hoac chon chi tiet course.

Trang thai rong:

- Hien empty state: `Chua co khoa hoc nao.`
- Nut `Tao khoa hoc`.

## Course Detail

Khi chon course:

- Hien form sua course inline:
  - `name`
  - `description`
  - `type`
  - `level`
  - `orderIndex`
- Hien status badge va rejection reason neu co.
- Hien action:
  - `Luu khoa hoc`
  - `Xoa khoa hoc`
  - `Gui duyet`

Quy tac action:

- `DRAFT` va `REJECTED`: cho phep sua/xoa/them topic/lesson/question/gui duyet.
- `PENDING_REVIEW`, `APPROVED`, `HIDDEN`: disable cac action sua/xoa/them, chi xem noi dung.
- `Gui duyet` goi backend. Neu backend bao chua du topic/lesson/question thi hien Alert loi tu API.

## Topic Section

Trong course detail:

- Hien danh sach topic dang co, sap theo `orderIndex`.
- Moi topic card hien:
  - `name`
  - `description`
  - `orderIndex`
  - so lesson.
- Form inline de tao/sua topic:
  - `name`
  - `description`
  - `orderIndex`
- Action: `Luu topic`, `Xoa topic`, `Them bai hoc`.

## Lesson Section

Trong moi topic:

- Hien danh sach lesson, sap theo `orderIndex`.
- Moi lesson card hien:
  - `title`
  - `description`
  - `skillType`
  - `xpReward`
  - `placementTest`
  - status badge
  - so question.
- Form inline de tao/sua lesson:
  - `title`
  - `description`
  - `content` dang textarea
  - `skillType`
  - `orderIndex`
  - `xpReward`
  - `placementTest`
- Khong co truong upload audio/video, khong hien delete/update media.

## Question Section

Trong moi lesson:

- Hien danh sach question, sap theo `orderIndex`.
- Ho tro tat ca `QuestionType` backend:
  - `MULTIPLE_CHOICE`
  - `FILL_BLANK`
  - `WORD_ORDER`
  - `TRANSLATION`
  - `TRUE_FALSE`
  - `SHORT_ANSWER`
  - `PRONUNCIATION`
- Form chung:
  - `type`
  - `questionText`
  - `correctAnswer`
  - `explanation`
  - `knowledgePoint`
  - `difficulty`
  - `orderIndex`
  - `xpReward`

Options:

- Voi `MULTIPLE_CHOICE`, hien danh sach options co:
  - `optionText`
  - radio `correct` de chi chon mot dap an dung
  - `orderIndex`
- Voi `TRUE_FALSE`, UI co the tu tao 2 options `Dung` va `Sai`, cho teacher chon dap an dung.
- Voi cac type con lai, khong hien options; dung `correctAnswer`.

## Data Flow

- Khi vao `/teacher/content`, load `listTeacherCourses()`.
- Neu co course, mac dinh chon course dau tien.
- Sau moi create/update/delete/submit, reload course list hoac reload course chi tiet de dong bo tree long nhau.
- Dung mot state `selectedCourseId` de giu course dang xem.
- Dung cac state action rieng cho loading tung thao tac de khong khoa toan bo page khi chi dang submit mot form.

## Error Handling

- Dung `getApiErrorMessage` tu client hien co.
- Alert loi chung dau page cho list/load fail.
- Alert loi gan form neu save/delete/submit fail.
- Confirm truoc khi xoa course/topic/lesson/question.
- Neu session het han hoac access token loi, giu theo co che interceptor/auth hien co.

## Validation Frontend

Frontend chi validate toi thieu de UX tot hon:

- Course: `name`, `type`, `level` bat buoc.
- Topic: `name` bat buoc.
- Lesson: `title`, `skillType` bat buoc; `xpReward >= 0`.
- Question: `type`, `questionText` bat buoc; `xpReward >= 0`.
- Multiple choice can toi thieu 2 option va dung 1 option correct.

Backend van la nguon validate cuoi cung.

## Testing

Verification can chay:

- `npm.cmd run lint`
- `npm.cmd run build`

Manual/Playwright flow de demo Phase 4:

1. Login teacher.
2. Vao nav `Noi dung hoc tap`.
3. Tao course `DRAFT`.
4. Tao topic.
5. Tao lesson text, khong upload media.
6. Tao question `MULTIPLE_CHOICE`.
7. Gui course sang review.
8. Xac nhan status thanh `PENDING_REVIEW`.

## Ngoai Pham Vi

- Upload/delete/update audio/video lesson.
- Admin review Phase 5.
- Student xem approved course Phase 6.
- Quiz attempt, cham diem, progress Phase 7.
- AI pronunciation scoring hoac recommendation.
