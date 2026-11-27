# Theme Route-by-Route Verification

Verification is recorded honestly: `Automated` means source/tests/build coverage only; `Visual` requires browser inspection in all three modes. Routes requiring authenticated backend data remain `Unverified` until credentials/services are available.

## Public and authentication

| Route | System | Light | Dark | States / notes |
|---|---|---|---|---|
| `/login` | Pending | Pending | Pending | Initial, validation, rate limit |
| `/register` | Pending | Pending | Pending | Initial, validation, success/error |
| `/forgot-password` | Pending | Pending | Pending | Initial, submission, error |
| `/reset-password` | Pending | Pending | Pending | Initial, invalid/expired token, submission |
| `/change-password` | Pending | Pending | Pending | Auth-required, validation/submission |
| `/` | Pending | Pending | Pending | Redirect/landing behavior |
| `*` (404) | Pending | Pending | Pending | Not-found surface |

## Student

| Route | System | Light | Dark | States / notes |
|---|---|---|---|---|
| `/student` | Pending | Pending | Pending | Dashboard/cards |
| `/profile` | Pending | Pending | Pending | Tabs, edit forms, dialogs |
| `/student/learning-path` | Pending | Pending | Pending | Loading/empty/error |
| `/student/placement-test` | Pending | Pending | Pending | Questions, completion |
| `/student/course-recommendations` | Pending | Pending | Pending | Cards/loading/empty |
| `/student/grammar-check` | Pending | Pending | Pending | Form/results/errors |
| `/student/grammar-check/history` | Pending | Pending | Pending | Table/list/loading/empty |
| `/student/ai-tutor` | Pending | Pending | Pending | Conversation/input/states |
| `/student/teachers` | Pending | Pending | Pending | List/loading/empty |
| `/student/teachers/:id` | Pending | Pending | Pending | Detail/media |
| `/student/courses` | Pending | Pending | Pending | Filters/list/loading/empty |
| `/student/courses/:id` | Pending | Pending | Pending | Lessons/enrollment/dialogs |
| `/student/enrollments` | Pending | Pending | Pending | List/loading/empty |
| `/student/enrollments/:id` | Pending | Pending | Pending | Progress |
| `/student/enrollments/:enrollmentId/lessons/:lessonId` | Pending | Pending | Pending | Lesson/content/audio |
| `/student/enrollments/:enrollmentId/lessons/:lessonId/quiz` | Pending | Pending | Pending | Quiz states |
| `/student/quiz-attempts/:attemptId` | Pending | Pending | Pending | Result/review |
| `/student/mistake-review` | Pending | Pending | Pending | List/loading/empty |
| `/student/mistake-review/sessions/:sessionId` | Pending | Pending | Pending | Session/questions |
| `/student/subscription` | Pending | Pending | Pending | Plan cards/forms |
| `/student/payment/orders/:publicId` | Pending | Pending | Pending | QR, pending/paid/expired/error |

## Teacher

| Route | System | Light | Dark | States / notes |
|---|---|---|---|---|
| `/teacher` | Pending | Pending | Pending | Dashboard/charts/cards |
| `/teacher/content` | Pending | Pending | Pending | Filters/table/dialogs |
| `/teacher/content/courses/:courseId` | Pending | Pending | Pending | Builder steps/forms/preview |
| `/teacher/content/courses/:courseId/lessons/:lessonId` | Pending | Pending | Pending | Lesson editing/audio/quiz |
| `/teacher/profile` | Pending | Pending | Pending | Profile/forms/media |

## Admin

| Route | System | Light | Dark | States / notes |
|---|---|---|---|---|
| `/admin` | Pending | Pending | Pending | Dashboard/charts/tables |
| `/admin/students` | Pending | Pending | Pending | Search/table/dialogs |
| `/admin/students/:id` | Pending | Pending | Pending | Detail/tables/dialogs |
| `/admin/teachers/new` | Pending | Pending | Pending | Form/validation |
| `/admin/teachers` | Pending | Pending | Pending | Search/table/dialogs |
| `/admin/reviews` | Pending | Pending | Pending | Review panels/forms |
| `/admin/coupons` | Pending | Pending | Pending | Table/forms/dialogs |

## Shared interaction states

- [ ] Dropdown menus and selected items in all modes
- [ ] Dialog and alert-dialog content/overlay in all modes
- [ ] Sheet content/overlay in all modes
- [ ] Forms, native controls, validation and focus rings in all modes
- [ ] Tables, empty/error/loading states in all modes
- [ ] Recharts axes, grid, tooltip and legends in all modes
- [ ] Keyboard navigation and visible focus in all modes
- [ ] Browser-local preference survives reload; system choice follows OS changes

## Progress

- [x] Automated source audit and full test/lint/build rerun (68 files / 545 tests pass; lint 0 errors and 2 pre-existing hook warnings; production build succeeds)
- [ ] Public/auth visual review (System, Light, Dark)
- [ ] Student visual review (System, Light, Dark)
- [ ] Teacher visual review (System, Light, Dark)
- [ ] Admin visual review (System, Light, Dark)
- [ ] Interactive states visually reviewed or listed as blocked/unverified

### Verification limitation

No route is marked visually verified yet. Python Playwright is not installed in this environment (`import playwright` fails), and the repository has no Playwright dependency. Avoiding a dependency addition was part of the approved scope. Consequently, browser screenshots/computed appearance and route-by-route review in System, Light, and Dark could not be performed here. Routes and interactive states remain explicitly `Pending`; authenticated data-dependent routes additionally require backend services and role credentials for realistic populated-state inspection.
