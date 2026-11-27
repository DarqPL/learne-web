# Application Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persisted System/Light/Dark modes across the LearnE web application for students, teachers, and admins.

**Architecture:** Follow shadcn/ui's Vite dark-mode approach with a root `ThemeProvider`, `system | light | dark` preference in local storage, and resolved `.light`/`.dark` classes on `<html>`. A shared dropdown in authenticated headers selects the preference; the existing CSS variables and page styles are migrated so all routes render appropriately in either mode.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, existing shadcn/Radix components, Lucide, Vitest, Testing Library.

**Spec:** `frontend/docs/superpowers/specs/2026-11-27-application-theme-design.md`

## Global Constraints

- Follow the shadcn/ui Vite dark-mode guide's root provider, document-root class, and mode-dropdown approach; the guide is the implementation reference rather than a request to copy its sample verbatim.
- No backend or database changes.
- The preference is browser-local and shared between roles on that browser.
- The preference applies to the whole application, including unauthenticated routes, because it is a browser-level display setting.
- Keep all changes within the frontend submodule; do not modify root submodule pointers.
- When storage is unusable, session-only theme updates are the required fallback.

## Review Focus

- Invalid stored preference: provider falls back to `system` and replaces it only after a valid user selection; test malformed values.
- Storage read/write exceptions: app still renders and selection updates for current session; test throwing `getItem` and `setItem`.
- System preference changes: resolved root class updates only while preference is `system`; test matching and non-matching mode changes and listener cleanup.
- Student's custom header: selector remains available even though it bypasses AppShell's default header; test role header controls.
- Dark-mode coverage: pages and transient surfaces with fixed light colors remain legible; run route/style audit and test representative dialogs, forms, tables, and menus.

---

## File Map

- Create `frontend/src/lib/theme/ThemeProvider.tsx` and `ThemeProvider.test.tsx`: preference state, persistence, system resolution, root class, and hook.
- Create `frontend/src/components/theme/ThemeModeToggle.tsx` and test: accessible shared three-option shadcn-style menu.
- Modify `frontend/src/main.tsx`: mount provider around the application so the preference applies to every route.
- Modify `frontend/src/index.css` and `frontend/src/components/shadcn/ui/*` only as needed: light/dark semantic tokens and Tailwind v4 dark variant alignment.
- Modify `frontend/src/layouts/AppShell.tsx`, `StudentLayout.tsx`, and related layout tests: shared selector availability in default and custom headers.
- Modify authenticated page/layout/shared component TSX files under `frontend/src/`: replace unintended fixed light-only surface, text, border, and input classes with semantic theme styles.
- Add/update focused tests with the relevant components/pages for theme menu selection and role access; retain existing behavior tests.

## Tasks

### Task 1: Theme provider and preference behavior

**Files:**
- Create: `frontend/src/lib/theme/ThemeProvider.tsx`
- Test: `frontend/src/lib/theme/ThemeProvider.test.tsx`
- Modify: `frontend/src/main.tsx`
- Test helper: `frontend/src/test/setup.ts` if required for `matchMedia`

**Interfaces:**
- Produces `Theme = 'system' | 'light' | 'dark'`.
- Produces `ThemeProvider({ children, storageKey? }: { children: React.ReactNode; storageKey?: string })` with default storage key `learne-ui-theme`.
- Produces `useTheme(): { theme: Theme; setTheme: (theme: Theme) => void }`.
- Unknown stored values and storage read failures resolve to `system`; storage write failures do not block state changes.

- [ ] **Step 1: Write tests** for default `system`, valid stored values, malformed stored value fallback, read exception fallback, set persistence, write exception session update, explicit light/dark root classes, system root class, `matchMedia` changes under system mode, and media listener cleanup.
- [ ] **Step 2: Run the focused test** with `npm test -- src/lib/theme/ThemeProvider.test.tsx`; verify failure before implementation.
- [ ] **Step 3: Implement provider and hook** in `ThemeProvider.tsx`; apply the resolved class to `document.documentElement`, remove the opposing class, and guard browser storage/media APIs.
- [ ] **Step 4: Mount provider** in `main.tsx` around the app so public and authenticated routes share the same preference.
- [ ] **Step 5: Run focused tests** with `npm test -- src/lib/theme/ThemeProvider.test.tsx`; expect all provider behavior tests to pass.

### Task 2: Theme tokens and accessible selector

**Files:**
- Create: `frontend/src/components/theme/ThemeModeToggle.tsx`
- Test: `frontend/src/components/theme/ThemeModeToggle.test.tsx`
- Modify: `frontend/src/index.css`
- Modify shadcn primitive only if required: relevant dropdown menu files under `frontend/src/components/shadcn/ui/`

**Interfaces:**
- Consumes `useTheme()` from Task 1.
- Produces a menu trigger named `Giao diện` (or equivalent clear localized label) with Light, Dark, and System options; current option is exposed as checked/selected.

- [ ] **Step 1: Write tests** asserting trigger accessible name, all three labeled options, current selection semantics, keyboard opening/navigation/activation, and `setTheme` calls for each option.
- [ ] **Step 2: Run focused tests** with `npm test -- src/components/theme/ThemeModeToggle.test.tsx`; verify failure before implementation.
- [ ] **Step 3: Define both CSS variable palettes** in `index.css`, retaining the current light colors and adding coordinated dark values for background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, and ring. Ensure Tailwind's `dark:` variant follows the root `.dark` class.
- [ ] **Step 4: Implement the shared menu** using existing shadcn DropdownMenu components and Lucide icons; display the selected state and accessible labels.
- [ ] **Step 5: Run focused tests** with `npm test -- src/components/theme/ThemeModeToggle.test.tsx`; expect all interaction and accessibility assertions to pass.

### Task 3: Selector in every authenticated role header

**Files:**
- Modify: `frontend/src/layouts/AppShell.tsx`
- Modify: `frontend/src/layouts/StudentLayout.tsx`
- Tests: `frontend/src/layouts/AppShell.test.tsx`, `frontend/src/layouts/StudentLayout.test.tsx`, and `frontend/src/layouts/AdminLayout.test.tsx` as needed
- Modify: `frontend/src/layouts/TeacherLayout.tsx` only if header composition needs adjustment

**Interfaces:**
- Consumes the shared `ThemeModeToggle` from Task 2.
- Existing notification and account actions remain present and functional.

- [ ] **Step 1: Add role-layout tests** asserting the theme control is reachable from Student, Teacher, and Admin authenticated layouts, including the custom student header.
- [ ] **Step 2: Run focused layout tests**; verify student coverage fails before adding its control and role tests establish existing/default header behavior.
- [ ] **Step 3: Render one shared selector** in AppShell's standard header action area and StudentLayout's custom header adjacent to account actions; preserve notification action composition.
- [ ] **Step 4: Run focused layout tests** with the three role layout test files; expect selector presence and existing action assertions to pass.

### Task 4: App-wide dark-compatible styling

**Files:**
- Modify: `frontend/src/layouts/**/*.tsx`, `frontend/src/components/**/*.tsx`, and `frontend/src/pages/**/*.tsx` where hard-coded light-only colors are used.
- Tests: update existing tests only when assertions encode intentional old fixed colors; add focused component tests for affected shared overlays where no test exists.

**Interfaces:**
- Uses semantic Tailwind utilities backed by Task 2 CSS tokens (e.g. `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`, `bg-muted`, `text-primary`).
- No route, API, or role behavior changes.

- [ ] **Step 1: Audit all frontend TSX class names** for fixed light surfaces/text/borders (including `bg-white`, `bg-gray-*`, `text-gray-*`, `border-gray-*`) and record intentional brand/status/third-party exceptions in the spec or PR summary.
- [ ] **Step 2: Migrate shared chrome and primitives** first (AppShell, sidebars, student navigation/account menu, buttons/forms/cards, dialogs, sheets, dropdowns, tables, alerts) to semantic token utilities; preserve intentional brand/status colors when legible in both themes.
- [ ] **Step 3: Migrate page surfaces and states** across every route under `src/pages/`, including auth/public pages for whole-app consistency and all loading/empty/error/dialog/menu/form/table states.
- [ ] **Step 4: Run the existing test suite** with `npm test`; fix regressions caused by migrated semantic classes without weakening functional assertions.
- [ ] **Step 5: Perform route/style coverage review** for every configured authenticated route for all roles in light and dark modes, checking page surface, text, borders, inputs, focus indicators, and applicable overlays; verify no unintended light-only styling remains.

### Task 5: Full frontend verification

**Files:**
- No additional files unless verification reveals a specific regression; fix in the owning task's files.

- [ ] **Step 1: Run all tests** with `npm test`; expect all tests to pass.
- [ ] **Step 2: Run lint** with `npm run lint`; expect no lint errors.
- [ ] **Step 3: Run production build** with `npm run build`; expect TypeScript and Vite build success.
- [ ] **Step 4: Review frontend diff and status** to confirm no unrelated changes or root/submodule pointer changes are included.
