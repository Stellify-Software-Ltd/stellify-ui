import { persistedState } from '../primitives/persisted-state.js'
import { tooltipManager, type TooltipScope } from '../primitives/tooltip-manager.js'

const STATE_KEY = 'stellify.sidebar.state'

type SidebarState = 'expanded' | 'rail'

/**
 * <st-sidebar>
 *
 * Wraps existing sidebar markup (header, nav, footer as direct children).
 * Manages collapsed/expanded state, persists it to localStorage,
 * wires an external toggle button via aria-controls, handles ⌘B,
 * supports arrow-key navigation through nav items, and shows
 * tooltips on icons when in rail mode.
 *
 * The visual transitions are entirely CSS-driven via the data-state
 * attribute. The component never sets style.width or similar.
 */
export class StSidebar extends HTMLElement {
  private _mounted = false
  private _cleanups: Array<() => void> = []
  private _toggleBtn: HTMLElement | null = null
  private _tooltipScope: TooltipScope | null = null

  connectedCallback() {
    if (this._mounted) return
    this._mounted = true

    this._initState()
    this._initToggleButton()
    this._initKeyboardShortcut()
    this._initNavKeys()
    this._initNavClick()
    this._initTooltips()
  }

  disconnectedCallback() {
    this._cleanups.forEach((fn) => fn())
    this._cleanups = []
    this._tooltipScope?.detach()
    this._tooltipScope = null
    this._mounted = false
  }

  // ---------- Public API ---------------------------------------------------

  toggle() {
    this.setState(this.state === 'rail' ? 'expanded' : 'rail')
  }

  setState(next: SidebarState) {
    if (next !== 'rail' && next !== 'expanded') return
    this.setAttribute('data-state', next)
    persistedState.set(STATE_KEY, next)
    this._syncToggleAria()
    this.dispatchEvent(
      new CustomEvent('st-sidebar:change', {
        detail: { state: next },
        bubbles: true,
      }),
    )
  }

  get state(): SidebarState {
    return (this.getAttribute('data-state') as SidebarState) || 'expanded'
  }

  // ---------- State persistence -------------------------------------------

  private _initState() {
    const saved = persistedState.get(STATE_KEY) as SidebarState | null
    if (saved && this.getAttribute('data-state') !== saved) {
      this.setAttribute('data-state', saved)
    } else if (!this.hasAttribute('data-state')) {
      this.setAttribute('data-state', 'expanded')
    }
    this._syncToggleAria()
  }

  // ---------- External toggle button --------------------------------------

  private _initToggleButton() {
    // Event delegation: listen on document, react when any matching toggle is clicked.
    // Robust to buttons that don't exist yet at connectedCallback time, buttons added
    // later via dynamic rendering, and multiple toggles targeting the same sidebar.
    const handler = (e: Event) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>(
        '[data-sidebar-toggle]',
      )
      if (!btn) return
      // If sidebar has an id, only respond to buttons that target it via aria-controls
      if (this.id && btn.getAttribute('aria-controls') !== this.id) return
      this.toggle()
    }
    // Use capture phase so we receive the event before any stopPropagation() in the bubble phase
    document.addEventListener('click', handler, true)
    this._cleanups.push(() => document.removeEventListener('click', handler, true))

    // Find the button reference for ARIA sync (best-effort, deferred to allow DOM to parse)
    queueMicrotask(() => {
      this._toggleBtn = this.id
        ? document.querySelector<HTMLElement>(`[aria-controls="${this.id}"]`)
        : document.querySelector<HTMLElement>('[data-sidebar-toggle]')
      this._syncToggleAria()
    })
  }

  private _syncToggleAria() {
    if (!this._toggleBtn) return
    this._toggleBtn.setAttribute(
      'aria-expanded',
      this.state === 'expanded' ? 'true' : 'false',
    )
  }

  // ---------- App-level keyboard shortcut ---------------------------------

  private _initKeyboardShortcut() {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === 'b' &&
        !e.shiftKey &&
        !e.altKey
      ) {
        e.preventDefault()
        this.toggle()
      }
    }
    document.addEventListener('keydown', onKey)
    this._cleanups.push(() => document.removeEventListener('keydown', onKey))
  }

  // ---------- Arrow-key navigation between nav items ----------------------

  private _initNavKeys() {
    const nav = this.querySelector<HTMLElement>('.sidebar-nav')
    if (!nav) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      const items = [...this.querySelectorAll<HTMLElement>('.nav-item')]
      const i = items.indexOf(document.activeElement as HTMLElement)
      if (i === -1) return
      e.preventDefault()
      const next =
        e.key === 'ArrowDown'
          ? (i + 1) % items.length
          : (i - 1 + items.length) % items.length
      items[next]?.focus()
    }
    nav.addEventListener('keydown', onKey)
    this._cleanups.push(() => nav.removeEventListener('keydown', onKey))
  }

  // ---------- Active state on click ---------------------------------------

  private _initNavClick() {
    const onClick = (e: Event) => {
      const item = (e.target as HTMLElement).closest<HTMLElement>('.nav-item')
      if (!item || !this.contains(item)) return
      e.preventDefault()
      this.querySelectorAll('.nav-item').forEach((n) =>
        n.classList.remove('is-active'),
      )
      item.classList.add('is-active')
    }
    this.addEventListener('click', onClick)
    this._cleanups.push(() => this.removeEventListener('click', onClick))
  }

  // ---------- Tooltips (only when in rail mode) ---------------------------

  private _initTooltips() {
    this._tooltipScope = tooltipManager.attach(this, {
      shouldShow: () => this.state === 'rail',
    })
    // Hide tooltip whenever state changes
    const onStateChange = () => this._tooltipScope?.detach()
    this.addEventListener('st-sidebar:change', onStateChange)
    this._cleanups.push(() =>
      this.removeEventListener('st-sidebar:change', onStateChange),
    )
  }
}

customElements.define('st-sidebar', StSidebar)

declare global {
  interface HTMLElementTagNameMap {
    'st-sidebar': StSidebar
  }
}
