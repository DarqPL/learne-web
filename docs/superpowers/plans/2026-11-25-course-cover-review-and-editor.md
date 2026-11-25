# Course Cover Review And Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend existing course cover functionality with admin moderation, revision-aware pending snapshots, reliable cache/media lifecycle, and a 16:9 JPEG crop-and-preview editor.

**Architecture:** Keep `Course.imageUrl/imagePublicId` as the sole approved public cover. Store standalone cover proposals and revision-associated proposals separately, and enforce one latest pending review snapshot per course through a transactional registry. Admin actions promote only the registry-current snapshot; all superseded media and public changes use existing durable cleanup/cache infrastructure. The frontend crops once to a JPEG and uploads the exact bytes that are reviewed and later served.

**Tech Stack:** Spring Boot, JPA, PostgreSQL/Flyway, existing job/outbox cleanup and notification services, Redis catalog-version cache invalidation, Cloudinary, React/TypeScript/Vitest, Canvas, Tailwind/shadcn.

---

## File Map

### Backend (`backend/` submodule)

- Modify `src/main/java/com/learne/backend/teacher/content/entity/CourseRevision.java`: proposed revision cover URL/public ID pair.
- Create a cover-review entity/repository under `teacher/content` for standalone pending/terminal decisions.
- Create a pending-review snapshot entity/repository for one registry-current review item per course.
- Create next Flyway migration after current V30 under `src/main/resources/db/migration/`; add matching H2 migration/schema support as required by `application-test.properties`.
- Modify `teacher/content/CourseCoverImageService.java`: route existing upload to moderated standalone/revision proposal; retain immediate owner-only public removal and pending-proposal cancellation.
- Modify `teacher/content/CourseCoverImageController.java`: preserve the existing upload route but change it to moderated submission; add explicit pending-cancel operation. Keep the public removal route immediate and owner-only.
- Modify teacher submission/revision services (`TeacherContentService`, submission classes under `teacher/content/submission`) to create immutable replacement snapshots and atomically replace registry state.
- Modify `admin/content/service/AdminContentReviewService.java`, its existing DTOs/controller, and frontend `/admin/reviews` page to include revision-cover previews and promote revision covers atomically.
- Create an admin standalone cover-review service/controller/DTOs; add its list/detail/actions as a tab/section in the existing `/admin/reviews` experience.
- Reuse `notification/NotificationService.java` and current notification DTO/type patterns for approved/rejected/superseded cover outcomes.
- Modify `teacher/content/audio/service/MediaCleanupProducer.java`, `MediaCleanupHandler.java`, `CourseCoverCleanupDecisionService.java`, and V30 claim schema as needed so public, request, and revision references all prevent deletion.
- Reuse `cache/CacheInvalidationService.java` and existing catalog version mechanism. Add a durable outbox/job and handler for retryable post-commit catalog-version invalidation; do not rely on log-only recovery.
- Update `database/schema.sql` to reflect final schema while leaving historical migrations unchanged.
- Tests: extend `teacher/content/audio/MediaCleanupIT.java`, add review registry/API tests under `teacher/content/` and `admin/content/`, and add focused service/image/cache tests.

### Frontend (`frontend/` submodule)

- Modify `src/lib/api/types.ts` with cover review status, pending snapshot, and revision candidate shapes.
- Modify `src/lib/api/teacherContentApi.ts` for moderated cover submission, public removal, pending cancellation, and revision candidate operations.
- Modify `src/lib/api/adminReviewApi.ts` for standalone cover-review queue/detail/actions.
- Create `src/components/course/CourseCoverEditorDialog.tsx`: file selection, validation, crop/zoom/position, JPEG encoding, and preview.
- Modify `src/pages/teacher/content/TeacherCourseBuilderPage.tsx`: approved/pending/rejected states, public remove action, revision-aware proposal flows and notifications.
- Modify `src/pages/admin/review/AdminContentReviewPage.tsx` to add proposed-cover preview and standalone-cover-review section using existing `/admin/reviews` route.
- Modify student list/detail types/rendering only as needed to consume cache-refreshed approved `imageUrl`; do not expose pending media.
- Tests: add editor tests and extend teacher builder/admin review/student list/detail tests.

## Task 1: Database review state and authoritative latest-snapshot registry

**Files:** `CourseRevision.java`, new cover request/snapshot entities and repositories, next Flyway migration after V30, test migration/schema support, schema tests.

- [ ] **Step 1: Write failing PostgreSQL/H2 persistence tests** for existing approved cover preservation, cover-only request states, revision candidate pair constraint, one registry row per course, and stale/superseded snapshot replacement.
- [ ] **Step 2: Run focused persistence tests** from `backend/` with `./mvnw "-Dtest=CourseCoverModerationPersistenceTests" test`; confirm the new behavior fails before implementation.
- [ ] **Step 3: Add nullable revision cover fields** (`cover_image_url`, `cover_image_public_id`) and enforce both-null-or-both-present in database and entity validation.
- [ ] **Step 4: Add standalone cover-review table** containing course/teacher IDs, image URL/public ID, status, reviewer, reason, submitted/reviewed timestamps, and optimistic version.
- [ ] **Step 5: Add `course_pending_review_snapshots`** keyed by `course_id`, with snapshot kind/ID and foreign-key-safe lifecycle. Use one authoritative registry row, atomically switched within the same transaction as submit/supersede/resolve.
- [ ] **Step 6: Preserve existing public `courses.image_url/image_public_id` rows** unchanged as approved covers. Add production migration and matching test schema setup; do not edit prior migration files.
- [ ] **Step 7: Run focused migration/persistence tests** and verify legacy courses retain their public covers and the one-pending-snapshot invariant is enforced.

## Task 2: Moderated teacher cover workflows and immutable revision snapshots

**Files:** `CourseCoverImageService.java`, `CourseCoverImageController.java`, teacher revision/submission services, new cover request service/DTOs, service/API tests.

- [ ] **Step 1: Write failing service/API tests** for: standalone cover submission when no revision is pending; owner-only access; no direct public promotion; immediate public-cover removal; pending proposal cancellation; and 409/404 on stale/wrong-owner requests.
- [ ] **Step 2: Write failing state tests** for updating the sole registry snapshot when a new course submission supersedes an older pending revision, when standalone cover is superseded by a content revision, and when content/cover changes while review is pending.
- [ ] **Step 3: Define the upload contract:** keep the existing upload route but make it create/replace a moderated proposal when no revision is pending. If a revision is pending, the teacher UI must request a replacement revision snapshot that copies pending content and replaces only the cover; never mutate a snapshot already exposed to admin review.
- [ ] **Step 4: Implement immediate public-cover removal** under owner authorization, clear the public pair and enqueue cleanup in one transaction. Keep pending cover requests/revision candidates intact unless the teacher explicitly cancels them.
- [ ] **Step 5: Implement pending-request cancellation and supersession**; atomically update request/revision status, registry pointer, and cleanup job intent.
- [ ] **Step 6: Make revision submit create an immutable submitted snapshot** and replace the registry row atomically. A later teacher edit clones the pending content to a new draft, applies changes, and submits a new registry-current snapshot.
- [ ] **Step 7: Add compensation** for successful Cloudinary upload followed by DB failure, using the existing independent-transaction compensation service; cleanup decision must protect assets referenced by course, revision, request, or registry.
- [ ] **Step 8: Run focused backend service/API tests** and verify rejected revisions remain editable per existing rules and resubmission promotes only the latest snapshot.

## Task 3: Admin review queue, promotion, notifications, and cache invalidation

**Files:** `AdminContentReviewService.java`, existing admin review DTO/controller, new standalone cover review service/controller/DTOs, `NotificationService.java`, `CacheInvalidationService.java`, new catalog invalidation outbox/job entity/repository/handler, tests.

- [ ] **Step 1: Write failing admin review tests** for cursor-paginated oldest-first queue, detail current-vs-proposed preview, approve/reject reason, and stale/superseded action conflicts.
- [ ] **Step 2: Extend course revision review detail** to expose the candidate cover preview; keep current public cover distinguishable from the proposed revision cover.
- [ ] **Step 3: Implement standalone cover admin queue and actions**; list only requests matching the pending snapshot registry, revalidate registry-current state under course lock before approve/reject.
- [ ] **Step 4: Implement revision approval/rejection integration:** promote candidate cover in the same DB transaction as content materialization; no candidate preserves current public image; rejection leaves public course/cover unchanged.
- [ ] **Step 5: Implement standalone approval/rejection:** approval swaps the public URL/public ID and resolves registry; rejection preserves public pair, records reviewer/reason, resolves registry.
- [ ] **Step 6: Emit in-app teacher notifications** for standalone approved/rejected/superseded decisions and revision decisions that include a cover; include course identity, outcome, and rejection reason when present.
- [ ] **Step 7: Add a catalog invalidation outbox/job record in the same transaction whenever `Course.imageUrl` changes.** The worker calls the existing idempotent catalog-version bump after commit; pending-only state changes do not enqueue student invalidation.
- [ ] **Step 8: Test cache recovery:** simulate invalidation worker failure, confirm the outbox event remains retryable and visible to operations, retry it, and verify fresh list and detail reads return the newly approved cover.
- [ ] **Step 9: Run focused admin, notification, review, and cache tests.**

## Task 4: Durable media cleanup across all cover owners

**Files:** `MediaCleanupProducer.java`, `MediaCleanupHandler.java`, `CourseCoverCleanupDecisionService.java`, cover request/revision services, `MediaCleanupIT.java`, cleanup tests.

- [ ] **Step 1: Write failing PostgreSQL Testcontainers cases** for cleanup retaining media referenced by public Course, pending standalone request, editable/rejected revision, and latest pending revision.
- [ ] **Step 2: Extend cleanup decisions** so an asset can be deleted only when no public/request/revision reference remains and no latest pending snapshot refers to it.
- [ ] **Step 3: Preserve the existing claim lifecycle:** claim persists across transient provider failures and retries; exhausted jobs mark claim DEAD with error details; provider deletion stays outside SQL transaction; claims clear only after successful deletion or a safe RETAIN resolution.
- [ ] **Step 4: Add actual handler concurrency tests** for upload-before-worker, worker-claim-before-upload, replacement of a pending cover, immediate public removal, and course deletion. Assert exact final DB image, job state, claim state, and provider delete count.
- [ ] **Step 5: Verify rejected/superseded/cancelled media cleanup** cannot delete a resource still referenced by any revision/request and does not retain detached media indefinitely after safe deletion.
- [ ] **Step 6: Run `./mvnw "-Dtest=MediaCleanupIT,CourseCoverCleanup*Tests" test`** with Docker available; verify PostgreSQL Testcontainers starts and each concurrency case executes through `MediaCleanupHandler`.

## Task 5: Crop editor and teacher/admin/student UI

**Files:** new `CourseCoverEditorDialog.tsx`, teacher/admin pages, API modules/types, course cover rendering component and tests.

- [ ] **Step 1: Write failing editor tests** for accepted source formats, source size limit, warning if either dimension is below 1280×720 recommendation, 16:9 crop framing, zoom/pan, cancellation, JPEG output, transparent-pixel compositing, and output-size handling.
- [ ] **Step 2: Implement the crop dialog** with a fixed 16:9 viewport; composite transparent pixels on a solid neutral background; encode once as JPEG under the 5 MiB output cap. If output exceeds cap, reduce quality/dimensions within contract and show an error if it still cannot comply.
- [ ] **Step 3: Preserve exact crop bytes** through upload, admin preview, approved storage, and student display. Do not server-crop, transcode, or apply a Cloudinary crop transformation after review.
- [ ] **Step 4: Update teacher builder UI** to distinguish approved public cover, pending standalone cover, rejected cover/reason, revision candidate, and removed cover. A new standalone proposal must show old public cover as current until approval.
- [ ] **Step 5: Update revision UI** so pending revisions are immutable; cover/content edits clone pending snapshot to a new draft, then resubmit the new latest snapshot. Keep public removal immediate as a distinct action.
- [ ] **Step 6: Update `/admin/reviews`** with current/proposed previews for revision reviews and a cursor-paginated oldest-first standalone cover queue; include teacher notification/status links where established review results are shown.
- [ ] **Step 7: Verify student list/detail display only approved `imageUrl`**, and both update after approval/cache-version change without requiring detail navigation first.
- [ ] **Step 8: Run frontend focused tests** for editor, teacher builder, admin review, and student list/detail.

## Task 6: End-to-end verification and rollout review

**Files:** all feature files and migration/schema documentation.

- [ ] **Step 1: Run backend focused tests** for persistence, teacher workflows, admin moderation, notification, cache invalidation, cleanup, and image decoding.
- [ ] **Step 2: Run backend full suite** from `backend/` using `./mvnw test` with Docker/Testcontainers available; require process exit code 0 and Surefire summary with zero failures/errors.
- [ ] **Step 3: Run frontend tests, lint, and build** from `frontend/` with `npm.cmd test -- --run`, `npm.cmd run lint`, and `npm.cmd run build`.
- [ ] **Step 4: Review migration rollout**: old public cover pairs remain approved; additive schema is deployable before app rollout; rollback retains schema/data and does not re-enable an unmoderated endpoint.
- [ ] **Step 5: Manual verification:** public course keeps old cover while proposal pending; approve swaps list/detail without navigating to detail first; reject preserves old cover and emits notification; public removal is immediate; revision+cover is reviewed together; new submissions supersede old pending snapshots and stale admin actions conflict; crop output JPEG exactly matches admin/student preview; cleanup retries and DEAD claims remain operator-visible.
