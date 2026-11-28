# shadcn/ui Migration Inventory

## Route owners

| Route group | Routes (source of truth: `src/App.tsx`) | Visual owner |
|---|---|---|
| Public/auth | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/change-password`, `/`, `*` | auth pages, `AuthLayout`, redirect/not-found |
| Student | `/student`, `/profile`, `/student/learning-path`, `/student/placement-test`, `/student/course-recommendations`, `/student/grammar-check`, `/student/grammar-check/history`, `/student/ai-tutor`, `/student/teachers`, `/student/teachers/:id`, `/student/courses`, `/student/courses/:id`, `/student/enrollments`, `/student/enrollments/:id`, `/student/enrollments/:enrollmentId/lessons/:lessonId`, `/student/enrollments/:enrollmentId/lessons/:lessonId/quiz`, `/student/quiz-attempts/:attemptId`, `/student/mistake-review`, `/student/mistake-review/sessions/:sessionId`, `/student/subscription`, `/student/payment/orders/:publicId` | `src/pages/student/**`, `StudentLayout`, learning/course/mistake-review/payment components |
| Teacher | `/teacher`, `/teacher/content`, `/teacher/content/courses/:courseId`, `/teacher/content/courses/:courseId/lessons/:lessonId`, `/teacher/profile` | `src/pages/teacher/**`, `TeacherLayout`, content/workspace components |
| Admin | `/admin`, `/admin/students`, `/admin/students/:id`, `/admin/teachers/new`, `/admin/teachers`, `/admin/reviews`, `/admin/coupons` | `src/pages/admin/**`, `AdminLayout` |

## Shared component usage

The application has nine existing custom wrappers under `src/components/ui/` (Button, Card, Input, Textarea, Field, Alert, Avatar, Spinner, PasswordInput) and 28 primitives under `src/components/shadcn/ui/`. `src/components/ui/` is imported from auth pages, route guards, and student learning flows; inventory every direct import before removing wrappers. Keep wrappers when they preserve app APIs or behavior, but compose existing shadcn primitives rather than duplicate base styles.

| Component | Existing shadcn equivalent | Migration notes |
|---|---|---|
| Button | `ui/button` | Preserve `loading`, variants `primary/secondary/danger`, submit type, disabled behavior; map to shadcn variants. |
| Card | `ui/card` | Existing wrapper supplies max width/padding; preserve those layout affordances when composing Card. |
| Input | `ui/input` | Preserve native input props/ref behavior; normalize to shadcn `h-9` control height. |
| Textarea | `ui/textarea` | Preserve ref and textarea props. |
| Field | `ui/label` + semantic field markup | Preserve current error text linkage; add `aria-invalid` and `aria-describedby` without changing consumer API. |
| Alert | `ui/alert` | Existing Alert supports default/destructive only; add status-token variants only if needed, otherwise semantic composition. |
| Avatar | `ui/avatar` | Preserve name initials and size API; always provide AvatarFallback. |
| Spinner | `ui/spinner` | Inspect installed component before migrating; preserve accessible status label. |
| PasswordInput | Input + Button | Preserve show/hide accessible naming and keyboard behavior. |

### Import inventory (source scan, production and test files)

- Legacy wrappers are directly consumed by `src/pages/auth/{ChangePasswordPage,ForgotPasswordPage,LoginPage,RegisterPage,ResetPasswordPage}.tsx`, `src/App.tsx`, and `src/lib/auth/guards.tsx`; the auth pages mix legacy `Field`/`Input`/`PasswordInput`/`Button`/`Card`/`Alert` wrappers with direct shadcn imports. `src/components/ui/SharedPrimitives.test.tsx` and `Button.test.tsx` encode wrapper contracts. Search all imports before wrapper removal; this list is representative and should be refreshed exhaustively before implementation.
- Direct shadcn imports already dominate admin surfaces (`AdminDashboardPage`, student/teacher list/detail, `CreateTeacherPage`, `AdminRevenueSection`, `AdminContentReviewPage`, coupons, `TeacherInvitationDelivery`), teacher authoring/forms/workspace (`TeacherContentPage`, `TeacherCourseBuilderPage`, `TeacherLessonWorkspacePage`, `CourseBuilderWorkspace`, `CourseForm`, `LessonForm`, `QuestionForm`, `TopicForm`, builder steps, audio/import-export panels), and student learning/profile/payment pages. Shared layouts/menu, notifications, course cover dialogs, and teacher/student dashboards also use primitives.
- Common installed primitives visibly in use include Button, Card, Alert, Badge, Avatar, Field/Label, Input, Textarea, Spinner, Skeleton, Table, Dialog/AlertDialog, DropdownMenu, Sheet, Select, Tabs, Accordion, Checkbox, Switch, ToggleGroup, Pagination, Breadcrumb, Empty, Separator, Progress, and ScrollArea. Treat this as a source-scan inventory, not a guarantee that every primitive is used.
- Existing legacy wrapper contracts merit explicit preservation: Button loading/disabled and primary/secondary/danger aliases; Input/Field native props, refs, validation linkage; Textarea ref; Card max-width/padding; Alert error/success/info semantics; Avatar initials/size; Spinner accessible status; PasswordInput reveal control. Confirm each actual export and call-site behavior before migration.

## Design-system baseline (to normalize)

- Typography: retain current information hierarchy; define a concise shared heading/body/caption scale and weights after auditing actual classes.
- Controls: shadcn Button uses default `h-9`, small `h-8`, large `h-10`, icon `size-9`; shadcn Input uses `h-9`. Adopt consistently unless current touch target requires larger sizing.
- Radius: shadcn controls default to `rounded-md`, cards `rounded-xl`; preserve intentional page-level composition but remove inconsistent one-off control radii.
- Elevation: prefer surface hierarchy/borders and shared subtle `shadow-sm`; remove colored or oversized decorative shadows from routine UI.
- Spacing: use Tailwind spacing scale and `gap-*`; align control/card padding through shared primitives, without restructuring page layouts.
- Status: preserve meaning for success, warning, destructive/error, info, pending-review, approved, rejected, active/locked. Define accessible light/dark semantic tokens as required by audit; do not neutralize distinctions.
- Chart palette: map series to `--chart-1` through `--chart-5`; axes/grid/tooltip use semantic foreground/border/popover tokens.

### Concrete inconsistencies observed in `src/`

- **Typography:** shadcn defaults use `text-sm` for controls and `md:text-sm` over base `text-base` inputs, while legacy wrappers also use `text-sm`; pages add `text-[11px]`, `text-[12px]`, `text-[15px]`, arbitrary tracking, and differing `text-xl`/`text-2xl` headings and `font-bold`/`font-semibold`. Keep Vietnamese content hierarchy; inventory arbitrary sizes and align repeated headings, body, metadata, and compact badges to a documented scale.
- **Radius:** primitive controls generally use `rounded-md`, cards `rounded-xl`, but legacy Input/Textarea use `rounded-lg`, legacy Card `rounded-2xl`, and page surfaces range through `rounded-lg/xl/2xl/3xl`, `rounded-[2rem]`, and circular pills. Auth hero/dashboard surfaces and nav shells are conspicuous one-off treatments; distinguish intentional composition from routine controls.
- **Elevation:** shadcn uses `shadow-xs/sm/md/lg`; wrapper Card uses `shadow-sm`. Pages add `shadow-lg/xl/2xl`, colored indigo shadows, hover shadow/translation, and some `shadow-none`. Review functional overlays vs decorative page emphasis; avoid flattening intentional hierarchy without visual evidence.
- **Spacing/surfaces:** regular Tailwind spacing is common, but repeated ad-hoc card padding (`p-4/5/6/8`), page-specific 3xl shells, inline `h-11`, custom `max-h`/`max-w`, and one-off gaps coexist. Align shared component internals and control spacing, not page grid/layout composition.
- **Buttons:** shadcn contract has default `h-9`, `sm h-8`, `lg h-10`, icon `size-9`; code frequently overrides with `h-11`, `rounded-xl`, raw anchor/label buttons, and hand-built active toggles (`AdminRevenueSection`). Legacy wrapper aliases and loading semantics must remain. Audit links styled as buttons separately from actual buttons.
- **Inputs:** shadcn Input is `h-9`; legacy Input is content/padding driven (`px-3 py-2`) with `rounded-lg`; auth forms commonly force `h-11 rounded-xl`; textarea is content-sized with `min-h-16`. Preserve larger auth/touch targets only if intentionally selected as a shared size contract; native file and OTP/QR-adjacent controls need special review.
- **Cards:** shadcn Card has `rounded-xl border py-6 shadow-sm` with gap-based composition; legacy Card is `max-w-md p-8 rounded-2xl`. Existing pages use shadcn Card with overrides and many bespoke `section/div` card surfaces, `bg-card/95`, gradients, border colors, and different padding. Consolidate repeated surface styling without replacing semantic page sections or special hero art.

## Fixed-color/custom-style audit (initial sampling; continue exhaustive searches)

| Location | Current patterns | Target |
|---|---|---|
| Shared layouts/nav | indigo active links and logo treatments | semantic primary/accent tokens, preserving LearnE logo mark |
| Auth | indigo/green/red fixed colors | primary plus semantic status tokens; preserve brand artwork/gradient composition |
| Teacher profile/dashboard/content | indigo surfaces, amber/emerald/red status colors | semantic surfaces and status tokens |
| Student learning/payment/profile | fixed status colors and customized indigo surfaces | semantic tokens; retain status distinctions |
| Admin dashboard/tables/revenue | fixed status colors, chart series and axes | semantic status tokens and chart palette variables |
| Specialized UI | video/audio/editor/learning/builder flows | retain specialized internals; standardize shell, fields, actions, dialogs, and status surfaces |

### Concrete search findings and semantic categories

### Migration progress notes (2026-11-27)

- Auth/shell: shared brand/navigation colors and auth form links, feedback alerts, controls, and prompt surfaces use semantic primary/accent/status/surface tokens. The login hero's fixed gradients and contrast-tuned text remain intentional brand artwork. `NotFoundPage` CTA now uses primary tokens.
- Student: `StudentEnrollmentsPage` standardizes empty/error/loading feedback, focus ring, card/table-like surface, progress fill, and primary action; ACTIVE/COMPLETED borders now use primary/success tokens. Other student pages remain unreviewed and contain numerous fixed palette classes, including status and selected/taxonomy colors.
- Teacher: `TeacherContentStatusBadge` maps pending/approved/rejected to warning/success/destructive tokens; `CourseSubmissionStatus` uses info tokens. Teacher forms, dashboard, profile, and builder surrounding UI remain largely unreviewed.
- Admin: student account status and feedback/table surfaces use semantic tokens; teacher account/teacher status and feedback/table surfaces use semantic tokens; dashboard KPI tiles use neutral/success/warning/info token families. Revenue chart series now read `--chart-1`/`--chart-2`, and its selected view/table/error surfaces are tokenized. Other charts and remaining review/coupon surfaces remain unreviewed.
- Shared status primitives: shadcn Badge now offers semantic success/warning/info variants, and destructive alerts/badges use the destructive surface/text tokens. This supports differentiated status meaning; remaining consumers still need individual migration and review.
- Current follow-up migration batch (2026-11-27): CourseBadge status/type/level/payment colors use status, info, and eight theme-backed taxonomy token pairs; category distinctions remain visible in both themes. Student course list, dashboard AI recommendation shells/actions, course detail, learning-path/recommendation badges, grammar-check category/status/result styling, quiz answer selection/results, mistake-review selection, profile success/controls, and payment/subscription status surfaces were partially migrated. Teacher dashboard/status tiles, content table, lesson workspace feedback, and builder step selection/review/content surfaces received semantic-token updates. Retained auth/login, dashboard/profile hero artwork and payment hero treatments are candidate artwork; exact manual route/theme review attribution is unavailable for each treatment.
- Follow-up migration batch (2026-11-28): Student lesson detail/enrollment/placement quiz/review, grammar history, and AI tutor functional selection, feedback, and status colors now use semantic or theme-backed taxonomy tokens. Teacher profile, content/import surfaces and builder status/revision messaging were migrated to semantic surfaces/statuses. AI tutor hero gradients remain candidate intentional artwork only; media/audio/editor treatments still require focused exception review.
- Functional palette follow-up: rate-limit alerts now use warning/destructive variants; notification unread/error/action treatments use destructive/primary; Dialog, AlertDialog, and Sheet overlays use foreground opacity and close buttons use semantic focus-ring/surface offsets. Builder question/editor/destructive and audio-editor feedback were tokenized.
- Remaining candidate art/media/content treatments: `pages/auth/LoginPage.tsx` branded gradient and overlaid copy; `pages/student/StudentDashboardPage.tsx` hero gradient/copy; `pages/student/profile/StudentProfilePage.tsx` profile header and overlaid details; `pages/student/learning/StudentAiTutorPage.tsx`, `StudentGrammarCheckPage.tsx`, and `StudentGrammarCheckHistoryPage.tsx` decorative gradients/blur art; `pages/student/StudentPaymentPage.tsx` and `StudentSubscriptionPlansPage.tsx` product/payment hero art. These are candidate exceptions, not visually approved; verify foreground contrast and dark-theme behavior. `LessonAudioPlayer.tsx` uses an audio-specific panel/label; `StudentLessonDetailPage.tsx` and `TeacherProfilePage.tsx` retain black media backing; `CourseCoverImage.tsx` uses placeholder gradient/icon; `CourseCoverEditorDialog.tsx` `NEUTRAL_BACKGROUND='#e2e8f0'` is isolated canvas output rather than app chrome. Review surrounding controls separately.
- Functional color gaps found by the 2026-11-28 TS/TSX/CSS scan were corrected: `studentQuizUtils.ts` now uses semantic success/warning tones for pass/fail; admin review status badges use semantic Badge variants and the unused fixed `contentStatusStyles`/`reviewStatusStyles` maps were removed; `workspace/builderModel.ts` card helper now uses `border-border bg-card shadow-sm`. No intentional status distinctions were removed. CSS hex/RGB values in `index.css` define theme, taxonomy, chart, and auth-art variables and are not utility leaks; inspect token behavior/contrast rather than replacing raw values indiscriminately. No literal Recharts series colors remain in the inspected admin revenue chart.
- Fresh verification (2026-11-28 closeout): `npm.cmd test` — 75 files / 582 tests passed; Vitest noted jsdom environments created 75 times / 196.95s tracked time. `npm.cmd run lint` — 0 errors, 2 `react-hooks/exhaustive-deps` warnings (`AdminStudentListPage.tsx:76` and `AdminCouponPage.tsx:489`, both missing `page`). `npm.cmd run build` — passed (`tsc -b` and Vite 8.2.1 production build). `git diff --check` — no whitespace errors; Git printed LF-to-CRLF working-copy warnings.
- Visual review: the user confirmed manual browser review of the reviewed routes/themes and that the current appearance looks good. Exact routes, states, viewports, and theme combinations were not enumerated here; this is user-reported manual evidence only, not automated/browser-run evidence. Do not mark unspecified checklist cells as visually verified. The earlier attempt at browser automation was blocked because Python lacked `playwright` and frontend declared neither `playwright` nor `@playwright/test`.
- Earlier full-suite counts and lint/build results in this working audit are historical snapshots and superseded by the fresh closeout verification below; do not treat them as final results.

| Category / examples | Representative locations | Treatment / semantic meaning |
|---|---|---|
| Brand/identity | `layouts/AppShell.tsx`, `StudentTopNav.tsx`, `AuthLayout.tsx`; login hero gradients | Brand wordmark/art may retain fixed artwork colors per spec. Distinguish the mark from navigation links, active states, and ordinary UI, which should use primary/accent tokens. |
| Success/approved/completed/paid | `components/ui/Alert.tsx`; `pages/teacher/content/{contentLabels,TeacherContentStatusBadge}.tsx`; `components/course/courseBadgeStyles.ts`; student dashboard and payment/subscription pages; admin success alerts | Green/emerald classes currently signal successful actions, approved content, completed learning, active account, paid orders, and correct answers. Keep these meanings distinct from primary/info and ensure both-palette contrast. |
| Warning/pending/attention | course/content labels and badges; `RateLimitAlert.tsx`; import/export panel; payment pending; admin password-change status | Amber/yellow commonly means pending review/payment, rate limit/attention, incomplete step, or password action needed. Preserve against neutral/destructive collapse. |
| Error/rejected/locked/failed | legacy Alert/Field; admin locked/suspended/rejected; builder rejection; payment expired/error; destructive actions | Red/rose is used for validation/API errors, rejected/locked states, expiry/failure, and destructive actions. Some are status labels and some are transient errors; retain their semantics and accessible names. |
| Informational/selected/course taxonomy | `courseBadgeStyles.ts` uses indigo/blue/purple/orange/pink by course skill/type; course submission and builder selected/current states use indigo; sky indicates submit reason | Do not map every non-neutral color to primary: preserve taxonomy/selection/info distinctions where users rely on them. Determine which need dedicated semantic tokens vs Badge variants during token design. |
| UI theme base | `src/index.css` defines raw hex values for standard semantic variables in light/dark plus auth background/gradient variables | Hex values inside theme-token definitions are expected; audit contrast and usage, not indiscriminately replace definitions with class utilities. Auth gradients are UI decoration and need light/dark review, unlike logo artwork. |
| Charts | Admin revenue chart uses theme chart variables; dashboards use chart data | Keep series mapped to chart variables; inspect axes/grid/tooltips/legend/labels in both palettes. Chart colors are data visualization and are not media exceptions. |
| Non-UI media/content | `CourseCoverEditorDialog.tsx` `NEUTRAL_BACKGROUND='#e2e8f0'` is used by cover-image editing/canvas; video elements use black backing; QR image and user/course media | Canvas/editor colors may be content-generation implementation rather than UI chrome; validate exact use before exception. Video/player/media rendering is specialized and may retain media colors. |

### Remaining candidate production palette matches (targeted scan, 2026-11-28)

| File / surface | Exact treatment | Classification | Required follow-up |
|---|---|---|---|
| `pages/auth/LoginPage.tsx` | slate/indigo/purple branded hero gradient, overlaid light text/icons | Brand artwork / contrast-tuned hero copy | Inspect at desktop/mobile in light/dark; keep only if contrast and appearance hold. |
| `pages/student/StudentDashboardPage.tsx` | indigo/violet/sky gradient hero, white and indigo-50 copy | Brand artwork / hero content | Inspect actual gradient contrast in all modes; don’t treat text as decorative. |
| `pages/student/profile/StudentProfilePage.tsx` | indigo/violet profile header and indigo-100 metadata text/icons | Branded profile hero | Verify overlay text contrast in both themes; consider surface fallback only if readability fails. |
| `pages/student/learning/StudentAiTutorPage.tsx` | violet/amber blurred circles and pale gradient backdrops | Decorative hero art / empty state backdrop | Verify no dark-theme glare or low-contrast content. |
| `pages/student/learning/StudentGrammarCheck{,History}Page.tsx` | indigo/sky blurred hero shapes and pale gradients | Decorative hero art | Verify dark theme and contrast of foreground content. |
| `pages/student/payment/Student{Payment,SubscriptionPlans}Page.tsx` | indigo/blue/purple pale radial/linear hero surfaces | Payment/product illustration treatment | Verify in all themes; payment states themselves are semantic tokens. |
| `pages/student/learning/LessonAudioPlayer.tsx` | sky/indigo audio panel and sky listening label | Specialized audio UI | Confirm label remains legible and player chrome responds to dark theme. |
| `pages/student/learning/StudentLessonDetailPage.tsx`, `pages/teacher/TeacherProfilePage.tsx` | black video element backing | Media rendering | Preserve media black; review surrounding controls separately. |
| `components/course/CourseCoverImage.tsx` | indigo/sky/violet gradient with indigo fallback icon | Course-cover placeholder artwork | Verify in dark mode and when image is unavailable. |
| `components/course/CourseCoverEditorDialog.tsx` | `NEUTRAL_BACKGROUND='#e2e8f0'` canvas fill | Generated-image implementation color | Keep isolated from UI theme; existing canvas test covers its use. |
| `pages/student/learning/StudentAiTutorPage.tsx` and grammar-check pages | Fixed hero/empty-state gradient classes; listed above | Candidate artwork | Visual review scope not attributable per route/theme; retain as candidate only. |
| `components/course/CourseCoverImage.tsx` | Gradient fallback and indigo icon | Candidate placeholder artwork | Verify image-unavailable state in dark theme; not visually approved here. |
| `pages/student/learning/studentQuizUtils.ts` (resolved) | Prior fixed green/amber pass/fail tones | Functional outcome feedback | Migrated to semantic success/warning background and foreground tokens; regression tests cover both outcomes. |
| `pages/admin/review/AdminContentReviewPage.tsx` (resolved) | Prior fixed status map colors | Functional content workflow status | Migrated to semantic Badge variants (secondary/warning/success/destructive); unused fixed style maps removed. |
| `pages/teacher/content/workspace/builderModel.ts` (resolved) | Prior fixed indigo/white card border/surface/shadow | Functional builder surface | Migrated to `border-border bg-card shadow-sm`. |

Functional color occurrences identified in this targeted scan have been converted to theme/status tokens. In-scope scan covered production `.ts`, `.tsx`, and `.css` for common numbered Tailwind palette classes and hex/RGB/HSL/OKLCH literals; it is not exhaustive for dynamic/generated classes, SVG attributes, inline style composition, external media, or third-party-rendered UI. Remaining TSX color matches are the candidate art/media/content entries above, while theme-token CSS literals are expected.

Known status domain includes DRAFT, PENDING_REVIEW, APPROVED, REJECTED, HIDDEN; ACTIVE/SUSPENDED/locked/must-change-password; course/payment FREE and paid/pending/expired/error; lesson/quiz complete/incomplete/correct/incorrect; subscription active/expired; notification unread/read; and general success/info/warning/error. These are observed categories, not a normalized final token map. Several label maps duplicate status styles (`contentLabels.ts`, `adminReviewLabels.ts`, course badge helpers, page-local maps); avoid accidental semantic drift while consolidating.

### Purpose-built components to retain

- `pages/student/learning/LessonAudioPlayer.tsx`, teacher lesson-audio editor (`pages/teacher/content/audio/LessonAudioEditor.tsx`), and video elements in teacher profile/student teacher detail: preserve playback and media APIs; standardize wrapper surfaces/actions only.
- Rich content/lesson/question editing in teacher content forms and `CourseBuilderWorkspace` plus `workspace/Builder{Info,Content,Questions,Review}Step.tsx` and `BuilderStepper.tsx`: preserve workflow, ordering, validation, and specialized editing behavior; normalize surrounding forms/cards/controls/status.
- `CourseCoverEditorDialog.tsx` and course cover review/editor flow: preserve crop/cover editing and canvas behavior; evaluate `NEUTRAL_BACKGROUND` as editor content rather than UI color.
- Interactive student placement-test, quiz, mistake-review and lesson activities; AI tutor/chat and grammar-check experiences; payment QR rendering: preserve task-specific interaction/media/data behavior. This list is based on visible route/component names and is not exhaustive; inspect all remaining student route files before implementation.

### Initial status foreground/background contrast measurements

Relative luminance contrast ratios calculated from the current sRGB token hex values using the WCAG 2.1 formula. These are text-pair measurements only; boundaries/icons/focus still require separate assessment. Every listed text pair exceeds 4.5:1.

| Palette | Foreground on background | Ratio |
|---|---|---:|
| Light | success `#14532d` on `#f0fdf4` | 8.70:1 |
| Light | warning `#713f12` on `#fefce8` | 8.38:1 |
| Light | info `#1e3a8a` on `#eff6ff` | 9.52:1 |
| Dark | success `#bbf7d0` on `#14251b` | 13.23:1 |
| Dark | warning `#fde68a` on `#2b2412` | 12.36:1 |
| Dark | info `#bfdbfe` on `#172235` | 11.22:1 |

The status icon colors used by the Alert variants also exceed the 3:1 non-text threshold against their respective background tokens: light success 4.79:1, warning 4.76:1, info 6.16:1; dark success 11.42:1, warning 10.05:1, info 8.84:1.

Measurement method: WCAG 2.1 relative luminance from sRGB hex components, contrast `(Llighter + 0.05) / (Ldarker + 0.05)`. Does not measure border/background, icon, focus-ring, or overlaid-opacity combinations.

## Search coverage and confidence

Inspected the approved spec, plans, route checklist, and targeted production-source scans over `.ts`, `.tsx`, and `.css` for common fixed Tailwind palette classes and literal hex/RGB/HSL/OKLCH colors. The scan is targeted, not a guarantee of every dynamic/generated class, SVG attribute, inline style, external/remote artwork, API-derived status mapping, or third-party rendered control. The exact remaining candidate art/media/content examples are listed above; token CSS values are expected definitions. Tests are excluded from production findings. Keep this as a bounded working audit, not exhaustive proof of all possible CSS color encodings.

This is a bounded working audit. Candidate artwork/media is not automatically approved; only explicit source and test evidence above establishes functional migrations. Do not treat targeted scans as exhaustive or as visual verification.
