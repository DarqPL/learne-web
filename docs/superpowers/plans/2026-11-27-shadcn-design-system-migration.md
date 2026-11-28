# shadcn/ui Design-System Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the frontend’s reusable controls and page styling toward installed shadcn/ui primitives and semantic theme colors without changing LearnE’s layout, branding, or behavior.

**Architecture:** Work in incremental batches: first inventory and establish shared token/component conventions, then replace legacy wrappers and custom styling by route groups, and finally audit all routes, states, and theme contrast. Keep `ThemeProvider`, current routing, and existing shadcn component implementations as the foundation; do not add dependencies.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS 4, existing shadcn/ui (New York, neutral, Radix-compatible components), Vitest/Testing Library, ESLint.

**Spec:** `docs/superpowers/specs/2026-11-27-shadcn-design-system-migration.md`

## Global Constraints

- No visual redesign, new component library, or new dependency.
- Preserve route behavior, information hierarchy, responsive layout, LearnE branding, and three-mode theme provider.
- Standardize typography, font sizes/weights, radius, shadows/elevation, spacing, button variants/sizes, input heights, and card styling as well as colors/components.
- Reuse `src/components/shadcn/ui/`; do not create duplicate component implementations.
- Use semantic theme tokens for UI surfaces, text, borders, focus, interactive states, and accessible success/warning/error/status distinctions. Fixed colors are limited to original brand artwork/logomarks and non-UI media; chart series use `--chart-1` through `--chart-5`.
- Keep shared controls visually and behaviorally consistent across Student, Teacher, and Admin.
- Specialized audio/video players, rich-text editors, interactive learning activities, and course-builder workflows may retain their purpose-built implementations/APIs; standardize their surrounding UI.
- Preserve existing functionality, component APIs, and business logic; make only necessary surface/component refactors.
- Meet WCAG 2.1 AA: 4.5:1 normal text, 3:1 large text, and 3:1 essential non-text/focus contrast.
- Preserve accessible names, keyboard behavior, focus, validation, disabled/loading, selection, and overlay dismissal/focus behavior.
- Record every configured route, theme, viewport, and meaningful state in `docs/superpowers/plans/2026-11-27-application-theme-route-checklist.md`; never infer visual success from automated checks.
- Run commands from `frontend/`; final checks are `npm.cmd test`, `npm.cmd run lint`, `npm.cmd run build`.

## Review Focus

- Status badges/alerts and chart series may lose meaning or contrast after tokenization; check success/warning/error and chart labels in both palettes.
- Custom wrappers may have behavior not represented by the shadcn primitive; test loading/disabled states, forwarded props, refs, and form semantics before replacement.
- Dialog, sheet, dropdown, and select migration can affect keyboard/focus/dismissal behavior; retain interaction tests.
- System mode must be validated under both OS preferences, not merely the currently resolved theme.
- Route pages with backend-dependent data can appear blank or misleading without fixtures; record concrete blockers and do not claim populated-state verification without evidence.

---

### Task 1: Inventory UI primitives, routes, and fixed colors

**Files:**
- Modify: `docs/superpowers/plans/2026-11-27-application-theme-route-checklist.md`
- Create: `docs/superpowers/plans/2026-11-27-shadcn-migration-inventory.md`
- Modify: `docs/superpowers/plans/2026-11-27-shadcn-design-system-migration.md`

- [x] **Step 1: Inventory legacy reusable components and direct usage**

Use ripgrep to identify imports from `src/components/ui/`, usages of `src/components/shadcn/ui/`, raw control-like markup, raw hex/rgb/Tailwind palette classes, and custom typography/radius/shadow/spacing/button-size/input-height/card classes in `src/`. Record component/file, current public API/behavior, recommended replacement or keep-specialized rationale, and design token candidate in the inventory; do not change product code in this step.

Also record control sizing contracts, status-color categories, and any specialized components whose implementation should remain custom. Keep the preserved component APIs and status semantics explicit in the inventory rather than broadening migration scope.

- [x] **Step 2: Map every configured route to owning page/components**

Compare `src/App.tsx` to the existing route checklist; add any missing routes and record page/component owners. Preserve dynamic route patterns.

- [ ] **Step 3: Classify color exceptions and interaction risks**

Record each remaining fixed color under UI/status/chart/brand-art/media and note the intended semantic token or allowed exception. Explicitly preserve success/warning/error/status meaning. Record wrappers with loading, ref, form, keyboard, or overlay behavior and specialized players/editors/activities/builders that remain purpose-built but need consistent surrounding surfaces.

- [x] **Step 4: Define the shared visual scale**

Document the existing hierarchy and chosen shared conventions for type scale/weights, radius, elevation/shadows, spacing, button variants/sizes, input heights, and card structure. Base choices on current shadcn primitives and existing product hierarchy; avoid changing information hierarchy.

- [ ] **Step 5: Review inventory completeness**

Run searches for palette literals and custom-wrapper imports again; expected result is that every match is classified or identified as irrelevant (e.g. test fixture). No production code has changed yet.

### Task 2: Standardize theme tokens and shared controls

**Files:**
- Modify: `src/index.css`
- Modify as needed: `src/components/shadcn/ui/*`
- Modify: `src/components/ui/Button.tsx`, `Card.tsx`, `Input.tsx`, `Textarea.tsx`, `Field.tsx`, `Alert.tsx`, `Avatar.tsx`, `Spinner.tsx`, `PasswordInput.tsx`
- Tests: corresponding `*.test.tsx` files or shared wrapper tests

**Interfaces:**
- Consume existing theme context and the current `src/components/shadcn/ui/` APIs.
- Preserve exported wrapper names/signatures where consumers still require compatibility; otherwise migrate consumers in the same task before removing a wrapper.
- Shared visual scale is defined by Task 1 inventory; use the same typography, radius, elevation, spacing, button size/variant, input height, and card conventions for all roles.

- [x] **Step 1: Add/update failing tests for the wrapper contract**

Cover one representative test each for button disabled/loading semantics, input labeling/invalid state, alert variant, and avatar fallback (where wrappers are actively used). Tests must assert observable behavior and accessible roles/names.

- [x] **Step 2: Run focused tests and confirm the intended failures**

Run focused Vitest files for each wrapper. Expected: new assertions fail because the current wrapper does not match the agreed semantic/accessible contract.

- [x] **Step 3: Migrate wrappers to compose installed shadcn primitives**

Preserve public props and application-specific behavior, delegate styling and variants to the shared shadcn implementation, align control heights and button variants to the Task 1 scale, and remove parallel style definitions. Do not overwrite upstream components wholesale.

- [x] **Step 4: Define complete semantic tokens for both palettes**

In `src/index.css`, retain standard shadcn tokens and add `--chart-1`…`--chart-5`; define success/warning/error/status tokens only as needed from the inventory. Define every added token in light and dark and use the documented contrast thresholds. Preserve differentiated status appearance rather than flattening all statuses to neutral.

- [x] **Step 5: Run focused tests, lint, and build**

Run affected tests, `npm.cmd run lint`, and `npm.cmd run build`; resolve regressions before route migration.

### Task 3: Migrate authentication and public/shared shell surfaces

**Files:**
- Modify: `src/layouts/AuthLayout.tsx`, `src/layouts/AppShell.tsx`, `src/layouts/StudentLayout.tsx`, role sidebars/top navigation/account menus
- Modify: `src/pages/auth/*.tsx`, `src/pages/NotFoundPage.tsx`
- Tests: layout and authentication tests under matching paths

- [ ] **Step 1: Add regression assertions for auth controls and shared headers**

Assert theme selector availability by role layout; assert auth form accessible names, invalid states, and keyboard-submit behavior are unchanged.

- [ ] **Step 2: Run tests to confirm coverage and identify failures**

Run focused layout/auth Vitest tests. New assertions should fail only where current controls or labels do not satisfy the preserved contract.

- [x] **Step 3: Replace custom controls and colors with shared primitives/tokens**

Use existing Button, Card, Field/Input, Alert, DropdownMenu, and theme selector components where behavior fits. Preserve existing auth branding art and layout; use semantic theme colors for surrounding UI.

- [ ] **Step 4: Verify keyboard/focus and responsive shell states**

Test theme menu keyboard selection, navigation focus, auth validation, and narrow-width layout. Record System light/dark, Light, and Dark results in the route checklist.

### Task 4: Migrate student routes and learning surfaces

**Files:**
- Modify: `src/pages/student/**/*.tsx`
- Modify: `src/components/course/*.tsx`, `src/components/notifications/*.tsx`, and student-specific reusable surfaces as needed
- Tests: matching student/component test files

- [ ] **Step 1: Add focused tests for representative route states**

Cover at minimum a data table/list, form validation, dialog/dropdown, lesson/quiz state, chat/tutor state, and payment status (pending/paid/expired/error) for observable roles, keyboard behavior, and theme selector persistence where applicable.

- [ ] **Step 2: Run the new focused tests and verify expected failures**

Run tests for the selected pages/components; confirm failures are due to the missing contract assertions, not setup errors.

- [ ] **Step 3: Migrate custom UI to existing shadcn primitives and tokens**

Apply installed Table, Badge, Card, Alert, Dialog/AlertDialog, Select, Tabs, Skeleton, Progress, and form primitives as appropriate. Preserve page-specific structure and user behavior. Tokenize UI colors; chart/status colors follow the token policy.

- [ ] **Step 4: Verify student route/state matrix**

Walk every student row in the route checklist across both resolved palettes, desktop and narrow/mobile widths; inspect meaningful populated and interactive states. Record any backend/credential blocker verbatim.

- [x] **Step 5: Run student test group**

Run all tests under student pages/layout/components; expected: no failures.

### Task 5: Migrate teacher authoring/profile surfaces

**Files:**
- Modify: `src/pages/teacher/**/*.tsx`
- Modify: `src/layouts/Teacher*.tsx`
- Tests: matching teacher component/page tests

- [ ] **Step 1: Add regression tests for builder forms, step controls, media/audio surfaces, and profile editing**

Assert labels, validation, keyboard operation, disabled/loading states, and dialog/menu accessibility.

- [ ] **Step 2: Confirm the tests fail for the intended behaviors**

Run the focused teacher suite and distinguish expected assertion failures from test harness problems.

- [ ] **Step 3: Migrate controls, tables, statuses, and surrounding surfaces**

Use existing shadcn primitives and semantic tokens. Preserve builder sequence and specialized media/editor/activity behavior and APIs; retain purpose-built implementation where warranted, while standardizing its surrounding fields, cards, buttons, dialogs, and status surfaces. Apply the shared scale from Task 1.

- [ ] **Step 4: Verify teacher route/state matrix**

Review dashboard charts/cards, content tables, builder steps, profile forms/media at desktop and narrow/mobile widths in System-light, System-dark, Light, and Dark. Record any unavailable data state.

- [x] **Step 5: Run teacher tests**

Run all tests under teacher pages/components/layouts; expected: no failures.

### Task 6: Migrate admin pages, data tables, and charts

**Files:**
- Modify: `src/pages/admin/**/*.tsx`
- Modify: admin-specific shared components under `src/pages/admin/`
- Tests: matching admin page/component tests

- [ ] **Step 1: Add regression checks for tables, forms, dialogs, review states, and chart series/tooltips**

Assert semantic roles, accessible labels, menu/dialog keyboard dismissal, filter form behavior, and series readability via token-based chart colors.

- [ ] **Step 2: Run focused admin tests and confirm expected failures**

Run admin tests before implementation and verify the new assertions expose the intended gaps.

- [x] **Step 3: Migrate UI and chart palette**

Replace custom controls with installed Table, Badge, Alert, Card, Dialog, Select, and form components where behavior matches. Map chart series to `--chart-1`…`--chart-5`; use semantic axis/grid/tooltip colors. Preserve success/warning/error/status distinctions with their documented semantic tokens and keep shared controls visually consistent with the Student and Teacher variants.

- [ ] **Step 4: Verify admin route/state matrix**

Inspect all admin routes, tables, filters, dialogs, chart tooltips, loading/empty/error states in four mode/OS combinations and desktop/narrow widths; record unverified populated states.

- [x] **Step 5: Run admin tests**

Run all admin page/component tests; expected: no failures.

### Task 7: Global color, primitive, accessibility, and route audit

**Files:**
- Modify: any residual frontend `src/**/*.tsx` and `src/index.css` identified by audit
- Update: `docs/superpowers/plans/2026-11-27-application-theme-route-checklist.md`
- Update: `docs/superpowers/plans/2026-11-27-shadcn-migration-inventory.md`

- [ ] **Step 1: Search for remaining custom palettes and wrapper duplicates**

Search production TSX/CSS for raw hex/rgb, non-semantic palette utility classes, and imports from legacy custom wrappers. Every result must be migrated or have an allowed documented exception.

- [ ] **Step 2: Verify contrast and focus states**

Check token-pair contrast against the WCAG thresholds in both palettes, including text, buttons, input borders, focus indicators, success/warning/error statuses, chart labels, and overlays. Record measurements/evidence in the inventory.

- [ ] **Step 3: Verify cross-role design consistency**

Compare shared controls (buttons, inputs, cards, badges, alerts, tables, menus, dialogs) in Student, Teacher, and Admin layouts. Confirm identical variants/sizes, typography, radii, heights, focus states, and interaction behavior while allowing route-specific layout composition. Record any justified exception.

- [ ] **Step 4: Complete route checklist and visual review**

Review each configured route and meaningful state at desktop and narrow widths across System under both OS preferences, explicit Light, and explicit Dark; include representative tablet navigation/table/builder states. Mark pass/fail/unverified with notes. Do not mark unavailable states as pass.

- [x] **Step 5: Verify full automated suite**

Run `npm.cmd test`; expected: all test files and tests pass.

- [x] **Step 6: Verify lint and production build**

Run `npm.cmd run lint` and `npm.cmd run build`; report warnings separately from errors.

- [ ] **Step 7: Review final diff and repository state**

Run `git diff --check`, inspect `git diff --stat`, and check frontend/root Git status. Preserve unrelated work, do not commit, and report remaining visual/data/tooling limitations.
