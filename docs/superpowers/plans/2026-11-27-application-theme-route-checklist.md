# Theme Route-by-Route Verification

Verification is recorded honestly: `Automated` means source/tests/build coverage only; `Visual` requires manual browser inspection with route/theme/state/viewport scope recorded. Routes requiring authenticated backend data remain `Unverified` until credentials/services are available. The user has confirmed manual browser review of reviewed routes/themes and reported the current appearance looks good, but did not enumerate exact coverage; this attribution is recorded without marking unspecified route/theme cells complete.

## Public and authentication

| Route | System | Light | Dark | States / notes |
|---|---|---|---|---|
| `/login` | Automated | Unverified | Unverified | Source/tests/build only; user confirmed manual review of unspecified routes/themes; no exact route/theme scope attributed |
| `/register` | Automated | Unverified | Unverified | Source/tests/build only; user confirmed manual review of unspecified routes/themes; no exact route/theme scope attributed |
| `/forgot-password` | Automated | Unverified | Unverified | Source/tests/build only; user confirmed manual review of unspecified routes/themes; no exact route/theme scope attributed |
| `/reset-password` | Automated | Unverified | Unverified | Source/tests/build only; user confirmed manual review of unspecified routes/themes; no exact route/theme scope attributed |
| `/change-password` | Automated | Blocked | Blocked | Auth-required; browser driver unavailable; actual form not reached |
| `/` | Automated | Blocked | Blocked | Root redirect behavior covered only by source/tests; browser driver unavailable |
| `*` (404) | Automated | Blocked | Blocked | Source/tests/build only; browser driver unavailable |

## Student

| Route | System | Light | Dark | States / notes |
|---|---|---|---|---|
| `/student` | Automated | Blocked | Blocked | Dashboard/cards; browser driver unavailable; auth data inaccessible |
| `/profile` | Automated | Blocked | Blocked | Tabs, edit forms, dialogs; browser driver unavailable; auth data inaccessible |
| `/student/learning-path` | Automated | Blocked | Blocked | Loading/empty/error; browser driver unavailable; auth data inaccessible |
| `/student/placement-test` | Automated | Blocked | Blocked | Questions, completion; browser driver unavailable; auth data inaccessible |
| `/student/course-recommendations` | Automated | Blocked | Blocked | Cards/loading/empty; browser driver unavailable; auth data inaccessible |
| `/student/grammar-check` | Automated | Blocked | Blocked | Form/results/errors; browser driver unavailable; auth data inaccessible |
| `/student/grammar-check/history` | Automated | Blocked | Blocked | Table/list/loading/empty; browser driver unavailable; auth data inaccessible |
| `/student/ai-tutor` | Automated | Blocked | Blocked | Conversation/input/states; browser driver unavailable; auth data inaccessible |
| `/student/teachers` | Automated | Blocked | Blocked | List/loading/empty; browser driver unavailable; auth data inaccessible |
| `/student/teachers/:id` | Automated | Blocked | Blocked | Detail/media; browser driver unavailable; auth data inaccessible |
| `/student/courses` | Automated | Blocked | Blocked | Filters/list/loading/empty; browser driver unavailable; auth data inaccessible |
| `/student/courses/:id` | Automated | Blocked | Blocked | Lessons/enrollment/dialogs; browser driver unavailable; auth data inaccessible |
| `/student/enrollments` | Automated | Blocked | Blocked | List/loading/empty; browser driver unavailable; auth data inaccessible |
| `/student/enrollments/:id` | Automated | Blocked | Blocked | Progress; browser driver unavailable; auth data inaccessible |
| `/student/enrollments/:enrollmentId/lessons/:lessonId` | Automated | Blocked | Blocked | Lesson/content/audio; browser driver unavailable; auth data inaccessible |
| `/student/enrollments/:enrollmentId/lessons/:lessonId/quiz` | Automated | Blocked | Blocked | Quiz states; browser driver unavailable; auth data inaccessible |
| `/student/quiz-attempts/:attemptId` | Automated | Blocked | Blocked | Result/review; browser driver unavailable; auth data inaccessible |
| `/student/mistake-review` | Automated | Blocked | Blocked | List/loading/empty; browser driver unavailable; auth data inaccessible |
| `/student/mistake-review/sessions/:sessionId` | Automated | Blocked | Blocked | Session/questions; browser driver unavailable; auth data inaccessible |
| `/student/subscription` | Automated | Blocked | Blocked | Plan cards/forms; browser driver unavailable; auth data inaccessible |
| `/student/payment/orders/:publicId` | Automated | Blocked | Blocked | QR, pending/paid/expired/error; browser driver unavailable; auth data inaccessible |

## Teacher

| Route | System | Light | Dark | States / notes |
|---|---|---|---|---|
| `/teacher` | Automated | Blocked | Blocked | Dashboard/charts/cards; browser driver unavailable; role data inaccessible |
| `/teacher/content` | Automated | Blocked | Blocked | Filters/table/dialogs; browser driver unavailable; role data inaccessible |
| `/teacher/content/courses/:courseId` | Automated | Blocked | Blocked | Builder steps/forms/preview; browser driver unavailable; role data inaccessible |
| `/teacher/content/courses/:courseId/lessons/:lessonId` | Automated | Blocked | Blocked | Lesson editing/audio/quiz; browser driver unavailable; role data inaccessible |
| `/teacher/profile` | Automated | Blocked | Blocked | Profile/forms/media; browser driver unavailable; role data inaccessible |

## Admin

| Route | System | Light | Dark | States / notes |
|---|---|---|---|---|
| `/admin` | Automated | Blocked | Blocked | Dashboard/charts/tables; browser driver unavailable; role data inaccessible |
| `/admin/students` | Automated | Blocked | Blocked | Search/table/dialogs; browser driver unavailable; role data inaccessible |
| `/admin/students/:id` | Automated | Blocked | Blocked | Detail/tables/dialogs; browser driver unavailable; role data inaccessible |
| `/admin/teachers/new` | Automated | Blocked | Blocked | Form/validation; browser driver unavailable; role data inaccessible |
| `/admin/teachers` | Automated | Blocked | Blocked | Search/table/dialogs; browser driver unavailable; role data inaccessible |
| `/admin/reviews` | Automated | Blocked | Blocked | Review panels/forms; browser driver unavailable; role data inaccessible |
| `/admin/coupons` | Automated | Blocked | Blocked | Table/forms/dialogs; browser driver unavailable; role data inaccessible |

## Shared interaction states

- [ ] Dropdown menus and selected items in all modes — source/tests only; manual review scope not enumerated; unverified here
- [ ] Dialog and alert-dialog content/overlay in all modes — semantic overlay/focus tokens source-migrated; browser blocked
- [ ] Sheet content/overlay in all modes — semantic overlay/focus tokens source-migrated; browser blocked
- [ ] Forms, native controls, validation and focus rings in all modes — source/tests only; browser blocked
- [ ] Tables, empty/error/loading states in all modes — source/tests only; browser blocked
- [ ] Recharts axes, grid, tooltip and legends in all modes — source/tests only; browser blocked
- [ ] Keyboard navigation and visible focus in all modes — unit coverage partial; browser blocked
- [ ] Browser-local preference survives reload; system choice follows OS changes — provider/toggle unit-tested, browser blocked

## Progress

- [x] Partial wrapper source/tests and full test/lint/build rerun (70 files / 552 tests pass; lint 0 errors and 2 pre-existing hook warnings; production build succeeds)
- [ ] Public/auth visual review (System, Light, Dark) — user reports manual review of unspecified routes/themes and good appearance; exact coverage remains unverified here; browser automation unavailable
- [ ] Student visual review (System, Light, Dark) — blocked: Playwright missing; authenticated routes also need backend and student credentials/data
- [ ] Teacher visual review (System, Light, Dark) — blocked: Playwright missing; routes need backend and teacher credentials/data
- [ ] Admin visual review (System, Light, Dark) — blocked: Playwright missing; routes need backend and admin credentials/data
- [x] Interactive states not visually reviewed or not attributable to the reported manual review are listed as blocked/unverified below

## shadcn migration visual scale / cross-role checks

- [ ] Shared typography hierarchy, weights, and sizes consistent across roles
- [ ] Shared radii, shadows/elevation, and spacing conventions reviewed
- [ ] Button variants/sizes and input heights consistent across Student, Teacher, Admin
- [ ] Card structure and styling consistent across roles
- [ ] Success/warning/error/status distinctions visually readable in light and dark themes — semantic token source and contrast samples inventoried; browser blocked
- [x] Specialized media/editing/learning/builder internals preserved; functional surrounding UI standardized at source level; visual validation remains blocked

### Migration closeout notes (source scan; not visual verification)

- Inventory and representative source findings: `2026-11-27-shadcn-migration-inventory.md`. Legacy wrappers remain consumed by auth pages, `App.tsx` (Spinner), and auth guards; auth currently mixes wrappers with direct shadcn imports.
- Shared wrapper batch implemented: Button, Card, Input, Textarea, Field, Alert, Avatar, and Spinner compose shadcn primitives; PasswordInput retains its API and toggles with semantic colors/focus. Success/warning/info token families were added for both palettes; status text-pair ratios are recorded in the inventory. Error alerts retain the `error` alias and use assertive role by default; callers can override alert role and pass class names.
- Latest verification from prior work (historical, superseded by closeout run): `npm.cmd test` (70 files / 552 tests); `npm.cmd run lint` (0 errors, 2 existing hook-dependency warnings in admin student/coupon pages); `npm.cmd run build` succeeds. Refresh exact results below after final changes.
- Progress in earlier batches: shared shell/nav, auth controls, not-found CTA, student enrollment, teacher content status, and admin account/status/table surfaces were migrated to semantic tokens. Counts noted in earlier progress records are historical, not final closeout evidence.
- A targeted 2026-11-28 scan identified remaining art/media candidates and fixed status/helper colors; functional quiz outcome tones, admin review status badges, and teacher builder card surface are now semantic-token based. See inventory for exact candidate exceptions and scan limits.
- Remaining migration/visual risk areas: arbitrary control sizes/radii (notably auth `h-11` vs shadcn `h-9`), specialized media/editor/learning/payment flows, and candidate branded hero artwork. The inspected admin revenue chart uses chart tokens; the course-cover canvas color is documented as generated content.
- A targeted production scan of `.ts`, `.tsx`, and `.css` identified functional fixed-color occurrences and candidate art/media exceptions; functional quiz-result, admin review status, and builder surface cases have been addressed. Scan boundaries and exact candidates are documented in the inventory; this is not exhaustive for generated classes/SVG/inline styles and is not visual evidence.
- User-reported manual review: user confirmed browser review was performed for reviewed routes/themes and that the current appearance looks good. The exact routes, theme modes, states, viewport sizes, and dates were not supplied; this note records attribution only. All route/theme cells without independently specified coverage remain `Unverified` or `Blocked`; no browser automation result is claimed.
- Automated closeout verification (2026-11-28): `npm.cmd test` — 75 files / 582 tests passed; Vitest noted jsdom environments created 75 times / 196.95s tracked time. `npm.cmd run lint` — 0 errors, 2 hook dependency warnings (`AdminStudentListPage.tsx:76`, `AdminCouponPage.tsx:489`, missing `page`). `npm.cmd run build` — passed (`tsc -b` and Vite production build). `git diff --check` — no whitespace errors; LF-to-CRLF working-copy warnings only.

### Verification limitation

No route/theme cell is marked visually verified because the user's manual confirmation did not identify specific routes/themes. The earlier automation attempt was blocked: Vite started, but the Python helper lacked `playwright`, and the frontend did not declare `playwright` or `@playwright/test`. This is distinct from the user-reported manual review and is not evidence that no manual review occurred. Authenticated data-dependent routes additionally need suitable backend services and role credentials for realistic populated-state inspection. To complete route-attributed visual evidence, record the reviewed route, theme, viewport, and state; use automated browser tooling only if separately available/approved.
