# Course Cover Image Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional teacher-managed course cover image stored in Cloudinary and displayed to teachers and students with a reliable fallback.

**Architecture:** Store the cover URL and Cloudinary public ID on the stable `Course` entity, independently of content revisions. Add owner-scoped upload/remove operations that persist media state and durable cleanup intent together, reuse the existing media cleanup job mechanism, expose only the URL in course DTOs, and render the image in teacher and student interfaces.

**Tech Stack:** Spring Boot, JPA, Flyway/PostgreSQL, Cloudinary, existing durable media cleanup jobs, React, TypeScript, Vitest, Tailwind/shadcn.

---

## File Map

### Backend (`backend/` submodule)

- Modify `src/main/java/com/learne/backend/teacher/content/entity/Course.java`: add nullable cover URL/public ID and paired-null invariant support.
- Create `src/main/resources/db/migration/V29__add_course_cover_image.sql`: migration sequence currently ends at V28; add both columns and a check constraint.
- Modify `src/main/resources/db/migration-h2/` only if the test migration setup requires a corresponding migration; inspect `application-test.properties` first and keep the H2 schema compatible.
- Modify `src/main/java/com/learne/backend/storage/service/StorageService.java` and `CloudinaryStorageService.java`: add course cover upload using image validation and a dedicated folder.
- Modify `src/main/java/com/learne/backend/storage/dto/StorageResourceType.java` only if the cover must use a distinct Cloudinary resource type; images should use the existing `IMAGE` type.
- Create focused `CourseCoverImageService` and endpoint/controller under `teacher/content` for upload/removal, owner checks, concurrency serialization, and cleanup job enqueueing.
- Modify `src/main/java/com/learne/backend/teacher/content/dto/CourseResponse.java` and `TeacherContentService.java`: include `imageUrl` from the stable course on teacher responses.
- Modify student DTOs/mappers/repositories producing `StudentCourseSummaryResponse` and `StudentCourseDetailResponse` to return the stable course cover.
- Modify course deletion path in `TeacherContentService.java` so the cover cleanup intent is recorded before deleting the course.
- Add/update tests under `src/test/java/com/learne/backend/storage/service/`, `teacher/content/`, `student/learning/`, and `teacher/content/audio/` cleanup test patterns.

### Frontend (`frontend/` submodule)

- Modify `src/lib/api/types.ts`: add nullable `imageUrl` to teacher course, student summary, and student detail types.
- Modify `src/lib/api/teacherContentApi.ts`: add multipart upload and remove calls alongside existing teacher course operations.
- Create reusable `src/components/course/CourseCoverImage.tsx`: fixed aspect-ratio image, course-name alt, local error fallback.
- Modify `src/pages/teacher/content/TeacherCourseBuilderPage.tsx`: add owner upload/replace/remove panel with in-flight states and refresh local course data.
- Modify `src/pages/student/learning/StudentCourseListPage.tsx` and `StudentCourseDetailPage.tsx`: render cover component.
- Add focused tests beside API/component/page files using existing Vitest/Testing Library conventions.

## Task 1: Backend schema and stable Course fields

**Files:** `Course.java`, next Flyway migration under `src/main/resources/db/migration/`, applicable H2 migration setup, course entity/migration tests.

- [ ] **Step 1: Write failing persistence/migration tests** asserting legacy rows have null cover fields, both fields may be null, and a partial URL/public-ID pair is rejected.
- [ ] **Step 2: Run the new focused backend test class** with `./mvnw -Dtest=CourseCoverImagePersistenceTests test` from `backend/`; confirm the new assertions fail before implementation.
- [ ] **Step 3: Add nullable `image_url`/`image_public_id` fields and paired-null invariant** to `Course.java`; add matching getters/setters.
- [ ] **Step 4: Add `V29__add_course_cover_image.sql`** with `VARCHAR` columns sized to the existing URL/public ID conventions and a check constraint `(image_url IS NULL) = (image_public_id IS NULL)`; do not edit historical migrations.
- [ ] **Step 5: Align H2 test schema/migration path** based on `src/test/resources/application-test.properties` and existing migration-H2 conventions.
- [ ] **Step 6: Run targeted persistence/migration tests** and verify existing course rows continue to load with both fields null.

## Task 2: Cloudinary course-cover upload validation

**Files:** `StorageService.java`, `CloudinaryStorageService.java`, storage tests.

- [ ] **Step 1: Add failing storage tests** for JPEG/PNG/WebP acceptance and rejection of empty files, mismatched signatures, unsupported formats, files over 5 MiB, either dimension over 4096, and decoded pixel count over 16 megapixels.
- [ ] **Step 2: Run `./mvnw -Dtest=CloudinaryStorageServiceTests test`** from `backend/`; confirm new cases fail.
- [ ] **Step 3: Add `uploadCourseCover(MultipartFile)`** to `StorageService`; implement signature, size and safe dimension/pixel validation before upload and save in a dedicated course-cover folder.
- [ ] **Step 4: Make generated cover URL fresh/versioned** on replacement, using Cloudinary's returned secure URL/version behavior rather than returning an unchanged cached URL.
- [ ] **Step 5: Run storage tests** and verify failures are localized `ApiException`s consistent with existing upload behavior.

## Task 3: Owner-scoped mutation API and durable cleanup

**Files:** Create course-cover service/controller and request/response DTOs; modify `Course.java`, `StorageService.java`, existing `MediaCleanupProducer`/handler interfaces as needed; add service/API/cleanup tests.

- [ ] **Step 1: Write failing service/API tests** for owner upload, non-owner rejection, missing course, idempotent repeated remove, pending-review revision upload, and public ID never exposed to API clients.
- [ ] **Step 2: Write failing concurrency and compensation tests** proving overlapping upload/remove operations serialize and persistence failure queues cleanup for the just-uploaded image.
- [ ] **Step 3: Inspect existing cleanup interfaces** (`MediaCleanupProducer`, `MediaCleanupHandler`, `MediaDeletePort`, `StorageResourceType`) and extend their payload/decision contract to support image resources without weakening lesson-audio reference checks.
- [ ] **Step 4: Implement upload flow:** authenticate teacher; lock the stable course row; verify ownership/course exists; upload to Cloudinary; persist URL/public ID and enqueue old image cleanup intent in the same DB transaction; on transaction failure enqueue/perform compensation through the durable mechanism.
- [ ] **Step 5: Implement remove flow:** lock the course row; verify owner; if no image, return successful no-op; otherwise clear both DB fields and enqueue cleanup intent transactionally.
- [ ] **Step 6: Implement cleanup integration** so old/replaced/deleted cover resources are retried across process restarts, deletion is idempotent, and persistent failures show in existing job/operations status.
- [ ] **Step 7: Wire course deletion** to capture cover public ID and persist durable cleanup intent with deletion; verify transaction ordering does not lose the intent on rollback.
- [ ] **Step 8: Run targeted backend tests** for course-cover API/service and media cleanup, including a restart/recovery-oriented cleanup test supported by the existing test harness.

## Task 4: Backend DTO projections

**Files:** `CourseResponse.java`, `TeacherContentService.java`, `StudentCourseSummaryResponse.java`, `StudentCourseDetailResponse.java`, student repository/projection/mapping classes, related tests.

- [ ] **Step 1: Write failing DTO/API tests** asserting teacher and student responses return the stable course's `imageUrl` and never `imagePublicId`.
- [ ] **Step 2: Update teacher response mapping** to include `course.getImageUrl()` regardless of current revision status.
- [ ] **Step 3: Update student summary/detail projections** to select the stable `courses.image_url` and return null for legacy courses.
- [ ] **Step 4: Run student learning and teacher content API tests** to ensure response constructors/projections remain aligned.

## Task 5: Frontend types, API client, and fallback component

**Files:** `src/lib/api/types.ts`, teacher content API client, new `src/components/course/CourseCoverImage.tsx` and tests.

- [ ] **Step 1: Write component tests** for absent URL, successful URL, broken URL fallback, accessible alt text, and one-time fallback per failed source.
- [ ] **Step 2: Add `imageUrl: string | null`** to the teacher course, student course summary, and student course detail types matching backend responses.
- [ ] **Step 3: Add multipart upload and remove client functions** using the existing HTTP client and `/api/teacher/content/courses/{courseId}/cover-image` endpoint contract; send field name `file`.
- [ ] **Step 4: Implement `CourseCoverImage`** with fixed aspect ratio, `object-cover`, course-name alt text, decorative fallback artwork, and an error state that does not retry the same failed source indefinitely.
- [ ] **Step 5: Run focused Vitest tests** for the component and API client.

## Task 6: Teacher course builder controls

**Files:** `TeacherCourseBuilderPage.tsx`, optional focused cover upload panel component, page/component tests.

- [ ] **Step 1: Add failing tests** for current image display, upload replacing image, remove clearing image, upload/removal disabled while request in-flight, and server error feedback.
- [ ] **Step 2: Add the cover panel** to the course builder, rendering current image/fallback and upload/replace/remove controls only for the course owner view.
- [ ] **Step 3: Call upload/remove API** with the selected file; update local `course.imageUrl` from response or refresh course after success; retain prior display and show error on failure.
- [ ] **Step 4: Ensure revision read-only state is not incorrectly used to block cover operations**, since cover is stable presentation metadata and pending-review covers are explicitly allowed; prevent action overlap with deletion and another cover request.
- [ ] **Step 5: Run course builder and component tests** including read-only revision/pending review cases.

## Task 7: Student listing and detail rendering

**Files:** `StudentCourseListPage.tsx`, `StudentCourseDetailPage.tsx`, their tests.

- [ ] **Step 1: Add failing page tests** asserting a course with image shows a cover and a null/broken image shows fallback in list and detail.
- [ ] **Step 2: Render `CourseCoverImage`** in course cards and course detail with course name and correct fixed aspect ratio.
- [ ] **Step 3: Verify responsive layout and existing course metadata/actions** remain intact at mobile and desktop breakpoints.
- [ ] **Step 4: Run student course list/detail Vitest tests**.

## Task 8: End-to-end verification and migration review

**Files:** all touched backend/frontend files; no unrelated files.

- [ ] **Step 1: Run backend targeted tests** for storage, course cover API/service, course DTO projections, student learning API, and cleanup recovery.
- [ ] **Step 2: Run backend full test suite** from `backend/` with `./mvnw test`.
- [ ] **Step 3: Run frontend focused tests** for course cover component, teacher builder, student list/detail, and API client.
- [ ] **Step 4: Run frontend checks** from `frontend/` with `npm.cmd run lint` and `npm.cmd run build`.
- [ ] **Step 5: Review migration compatibility** against production Flyway and test migration setup; verify paired-null constraint and existing data migration behavior.
- [ ] **Step 6: Manual workflow:** owner uploads/replaces/removes cover during pending review; non-owner mutation is denied; students see latest cover in list/detail; failed/missing images render fallback; course deletion queues cleanup; simulate Cloudinary cleanup failure and verify retry after worker restart.
