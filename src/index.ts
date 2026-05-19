/**
 * @stellify/ui — entry point
 *
 * Loading this module registers every <st-*> custom element
 * with the browser. Side-effecting imports below; no exports
 * are needed for the typical "drop a script tag in your layout"
 * use case.
 *
 * If you want direct programmatic access to a class (e.g. to
 * subclass it), import from the specific component module.
 */

import './components/st-sidebar.js'
import './components/st-form.js'
import './components/st-field.js'
import './components/st-checkbox.js'
import './components/st-menu.js'
import './components/st-frame.js'
import './components/st-dialog.js'

// Re-export classes for advanced consumers
export { StSidebar } from './components/st-sidebar.js'
export { StForm } from './components/st-form.js'
export { StField } from './components/st-field.js'
export { StCheckbox } from './components/st-checkbox.js'
export { StMenu } from './components/st-menu.js'
export { StFrame } from './components/st-frame.js'
export { StDialog } from './components/st-dialog.js'

// Re-export primitives for consumers building their own components
export { persistedState } from './primitives/persisted-state.js'
export { tooltipManager, type TooltipScope } from './primitives/tooltip-manager.js'
