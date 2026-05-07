/**
 * @stellify/ui — entry point
 *
 * Loading this module registers every <sk-*> custom element
 * with the browser. Side-effecting imports below; no exports
 * are needed for the typical "drop a script tag in your layout"
 * use case.
 *
 * If you want direct programmatic access to a class (e.g. to
 * subclass it), import from the specific component module.
 */

import './components/sk-sidebar.js'
import './components/sk-form.js'
import './components/sk-field.js'
import './components/sk-checkbox.js'

// Re-export classes for advanced consumers
export { SkSidebar } from './components/sk-sidebar.js'
export { SkForm } from './components/sk-form.js'
export { SkField } from './components/sk-field.js'
export { SkCheckbox } from './components/sk-checkbox.js'

// Re-export primitives for consumers building their own components
export { persistedState } from './primitives/persisted-state.js'
export { tooltipManager, type TooltipScope } from './primitives/tooltip-manager.js'
