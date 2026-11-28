# Application Theme Design

## Intent

Provide consistent light and dark appearance across the LearnE web application for students, instructors, and admins, with a user-selectable **System Default**, **Light**, or **Dark** preference. The control should be easy to discover, and the chosen preference should remain consistent across visits.

## Goals

- Support all three theme choices on every authenticated role surface.
- Let System Default follow the operating system/browser `prefers-color-scheme` preference, including changes while the app is open.
- Persist the selected preference locally in the browser, independent of the signed-in role/account.
- Use the existing React, Tailwind CSS v4, and shadcn-style component setup; do not add a backend dependency or parallel theme library.
- Use theme tokens for shared layout and page surfaces so dark mode is complete rather than a header-only treatment.
- Provide an accessible, clearly labeled three-choice control in a consistent, visible location in authenticated headers.
- Apply the preference consistently to the whole single-page application, including authentication and other unauthenticated routes; the preference is browser-level, not account-level.

## Non-goals

- Persisting preferences to the backend or synchronizing them across devices.
- Redesigning page layouts or changing role-specific functionality.

## Approaches Considered

1. **Shared theme provider + app-wide token migration (selected).** Store `system | light | dark` in local storage, resolve system mode from `prefers-color-scheme`, apply the active class/data attribute at the document root, and use shared CSS variables through authenticated screens. This meets the all-role requirement and is consistent with the existing shadcn/Tailwind token foundation; it requires auditing existing hard-coded light colors.
2. **Theme toggle limited to shared chrome.** Add the preference control and change only headers/navigation. This is smaller but leaves much of each role’s page light in dark mode, so it does not meet the requested application-wide behavior.
3. **Backend/account preference.** Store a theme preference against the user account. This enables cross-device sync but requires backend/schema/API work and complicates pre-authentication/system behavior without a stated need.

## Design

- Follow the shadcn/ui [Vite dark-mode guide](https://ui.shadcn.com/docs/dark-mode/vite): add a React theme context/provider near the existing application providers, expose `theme` and `setTheme`, and use the three preference values `system`, `light`, and `dark`.
- Initialize from local storage with a safe fallback to `system`; catch storage read/write failures and reject malformed stored values. If persistence is unavailable, continue to apply changes for the current page session without throwing or disabling the control. For `system`, resolve the active palette from `matchMedia('(prefers-color-scheme: dark)')` and listen for changes. Explicit light/dark choices override that resolution.
- As in the guide, remove stale `light`/`dark` classes and apply the resolved class to `document.documentElement`; update it immediately when the preference or system mode changes. Also listen for system media-query changes while `system` is selected and clean up the listener. Define both palettes using the existing shadcn CSS variables in `src/index.css`, with Tailwind's dark variant configured to follow the `.dark` class if needed for this Tailwind v4 setup.
- Add one shared shadcn-style theme selector using the existing Radix/shadcn primitives and Lucide icons, following the guide's dropdown pattern for Light, Dark, and System choices. Give the trigger an accessible name and make the current choice perceivable in the menu (for example, Radix checked menu items or an equivalent selected state). Mount the same control in the default `AppShell` header actions and in the custom student header (which bypasses the default header); preserve existing notification and account actions. All authenticated layouts/routes for STUDENT, TEACHER, and ADMIN must expose the selector.
- Audit authenticated layouts, shared UI primitives, and role pages for hard-coded light-only surface/text/border colors. Replace them with semantic theme tokens/utilities, retaining intentional brand colors and status colors. Check dialogs, menus, forms, tables, and empty/error states as part of the audit.
- Coverage acceptance: visit every authenticated route available in the frontend route configuration for STUDENT, TEACHER, and ADMIN, in both resolved light and dark modes. Check initial page state and applicable dialogs, menus, forms, tables, loading/empty/error states, and other interactive overlays. Each must use readable foreground/background and visible borders/focus indicators consistent with the selected mode. The theme control must be present in all three role layouts. No authenticated route may retain an unintended light-only page background, surface, text, border, input, or overlay. Intentional brand/status colors and third-party/externally rendered content may remain fixed only when legible in both modes; record any such exceptions during implementation.
- Add tests for preference persistence, invalid/unavailable storage fallback, explicit overrides, system preference changes, global application (including public routes), and selector availability from all role layouts. Verify that the selector exposes the current choice as selected/checked, has an accessible name, and supports keyboard navigation and activation through its chosen Radix pattern. Verify with frontend tests, lint, and production build.

## Constraints and Builder Calls

- Follow the shadcn/ui Vite dark-mode guide's root provider, document-root class, and mode-dropdown approach; the guide is the implementation reference rather than a request to copy its sample verbatim.
- No backend or database changes.
- The preference is browser-local and shared between roles on that browser.
- The preference applies to the whole application, including unauthenticated routes, because it is a browser-level display setting.
- Existing role-specific layout composition remains intact; render one shared theme-control component in both the default shell header and the custom student header rather than implementing separate controls.
- Keep all changes within the frontend submodule; do not modify root submodule pointers.
- The builder may choose the exact shadcn primitive composition and semantic Tailwind class mapping based on existing components, provided the three choices and accessibility requirements remain clear. When storage is unusable, session-only theme updates are the required fallback.
