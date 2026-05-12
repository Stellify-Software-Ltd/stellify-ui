# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
