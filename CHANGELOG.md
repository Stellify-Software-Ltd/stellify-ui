# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2025

### Fixed

- Include rebuilt dist in package (0.2.0 was published with stale build artifacts)

## [0.2.0] - 2025

### Changed

- **BREAKING:** `<sk-field>` no longer accepts an `error` attribute. The component now reads its initial error state from the DOM produced by the server. Render errors directly in Blade using `<p data-error>` and `aria-invalid` on the input. See README for migration guide.

## [0.1.4] - 2025

- `<sk-field>` now accepts an `error` attribute for simplified server-rendered validation errors.

## [0.1.0] - 2024

### Added

- **Components**
  - `<sk-form>` — Form wrapper with client-side validation orchestration, loading states, and server error handling
  - `<sk-field>` — Field wrapper with blur validation, input clearing, and password reveal support
  - `<sk-checkbox>` — Checkbox component with indeterminate state support
  - `<sk-sidebar>` — Collapsible sidebar with persisted state and tooltip-on-collapse behavior

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
