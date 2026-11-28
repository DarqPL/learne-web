# Auth Theme Selector and Migration Closeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the existing persistent System/Light/Dark selector to unauthenticated users and close out source inventory, manual route/theme records, and verification for the frontend migration.

**Architecture:** Reuse `ThemeModeToggle` inside the shared `AuthLayout`, which already wraps login, register, forgot-password, and reset-password routes; `ThemeProvider` already wraps the application above routing. Add a focused layout regression test for public visibility, theme switching, and local persistence. Finish with source scans, inventory/checklist reconciliation, and full frontend checks.

**Tech Stack:** React 19, TypeScript, React Router 7, Tailwind CSS 4, existing shadcn DropdownMenu/Button primitives, Vitest/Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-27-shadcn-design-system-migration.md`

## Global Constraints

- No visual redesign, new component library, or new dependency.
- Preserve route behavior, information hierarchy, responsive layout, LearnE branding, and the three-mode theme provider.
- Keep theme preference client-side and locally persistent; no backend changes.
- Preserve meaningful status distinctions and intentional brand/media artwork; do not replace color blindly.
- Do not claim browser visual review beyond the user's stated manual review; distinguish manual from automated evidence.
- Do not commit changes.

## Review Focus

- Fresh unauthenticated visit with no stored preference: defaults to System and follows OS resolution; test shared layout selector is available.
- Existing stored Dark/Light choice: selector reflects and preserves the preference across auth routes; test selecting Dark writes `learne-ui-theme` and sets root class.
- Keyboard access and focus: existing Radix dropdown/menu semantics remain intact; test accessible trigger and menu radio items.
- Responsive auth placement: avoid obstructing centered logo/form and keep selector reachable; cover with class/layout assertion and rely on manually reviewed routes for appearance.
- Authentication boundary: selector uses the same provider before and after sign-in; assert AuthLayout shares the existing selector rather than adding independent state.

---

## File Structure

- Modify `src/layouts/AuthLayout.tsx`: add the shared selector in a naturally positioned, responsive auth-layout control area.
- Create `src/layouts/AuthLayout.test.tsx`: verify public selector presence, System/Light/Dark menu accessibility, local persistence, and resolved root theme.
- Modify `docs/superpowers/plans/2026-11-27-shadcn-migration-inventory.md`: remove stale statements, list current intentional fixed-palette exceptions with rationale, record verification.
- Modify `docs/superpowers/plans/2026-11-27-application-theme-route-checklist.md`: record manual review as user-confirmed and retain distinct automated/manual evidence.
- Modify `docs/superpowers/specs/2026-11-27-shadcn-design-system-migration.md` only if final exception policy or acceptance status requires a concise closeout note.

### Task 1: Public/auth theme selection

**Files:**
- Modify: `src/layouts/AuthLayout.tsx`
- Create: `src/layouts/AuthLayout.test.tsx`
- Existing dependencies: `src/components/theme/ThemeModeToggle.tsx`, `src/lib/theme/ThemeProvider.tsx`

**Interfaces:**
- Consumes `ThemeModeToggle` as the existing no-props control and the app-provided `ThemeProvider` context.
- Produces one visible accessible selector with System Default, Light, and Dark choices on all routes rendered through `AuthLayout`.

- [x] **Step 1: Write failing tests** for `AuthLayout` asserting the button named `Theme` is visible, opening it exposes radio menu items `System Default`, `Light`, `Dark`, choosing Dark adds `.dark` to `<html>` and persists `learne-ui-theme=dark`.
- [x] **Step 2: Run the focused test**: `npm.cmd test -- src/layouts/AuthLayout.test.tsx`; confirmed failure because no selector existed in the layout.
- [x] **Step 3: Add `ThemeModeToggle` to `AuthLayout`**, positioned near the top edge in an absolute or equivalent non-flow wrapper that stays reachable on narrow viewports and does not change the centered brand/form hierarchy.
- [x] **Step 4: Run focused and related auth tests**: `npm.cmd test -- src/layouts/AuthLayout.test.tsx src/pages/auth/LoginPage.test.tsx src/pages/auth/RegisterPage.test.tsx src/pages/auth/ForgotPasswordPage.test.tsx src/pages/auth/ResetPasswordPage.test.tsx`; passed 5 files / 47 tests.

### Task 2: Migration inventory and route/theme closeout

**Files:**
- Modify: `docs/superpowers/plans/2026-11-27-shadcn-migration-inventory.md`
- Modify: `docs/superpowers/plans/2026-11-27-application-theme-route-checklist.md`
- Optionally modify: `docs/superpowers/specs/2026-11-27-shadcn-design-system-migration.md`

**Interfaces:**
- Uses current source scans and user-provided confirmation that manual browser review across reviewed routes/themes was performed and UI looks good.
- Records visual review as manual confirmation, not as automated browser evidence; do not invent per-route viewport/state details that were not provided.

- [x] **Step 1: Scan current production sources** for fixed Tailwind palette classes and literal colors, classify remaining matches, and migrate uncovered functional UI. Targeted `.ts`/`.tsx`/`.css` scan found quiz outcome tones, stale fixed admin review status maps, and a fixed teacher builder card; migrated to semantic tokens and added/updated focused tests. Exact candidate art/media/content exceptions and scan limitations are in the inventory.
- [x] **Step 2: Reconcile inventory** by removing contradictory stale claims, documenting current candidate exception categories, rationale, scan limits, and fresh verification results.
- [x] **Step 3: Reconcile route checklist**: record the user's manual review confirmation separately from automation; because exact route/theme/state/viewport coverage was not enumerated, no unspecified route/theme cells were marked visually verified.
- [x] **Step 4: Review docs for internal consistency** against current source, approved spec, and manual-review scope; preserve evidence limits.

### Task 3: Final verification

**Files:**
- No additional files; verify current changed frontend submodule.

**Interfaces:**
- Consumes output of Tasks 1–2.
- Produces exact test/lint/build/diff-check results for final report and inventory.

- [x] **Step 1: Run** `npm.cmd test`; 75 files / 582 tests passed; Vitest noted 75 jsdom environments / 196.95s tracked time.
- [x] **Step 2: Run** `npm.cmd run lint`; 0 errors and 2 hook-dependency warnings in `AdminStudentListPage.tsx:76` and `AdminCouponPage.tsx:489` (missing `page`).
- [x] **Step 3: Run** `npm.cmd run build`; TypeScript and Vite production build passed.
- [x] **Step 4: Run** `git diff --check`; no whitespace errors, only LF-to-CRLF working-copy warnings.
- [x] **Step 5: Update inventory with these fresh exact results**; no commit created.

## Self-review

- Spec coverage: auth/public selector and preference persistence (Task 1); functional color scan and exception records (Task 2); manual/automated distinction and honest limits (Task 2); full checks/no commit (Task 3).
- Test focus covers first visit visibility, menu choices, theme selection, persistence, and root resolution. Existing theme provider/toggle tests cover OS mode behavior; no provider changes are planned.
- The user confirms manual review but does not enumerate route/state/viewport coverage. Checklist closeout must not infer that every listed route or interactive state was personally reviewed; retain explicit unverified entries where evidence scope is unknown.
