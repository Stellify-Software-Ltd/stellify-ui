# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.0] - 2025

### Added

- `<st-theme-switcher>` — Light/dark/system theme switcher component. Manages the `.dark` class on `<html>` based on user preference or OS setting. Wraps buttons with `data-theme="light|dark|system"` attributes. Persists choice to localStorage (`stellify.theme`). Syncs state across multiple instances on the same page. Fires `st-theme-switcher:change` events with `{ theme, resolvedTheme }` detail.

- Theme initialization script (`src/theme-init.js`) — Paste-into-head IIFE that applies the saved theme synchronously before page render, preventing flash of wrong theme. See the file for minified and expanded versions.

## [0.8.0] - 2025

### Changed

- **BREAKING:** Removed theme token files (`tokens/shadcn.css`, `tokens/editorial.css`, `tokens/neutral.css`). Surface styling (background, text colour, borders) is now the consumer's responsibility via Tailwind utilities or custom CSS. Components are now purely structural primitives.

- **BREAKING:** `<st-dialog>` no longer applies `background`, `color`, `border`, `border-radius`, `padding`, `box-shadow`, or `backdrop` styles. Apply all surface styling via classes on the `<dialog>` element (e.g. `bg-popover text-popover-foreground border rounded-lg p-6 shadow-xl`).

### Removed

- `--st-bg-*`, `--st-fg-*`, `--st-rule*`, `--st-action*`, `--st-positive`, `--st-negative`, `--st-focus-ring`, and `--st-font-*` tokens. Use your app's existing design tokens or Tailwind utilities instead.

## [0.7.4] - 2025

### Fixed

- Added `--popover`, `--popover-foreground`, and `--border` aliases to `tokens/shadcn.css` for Tailwind compatibility with `bg-popover`, `text-popover-foreground`, and `border` utilities.

## [0.7.3] - 2025

### Fixed

- `<st-sidebar>` rail-mode child visibility now uses a positional selector (`:first-child`) instead of an element-type allowlist. The icon must be the first child of `.nav-item`; everything after it collapses in rail mode. This removes the need for the `.nav-icon` wrapper class.

## [0.7.2] - 2025

### Fixed

- `<st-sidebar>` toggle button click listener now uses the capture phase to ensure clicks are received before any `stopPropagation()` calls in the bubble phase.

## [0.7.1] - 2025

### Fixed

- `<st-sidebar>` toggle button discovery now uses event delegation, fixing a timing bug where buttons placed after the sidebar in document order were not discovered during `connectedCallback`. Buttons added dynamically after page load also now work correctly.

## [0.7.0] - 2025

### Added

- `<st-dialog>` — Modal and non-modal dialog component built on the native `<dialog>` element. The native element handles focus trapping, escape-to-close, top-layer rendering, and the backdrop. `st-dialog` adds declarative trigger discovery via `data-dialog-trigger`, easy programmatic open/close, light-dismiss on backdrop click (opt-out via `data-st-dialog-no-light-dismiss`), and lifecycle events (`st-dialog:open`, `st-dialog:close`). Works seamlessly with `<form method="dialog">` for cancel/confirm patterns.

## [0.6.0] - 2025

### Added

- `<st-frame>` — A region of the page that updates independently. Links and forms inside the frame navigate without a full page reload — they fetch the target URL and swap only the frame's content. The browser URL updates via `history.pushState`. The rest of the page stays untouched. Similar to Turbo Frames (Hotwire) or Inertia's partial reloads, built as an HTML Web Component.

## [0.5.0] - 2025

### Added

- `<st-sidebar>` now ships its own CSS file (`dist/components/st-sidebar.css`) containing all structural behaviour: layout, dimensions, transitions, and descendant collapse rules. Consumers no longer need width classes, transition classes, or per-element collapse utilities.

### Changed

- **BREAKING:** Sidebar styling moved from `base.css` to dedicated component CSS. Import `@stellisoft/stellify-ui/dist/components/st-sidebar.css` or include it via a `<link>` tag. The component CSS handles expanded/rail width transitions, hiding `.nav-section-label` in rail mode, centring `.nav-item` icons, and collapsing `[data-menu-trigger]` children.

- Sidebar dimensions are now configurable via CSS variables: `--st-sidebar-width` (default 16rem), `--st-sidebar-rail-width` (default 4rem), `--st-sidebar-duration` (default 200ms).

- Surface appearance (background, border, text colour) is now the consumer's responsibility. Apply these via Tailwind utilities or custom CSS on the `<st-sidebar>` element.

## [0.4.3] - 2025

### Fixed

- `<st-menu>` now always uses JS positioning instead of CSS anchor positioning, which requires additional CSS rules to work correctly.

## [0.4.2] - 2025

### Fixed

- `<st-menu>` now removes the `hidden` attribute when using the Popover API, fixing menus not appearing.

## [0.4.1] - 2025

### Fixed

- Tooltip class name now correctly uses `st-tooltip` instead of `sk-tooltip` (missed during 0.3.1 rename).

## [0.4.0] - 2025

### Added

- `<st-menu>` — Dropdown/popup menu primitive with keyboard navigation, Popover API support, and automatic positioning. Used for user menus, action menus, and context menus.

## [0.3.1] - 2025

### Changed

- **BREAKING:** All component names changed from `s-*` to `st-*` prefix (e.g., `<s-field>` is now `<st-field>`). This avoids naming collisions with other component libraries.
- **BREAKING:** All CSS custom property tokens changed from `--s-*` to `--st-*` prefix (e.g., `--s-bg-canvas` is now `--st-bg-canvas`).
- **BREAKING:** Custom events renamed: `s-checkbox:change` → `st-checkbox:change`, `s-sidebar:change` → `st-sidebar:change`.
- **BREAKING:** Exported class names changed: `SField` → `StField`, `SForm` → `StForm`, `SCheckbox` → `StCheckbox`, `SSidebar` → `StSidebar`.

## [0.3.0] - 2025

### Changed

- **BREAKING:** All component names changed from `sk-*` to `s-*` prefix (e.g., `<sk-field>` is now `<s-field>`). The "s" stands for "stellify" — these components are not tied to any specific starter kit.
- **BREAKING:** All CSS custom property tokens changed from `--sk-*` to `--s-*` prefix (e.g., `--sk-bg-canvas` is now `--s-bg-canvas`).
- **BREAKING:** Custom events renamed: `sk-checkbox:change` → `s-checkbox:change`, `sk-sidebar:change` → `s-sidebar:change`.
- **BREAKING:** Exported class names changed: `SkField` → `SField`, `SkForm` → `SForm`, `SkCheckbox` → `SCheckbox`, `SkSidebar` → `SSidebar`.

## [0.2.1] - 2025

### Fixed

- Include rebuilt dist in package (0.2.0 was published with stale build artifacts)

## [0.2.0] - 2025

### Changed

- **BREAKING:** `<st-field>` no longer accepts an `error` attribute. The component now reads its initial error state from the DOM produced by the server. Render errors directly in Blade using `<p data-error>` and `aria-invalid` on the input. See README for migration guide.

## [0.1.4] - 2025

- `<st-field>` now accepts an `error` attribute for simplified server-rendered validation errors.

## [0.1.0] - 2024

### Added

- **Components**
  - `<st-form>` — Form wrapper with client-side validation orchestration, loading states, and server error handling
  - `<st-field>` — Field wrapper with blur validation, input clearing, and password reveal support
  - `<st-checkbox>` — Checkbox component with indeterminate state support
  - `<st-sidebar>` — Collapsible sidebar with persisted state and tooltip-on-collapse behavior

- **Primitives**
  - `persistedState` — localStorage-backed reactive state helper
  - `tooltipManager` — Scoped tooltip singleton for sidebar collapse mode

- **Design Tokens**
  - Base CSS custom properties (`tokens/base.css`)
  - Theme presets: shadcn, editorial, neutral

- **Build**
  - ESM-only output via esbuild
  - TypeScript declarations
  - CSS token bundling
