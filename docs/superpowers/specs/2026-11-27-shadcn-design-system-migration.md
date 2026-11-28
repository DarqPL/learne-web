# shadcn/ui Design-System Migration

## Intent

Reduce inconsistent custom styling across the LearnE frontend and improve light/dark behavior by consolidating reusable controls and color usage around the already-installed shadcn/ui primitives and semantic theme tokens.

## Goals

- Reuse the existing `src/components/shadcn/ui/` primitives wherever their behavior fits.
- Replace redundant custom buttons, inputs, cards, alerts, badges, avatars, tables, menus, overlays, and feedback markup with existing equivalents where safe.
- Migrate custom palette classes and hard-coded colors to standard semantic tokens (`background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, and `ring`).
- Preserve route behavior, information hierarchy, responsive layout, LearnE branding, and the three-mode theme provider.
- Add or update tests for changes in component behavior and verify tests, lint, build, and theme behavior.
- Preserve keyboard, focus, labeling, validation, disabled/loading, and overlay dismissal behavior when replacing controls.
- Meet WCAG 2.1 AA contrast targets for text and essential controls in both resolved palettes.
- Standardize the broader design system: typography scale, font weights, radius, shadows/elevation, spacing conventions, button variants/sizes, input heights, and card composition.
- Keep shared controls visually and behaviorally consistent across Student, Teacher, and Admin, even where page layouts differ.

## Non-goals and anti-goals

- No visual redesign, new component library, or new dependency.
- Do not rewrite page layouts merely to imitate shadcn examples.
- Do not force specialized audio/video players, rich-text editors, interactive learning activities, or course-builder workflows into generic shadcn components; standardize their surrounding controls and surfaces instead.
- Do not remove meaningful success/warning/error/status distinctions. Preserve them with accessible semantic status tokens or variants in both palettes.
- Do not change API, navigation, validation, authorization, or business behavior as part of styling migration.
- Do not rewrite component APIs or business logic unnecessarily; preserve existing public props and behavior unless a narrowly scoped compatibility adjustment is required.

## Scope inventory

- **Routes:** every route configured in `src/App.tsx`, including public/auth routes, `/change-password`, student, teacher, admin, root redirect, and not-found. The canonical route list and per-route recording table are `docs/superpowers/plans/2026-11-27-application-theme-route-checklist.md`; update it if route configuration changes.
- **Shared components:** all reusable controls in `src/components/ui/`, all existing primitives in `src/components/shadcn/ui/`, shared authenticated layouts/headers/sidebars, theme selector, notification surfaces, and course-media dialogs.
- **Design-system properties:** typography and heading/body hierarchy, font sizes and weights, border-radius scale, shadows/elevation, spacing conventions, button variants and sizes, input/control heights, and card structure/styling.
- **Page content:** all routed page components and reusable subcomponents, including forms, tables, status/empty/loading/error states, charts, chat, course/lesson builder flows, and payment states.
- **Themes:** System Default under OS light and OS dark preferences, explicit Light, and explicit Dark. Each route is visually checked in both resolved palettes; persisted/manual/system selection behavior is also checked.
- **Viewport coverage:** inspect every route at desktop and narrow/mobile widths; inspect representative tablet behavior for shared navigation, dense tables, and builder layouts. Record overflow/layout failures in the checklist.
- **Interactive states:** inspect available initial, loading, empty, error, validation, disabled/loading action, and populated states. For routes requiring backend data, use deterministic existing fixtures/mocks where suitable; otherwise record exact unavailable states and reasons.

The route checklist is mandatory evidence. A route is not complete merely because its default screen renders or tests pass.

## Approaches considered

1. **Incremental semantic migration (selected):** migrate shared primitives first, then route surfaces in focused groups; retain page-specific structure and branding while replacing custom colors and redundant controls. This keeps behavior reviewable and minimizes visual regression risk.
2. **Broad layout rewrite:** refactor all screens to new shadcn compositions. Rejected because it unnecessarily changes layout and branding, substantially increasing regression risk.
3. **Palette-only pass:** replace color classes without consolidating custom controls. Rejected because it leaves the component inconsistencies the request specifically asks to reduce.

## Constraints and implementation calls

- `frontend/components.json` configures shadcn New York style, neutral base color, Tailwind CSS 4, React (not RSC), `lucide-react`, and aliases under `@/components/shadcn/ui`.
- Existing shadcn primitives are in `src/components/shadcn/ui/`; legacy custom wrappers are in `src/components/ui/`. Prefer existing primitives and wrappers only where they preserve behavior/accessibility; do not add duplicate implementations.
- **Color policy:** fixed colors are permitted only for original brand artwork/logomarks and media content that is not UI chrome. Chart series use shadcn-compatible `--chart-1` through `--chart-5` theme variables. Preserve semantic status distinctions with success/warning/error/status tokens or existing Badge/Alert variants; define each needed status token in both palettes and document contrast. Do not leave fixed colors for UI surfaces, body text, borders, focus, or interactive states. Add a brief inline code comment and record every exception with its reason in the checklist/design-system notes.
- **Design-system consistency:** inventory existing typography, radius, shadow/elevation, spacing, button variant/size, input-height, and card conventions before changing them. Consolidate to a small documented scale using existing shadcn conventions; retain established hierarchy and page-specific layout. Shared control variants and interaction states must be the same across roles.
- **Specialized component boundary:** audio/video players, rich text editors, interactive learning activities, and course-builder interactions may retain purpose-built implementation and APIs. Migrate their surrounding cards, labels, fields, actions, menus, dialogs, and status surfaces to shared primitives/tokens without rewriting their core behavior.
- **Minimal-change rule:** preserve existing functionality and component APIs; refactor only the surface/component code necessary for consistency. Any API change must be justified in the migration inventory and covered by compatibility tests.
- **Contrast/readability:** verify WCAG 2.1 AA text contrast (4.5:1 for normal text; 3:1 for large text). Essential control boundaries, focus indicators, and meaningful non-text icons must reach 3:1 against adjacent colors. Disabled controls are exempt only where WCAG permits and must remain distinguishable. Check semantic pairs in both palettes, including status and chart labels.
- **Interaction parity:** tests/manual checks preserve accessible names/labels, form submission and validation, keyboard operation, visible focus, disabled/loading behavior, selection, dialog/sheet focus containment and dismissal, and menu/selector keyboard behavior. Add focused regression tests for changed behavior.
- **Visual evidence:** record each route/theme/viewport/state as pass/fail/unverified in the checklist with a concise note; retain screenshots/browser captures when tooling supports them. Token scans and automated tests do not count as visual verification.
- Work in small, testable batches: inventory custom primitive usage and fixed colors; migrate shared wrappers/primitives; migrate page groups; audit overlays, charts, status states, focus, and both palettes; then run the full verification suite and review the diff.
- If browser tooling or authenticated route data is unavailable, list the exact unverified routes/states rather than claiming full visual completion.

## Acceptance criteria

- Reusable UI in scope uses existing shadcn primitives instead of parallel custom implementations where equivalent behavior exists.
- Typography, font weights/sizes, radius, elevation, spacing, button variants/sizes, input heights, and card styling follow the documented shared design-system scale across roles.
- Application surfaces, text, borders, controls, and overlays use semantic tokens across light and dark themes; documented exceptions are intentional and readable.
- Meaningful success/warning/error/status distinctions remain recognizable and meet contrast requirements in both palettes.
- Specialized components retain their core implementations/APIs while their surrounding UI uses shared primitives and tokens.
- Shared controls have consistent visual variants and interaction behavior across Student, Teacher, and Admin.
- Contrast checks meet the thresholds above across both palettes; failures are fixed or recorded as blockers.
- Every configured route has checklist evidence for System under OS-light and OS-dark, explicit Light, and explicit Dark at desktop and narrow/mobile widths, plus representative tablet checks for shared responsive patterns. Each route has a default and at least one meaningful interactive/data state checked or a specific blocker recorded.
- Updated controls preserve the interaction/accessibility behaviors above, supported by tests and manual checks as applicable.
- Existing component APIs and business behavior remain intact except for documented, compatibility-tested changes necessary to achieve the shared system.
- Existing app behavior and branding are preserved.
- Full frontend tests, lint, and production build are run; failures and warnings are reported accurately.
- Route/state visual verification is recorded honestly, including any tooling/data limitations.
