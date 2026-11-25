# Course Cover Review And Editor Design

> **Supersedes:** `2026-11-22-course-cover-image-design.md` for cover upload, replacement/removal, revision, moderation, and public-display behavior. The earlier document is historical context only; this document is the sole authoritative cover-feature contract.

## Context

Course covers are currently stored directly on the stable `Course` record and immediately become public when a teacher uploads or replaces one. This bypasses content moderation. The teacher UI uploads the selected file immediately, without preview or crop controls. Student course catalog and detail responses are cache-versioned; cover mutations currently need to invalidate these caches so users do not see stale images.

Course content itself uses `CourseRevision`: teachers submit a revision and admins approve/reject it. Existing admin review screens display revision content, while the course cover is currently independent stable metadata.

## Goal

Require admin moderation before a changed course cover becomes public, preserve the existing public cover until the new one is approved, include revision-associated covers in course review, prevent stale catalog/detail image data, and give teachers a clear preview-and-crop workflow for a consistent 16:9 cover.

## User Decisions

- Adding or replacing a public cover requires admin approval. Removing the currently public cover takes effect immediately and does not require approval.
- When no course revision is pending review, a cover-only add/replace creates a separate cover review request; it does not resubmit course content.
- A cover submitted with a course revision is reviewed together with that revision. Admins can preview it on the course review screen, and the same approve/reject decision applies to both content and cover.
- A course has one latest pending review snapshot across course-content submission and any cover-only proposal. A newer content submission replaces the older pending review snapshot. If a revision is already pending and the teacher changes only its cover, create a replacement revision snapshot that copies the pending content and changes only its cover; supersede the previously submitted snapshot. An admin must never see a snapshot that can still be mutated. The admin queue exposes only the latest snapshot.
- Students continue to see the currently approved cover while a new cover is pending. Rejection leaves the approved cover unchanged.
- The editor uses a fixed 16:9 crop frame. The selected image is centered over a blurred version of the same image to fill the frame without distortion.
- Crop produces a JPEG output uploaded as `image/jpeg`; transparent source pixels are composited onto a solid neutral background before encoding. The approved image shown to students and admins is this exact encoded crop.
- The upload UI communicates the accepted source formats (JPEG, PNG, WebP), maximum source file size (5 MiB), and recommended minimum source size of 1280×720 px. Smaller valid images may be uploaded, with a low-resolution notice in preview. The cropped JPEG is validated against the existing server-side byte, dimension, pixel-count, and decode limits.
- Admin approval/rejection of a standalone cover or a revision containing a cover, and supersession of a standalone request, creates an in-app notification for the teacher. Notifications identify the course and outcome and include a rejection reason when present. The teacher management screen also shows authoritative status and rejection reason.

## Moderation Lifecycle

### Cover-only request

- The teacher selects/crops a replacement and submits it for review.
- The upload is stored as a pending cover resource and is not exposed through student catalog/detail DTOs.
- At most one latest pending review snapshot exists per course. When there is no pending course revision, replacing a pending cover-only request updates it and queues the superseded pending resource for cleanup.
- Admin review queue shows only the registry-current pending snapshot, ordered oldest-pending-first with cursor pagination. Detail shows course identity, current public cover, proposed cover preview, teacher, submission time, and approve/reject actions with a reason. Opening detail and acting revalidate snapshot identity; stale items return conflict and the queue refreshes.
- Approval atomically promotes the pending cover to the public course cover and marks the request approved. The old public image is queued for durable cleanup after commit.
- Rejection preserves the current public cover, marks the pending request rejected with reviewer/reason/time, creates an in-app notification for the teacher, and queues the rejected image for durable cleanup.
- Removing the public cover clears the public URL/public ID immediately and queues the removed media for durable cleanup. Any existing pending replacement remains pending and, if later approved, becomes the new public cover. If the teacher removes a pending proposal, cancel/supersede that proposal and queue its media for cleanup; removing a pending proposal never removes the current public cover.

### Revision-associated cover

- A revision is editable only in the existing editable revision states (`DRAFT` or `REJECTED`) and before submission. Once submitted as `PENDING_REVIEW`, it is immutable. If the teacher changes content or cover while it is pending, clone it as a new draft snapshot, apply the changes, then submit the replacement snapshot as the latest pending revision. Atomically mark the former pending revision `SUPERSEDED` and replace the course's pending-review registry entry. Never mutate a snapshot already available to admin review.
- When a teacher edits course content and attaches a new cover to that same editable revision, the cover URL/public ID belong to that `CourseRevision` candidate, not the public `Course` cover.
- Admin review displays the proposed cover alongside the revision content.
- Approval materializes the revision and promotes its cover atomically with course publication. The previously public cover is queued for durable cleanup after commit.
- Rejection keeps the public course and public cover unchanged. The rejected revision remains editable per existing revision rules, including its candidate cover. Its candidate media remains referenced while that revision is editable; if the teacher removes/replaces the candidate or the revision is superseded/deleted, queue the detached media for durable cleanup. Resubmitting after rejection submits the latest revision snapshot, including the latest attached cover.
- If no new cover is attached to the revision, approval preserves the current public cover.
- A standalone cover request may not be submitted while a course revision is pending review. If a cover-only request is pending and the teacher submits course content, the content revision becomes the single latest review snapshot and the standalone request is marked `SUPERSEDED`; its candidate image is attached to the submitted revision only if the teacher explicitly selects it, otherwise it is queued for cleanup. A rejected content revision returns to the existing editable flow; a later submission replaces the pending review snapshot. Serialize submission, replacement, removal, and review/promotion on the stable course row. Stale admin decisions for superseded snapshots return conflict and cannot change the public cover.

## Persistence And API

- Keep `Course.image_url`/`image_public_id` as the currently approved public cover only.
- Add revision cover fields to `CourseRevision` for the proposed cover of a revision. Both fields are nullable and must satisfy the paired-null invariant.
- Add a cover-review request entity/table for cover-only moderation, including course/teacher, proposed URL/public ID, status (`PENDING_REVIEW`, `APPROVED`, `REJECTED`, `SUPERSEDED`, `CANCELLED`), reviewer/reason/timestamps, and concurrency/version metadata.
- Add a `course_pending_review_snapshots` registry keyed by `course_id`, with a unique primary key and fields for snapshot kind (`COURSE_REVISION` or `COVER_ONLY`) and snapshot ID. Register, replace, resolve, or cancel a pending snapshot in the same transaction as the underlying revision/request state change. This registry is the authoritative cross-table invariant for one latest pending snapshot per course; historical revision and review records remain for audit.
- Preserve Cloudinary public IDs server-side; only return URLs and review metadata authorized for the requesting role.
- Change the existing immediate upload API so it cannot publish a new/replacement image directly. Route it to cover-only submission when no revision is pending, and to the latest pending revision only through the revision-cover API. Keep the existing remove API immediate for the public image and provide an explicit operation to cancel/remove a pending proposal. Ensure no legacy or alternate endpoint bypasses moderation.
- Add teacher APIs to submit/replace a pending cover-only request, remove the public cover immediately, cancel a pending cover proposal, and attach/replace/remove a proposed cover on an editable revision. If the latest revision is pending, cover-only changes create and submit a replacement revision snapshot with copied content and the new cover. Add admin APIs to list/detail/approve/reject cover-only requests; include preview data in the existing course-revision review detail. Admin queues use existing cursor pagination and oldest-pending-first ordering, show only registry-current snapshots, and revalidate the registry before detail/actions.
- Existing student APIs continue returning only `Course.imageUrl`, never pending revision/request URLs.
- Course revision approval updates public course metadata/content and promotes the associated cover in one database transaction; cover-only approval similarly swaps the public cover and review state atomically. Rejection leaves the existing approved cover intact.
- All obsolete pending, rejected, superseded, and old public media use the existing durable media-cleanup job and claim mechanism. Claims remain through retries and DEAD status for operator handling. Public removal, pending-request cancellation, revision supersession, and course deletion clear the corresponding DB reference and enqueue cleanup intent in the same transaction.
- Treat course, revision, and standalone-request media references as live references in cleanup decisions. Cleanup may delete an asset only after all public, pending, editable-revision, and pending-review references have been cleared or superseded, using the existing durable claim protocol.
- Cover add/replace/remove, review decisions, and course revision approval invalidate catalog/detail caches after commit whenever public `Course.imageUrl` changes. Pending-only state changes do not alter student cache data. Ensure both list and detail cache keys observe the updated catalog version; do not rely on navigation to a detail page to refresh the list.
- Record public-cover changes in a retryable cache-invalidation outbox/job in the same transaction as the DB change. A worker bumps the existing catalog version idempotently and retries failures until success or operator-visible `DEAD` status; logging alone is not considered recovery.
- Preserve all existing approved `Course.image_url`/`image_public_id` values as approved public covers during migration. Deploy nullable schema additions before application code that reads/writes review state; document rollback as application rollback with additive schema retained, not deletion of moderation data.

## Frontend Experience

- Replace immediate upload with an accessible dialog flow: choose JPEG/PNG/WebP source, validate locally, preview, crop/position/zoom in a fixed 16:9 viewport, composite transparency on a neutral solid background, encode the selected crop as JPEG, and explicitly submit.
- Show the maximum selected source size (5 MiB) before selection. The crop output must also be at most 5 MiB; if JPEG encoding exceeds this, reduce output quality/dimensions within the 16:9 crop until it meets the limit, and report a clear error if it cannot. Show recommended minimum source dimensions 1280×720 px and warn if either source dimension is below the recommendation; do not make recommendation a hard validation failure.
- The preview uses the exact 16:9 JPEG output over a blurred same-image background. The same uploaded JPEG bytes are what the admin reviews and, after approval, what students see; do not perform a different server-side crop or transformation.
- Show distinct states for current approved cover, pending standalone cover, rejected cover with reason, pending revision candidate, superseded request, and deleted public cover. Never present an unapproved image as the public cover.
- After successful submit/replace, update teacher state from the response and show pending status. On approve/reject/supersede events or reload, fetch authoritative review state. Display the in-app notification and persisted review status/reason.
- Student catalog/detail cards use cache-refreshed `imageUrl` and retain their fallback behavior for missing/broken images.

## Error Handling And Integrity

- Only the owning teacher can submit/replace/cancel a pending cover or attach/remove a candidate on a revision permitted by the lifecycle above. Public-cover removal is owner-only and immediate. Admin approval/rejection requires admin role and the latest currently pending snapshot/revision.
- Concurrent teacher uploads/replacements and admin review actions are serialized using stable-course locking and request/revision state checks. Stale review actions return conflict/not-found using existing API conventions.
- A failed DB write after Cloudinary upload enqueues durable compensation that checks all media references before deletion. If a cover request or revision is superseded/rejected/deleted, media cleanup is durable and idempotent.
- A failed Cloudinary delete leaves its cleanup claim and operator-visible job state intact; a currently referenced public image is never deleted.
- Cache invalidation happens only after successful DB commit and is recoverable through the retryable outbox/job specified above.
- Crop output is JPEG (`image/jpeg`, `.jpg`) with transparency composited onto the fixed neutral background. The browser encodes once; those exact bytes are uploaded, stored, reviewed, and served, with no second crop/transcode on server or Cloudinary. Existing JPEG/PNG/WebP stored covers remain displayable without rewriting bytes. All new editor submissions use JPEG output; any legacy upload route must use moderation and may not write directly to public fields. Server-side JPEG signature/decode/dimension/size validation remains mandatory; client validation is only an early UX check.

## Verification

- Backend tests cover migration preserving existing public covers; old upload endpoint cannot bypass moderation; immediate public-cover removal and pending-proposal cancellation; cover-only request creation/replacement; owner access; registry one-latest-snapshot invariant; admin queue ordering/pagination/detail/stale actions, approve/reject and in-app notifications; rejection preserving old public cover; revision-associated cover approval/rejection/resubmission; standalone/revision ordering policy; cleanup reference decisions across course/request/revision; durable cleanup/claim lifecycle; post-commit invalidation outbox retry and no student cache invalidation for pending-only actions.
- PostgreSQL Testcontainers tests exercise concurrent upload/replacement, cover review, revision approval, cleanup claim, and worker deletion through the actual handler.
- Image validation tests cover JPEG/PNG and WebP VP8/VP8L/VP8X decoding, malformed/truncated payloads, and oversized dimensions rejected before raster decode.
- Frontend tests cover select/preview/crop/zoom/cancel/submit, JPEG encoding and transparency compositing, low-resolution guidance, upload errors, immediate public removal, pending/rejected/superseded/revision states, notifications, and exact crop output rendering in teacher/admin/student views.
- Run backend full suite with PostgreSQL Testcontainers, frontend tests, lint, and production build.
- Manual verification: add/change cover on a published course and confirm students retain old image while pending; approve then confirm catalog and detail update without opening detail first; reject and confirm old image remains and teacher receives in-app notice; remove public cover immediately; submit content with a cover, replace a pending revision and confirm admin sees only latest snapshot; approve/reject whole revision; exercise crop, JPEG output and blurred frame at mobile/desktop sizes.

## Non-Goals

- Automatic AI moderation or explicit-content detection.
- Admin image editing/cropping.
- User-selectable aspect ratios or arbitrary cover layouts.
- Changes to dark/light theme work.
