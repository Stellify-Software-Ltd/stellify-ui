/**
 * @stellify/ui — entry point
 *
 * Loading this module registers every <s-*> custom element
 * with the browser. Side-effecting imports below; no exports
 * are needed for the typical "drop a script tag in your layout"
 * use case.
 *
 * If you want direct programmatic access to a class (e.g. to
 * subclass it), import from the specific component module.
 */

import './components/s-sidebar.js'
import './components/s-form.js'
import './components/s-field.js'
import './components/s-checkbox.js'

// Re-export classes for advanced consumers
export { SSidebar } from './components/s-sidebar.js'
export { SForm } from './components/s-form.js'
export { SField } from './components/s-field.js'
export { SCheckbox } from './components/s-checkbox.js'

// Re-export primitives for consumers building their own components
export { persistedState } from './primitives/persisted-state.js'
export { tooltipManager, type TooltipScope } from './primitives/tooltip-manager.js'
