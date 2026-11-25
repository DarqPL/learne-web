# Course Cover Image Design

## Context

Student course listing is implemented at `/student/courses`, with course details at `/student/courses/:id`. Teachers manage courses in the course builder. Course entities and DTOs currently have no cover-image field. The backend already uses Cloudinary through `StorageService` for teacher/student avatars, introduction videos, and lesson audio.

## Goal

Allow the teacher who owns a course to optionally upload, replace, and remove its cover image. Show the cover image on the student course listing, student course detail, and teacher course management screens. Preserve a complete fallback presentation when an image is absent or fails to load.

## Non-Goals

- Dark/light theme support (tracked as a separate work item).
- Admin course image management or admin review screen changes.
- External image URL entry, image generation, or image editing/cropping tools.
- Changing teacher avatar, lesson audio, or other media workflows.

## User Experience

- The owner can upload an optional image while managing a course, replace an existing image, or remove it.
- Upload controls are disabled while the course is locked/read-only or another incompatible course action is active.
- The teacher sees the current image or the fallback in the course builder.
- Students see a consistent cover area in course cards and course details. Missing or failed images use the same branded fallback treatment.
- Upload, replacement, and removal provide localized success/error feedback and prevent duplicate submissions while in progress.
- Upload, replacement, and removal are media metadata operations independent of course content revisions. The owner may manage the cover while a revision is pending review; operations are rejected if the course is being deleted or inaccessible. Concurrent image mutations are serialized server-side.

## Data And API

- The cover belongs to the stable `Course` record, not to a `CourseRevision`. It is presentation metadata independent of reviewed course content. Student APIs return the cover attached to the published course; teacher APIs return the same current cover regardless of which revision is being edited. Creating, submitting, approving, rejecting, or cloning a course revision does not copy, reset, or version the cover.
- Add nullable `image_url` and `image_public_id` fields to the `courses` persistence model and schema through a new migration; do not rewrite existing migrations. Existing courses remain valid with both fields null. Enforce the invariant that both fields are null or both are non-null. Keep production migration and any test migration/schema setup aligned.
- Expose `imageUrl` in teacher course responses, student course summaries, and student course details. Keep `imagePublicId` server-side.
- Add upload and remove endpoints scoped to the authenticated owning teacher. Nonexistent and non-owned courses return the backend's standard not-found/forbidden behavior without revealing ownership.
- Reuse the existing Cloudinary storage integration, adding a course-cover upload method and dedicated folder. Accept JPEG, PNG, and WebP only, verifying file signatures as well as declared content type; reject empty files and files larger than 5 MiB. Validate dimensions before upload and reject either dimension above 4096 pixels or decoded pixel count above 16 megapixels. These limits are part of the API contract and tests.
- Upload a replacement first, then atomically persist the new URL/public ID and durable cleanup intent for the previous Cloudinary resource. If persistence fails, compensate by scheduling cleanup of the newly uploaded resource. Removal atomically clears the DB reference and records cleanup intent. Use the existing durable media cleanup job/outbox mechanism, with retries surviving process restart; do not use an in-memory-only after-commit callback. Cleanup is idempotent, and persistent failures remain visible through the existing job failure/operations mechanisms.
- Repeated removal is idempotent and succeeds when the course exists and has no image. Course deletion must record cleanup intent for its cover before/with deletion using the same durable media cleanup mechanism.
- Replacements must produce a fresh image URL or versioned URL so caches cannot keep showing the old image; the API response and subsequent reads expose the new URL.

## Frontend Scope

- Add upload/remove controls to the teacher course builder, using the existing course mutation/read-only state and API error handling patterns.
- Add `imageUrl` to frontend course types and render it on `/student/courses` cards and `/student/courses/:id` detail.
- Use an accessible image alt text derived from the course name, fixed aspect ratio, object-fit cover, and a fallback for absent or failed images.
- Do not require an image in course creation or editing; existing create/update course payloads remain compatible.

## Error Handling And Data Integrity

- Reject unsupported formats, invalid signatures, empty files, files over 5 MiB, dimensions over 4096 pixels, and decoded pixel counts over 16 megapixels with a clear localized error.
- A Cloudinary outage must not leave course metadata pointing at an unpersisted replacement. A failed cleanup remains in durable retry state across process restarts and does not break course reads.
- A missing/invalid remote image must not break rendering; switch to fallback once per failed image source to avoid an error loop.
- Ownership and edit-lock validation are enforced server-side, not only by hiding/disabling the frontend control.
- On missing course, use the API's standard not-found response. Repeated remove is success/no-op. Conflicting simultaneous image mutations are serialized; the last successfully committed operation is the visible state and cleanup must not delete the resource referenced by that state.

## Verification

- Backend tests cover JPEG/PNG/WebP success; invalid signatures, empty files, unsupported types, size/dimension/pixel limits; owner authorization and missing course; both-null-or-both-present persistence invariant; legacy null fields; pending-review revision behavior; repeated removal; serialized concurrent mutations; replacement URL freshness; durable cleanup and retry after simulated process/job failure; course deletion cleanup.
- Frontend tests cover optional image rendering, fallback on missing/broken image, and teacher upload/remove states including read-only/locked mode.
- Run backend tests and frontend lint/build from their own submodules.
- Manual verification: owner uploads, replaces, and removes an image while a revision is pending review; another teacher cannot mutate it; students see the latest cover in listing/detail after replacement; courses without images and broken URLs show fallback; course deletion cleanup can be retried after a simulated Cloudinary failure.

## Implementation Boundaries

1. Add backend persistence, migration, storage upload/delete flow, authorization, DTO fields, and tests.
2. Add teacher management upload/remove UI and API client.
3. Add student listing/detail image rendering and fallback behavior.
4. Run targeted tests plus backend/frontend verification and manually validate the end-to-end workflow.
