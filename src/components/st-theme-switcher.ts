import { persistedState } from '../primitives/persisted-state.js'

const STORAGE_KEY = 'stellify.theme'

type Theme = 'light' | 'dark' | 'system'

/**
 * <st-theme-switcher>
 *
 * Provides light/dark/system theme switching. Wraps buttons (or any
 * clickable elements) with data-theme="light|dark|system" attributes.
 * Manages the `.dark` class on <html> and syncs state across multiple
 * instances on the same page.
 *
 * The component listens for OS theme changes when in system mode and
 * updates the page accordingly. User's explicit choice (light/dark)
 * always wins over OS preference.
 *
 * ARIA: The component ONLY sets `aria-current="true"` on the active
 * button. It does NOT touch `role`, `aria-haspopup`, `aria-selected`,
 * or any other ARIA attributes — consumer's markup wins. This allows
 * the same component to work in segmented-pill layouts AND as menu
 * items inside st-menu (with role="menuitem" on buttons).
 *
 * Layout: The component does not set any display style. For standalone
 * use, put flex/grid classes on the host. For use inside menus, add
 * class="contents" to flatten the wrapper so buttons appear as direct
 * children of the menu container.
 *
 * Events:
 * - `st-theme-switcher:change` — Fires when theme changes, with
 *   `detail: { theme: 'light' | 'dark' | 'system', resolvedTheme: 'light' | 'dark' }`
 */
export class StThemeSwitcher extends HTMLElement {
  private _mounted = false
  private _cleanups: Array<() => void> = []
  private _mq: MediaQueryList | null = null
  private _mqListener: ((e: MediaQueryListEvent) => void) | null = null

  connectedCallback() {
    if (this._mounted) return
    this._mounted = true

    this._initTheme()
    this._initMediaQuery()
    this._initClickHandlers()
    this._initCrossInstanceSync()
  }

  disconnectedCallback() {
    this._cleanups.forEach((fn) => fn())
    this._cleanups = []
    if (this._mq && this._mqListener) {
      this._mq.removeEventListener('change', this._mqListener)
    }
    this._mq = null
    this._mqListener = null
    this._mounted = false
  }

  // ---------- Public API ---------------------------------------------------

  get theme(): Theme {
    const saved = persistedState.get(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved
    }
    return 'system'
  }

  set theme(value: Theme) {
    if (value !== 'light' && value !== 'dark' && value !== 'system') return
    this._setTheme(value)
  }

  get resolvedTheme(): 'light' | 'dark' {
    const theme = this.theme
    if (theme === 'light') return 'light'
    if (theme === 'dark') return 'dark'
    return this._getSystemTheme()
  }

  // ---------- Initialization -----------------------------------------------

  private _initTheme() {
    // Apply current theme state to DOM and sync ARIA
    this._applyTheme(this.theme)
    this._syncAria()
  }

  private _initMediaQuery() {
    this._mq = window.matchMedia('(prefers-color-scheme: dark)')
    this._mqListener = () => {
      // Only react if user is in system mode
      if (this.theme === 'system') {
        this._applyTheme('system')
        this._dispatchChange()
      }
    }
    this._mq.addEventListener('change', this._mqListener)
  }

  private _initClickHandlers() {
    const handler = (e: Event) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>(
        '[data-theme]',
      )
      if (!target || !this.contains(target)) return

      const theme = target.getAttribute('data-theme') as Theme | null
      if (theme === 'light' || theme === 'dark' || theme === 'system') {
        this._setTheme(theme)
      }
    }
    // Use capture phase to ensure we receive the event even if something
    // else calls stopPropagation() during bubble phase
    this.addEventListener('click', handler, true)
    this._cleanups.push(() => this.removeEventListener('click', handler, true))
  }

  private _initCrossInstanceSync() {
    // Listen for changes from other st-theme-switcher instances
    const handler = (e: Event) => {
      // Skip events from this instance
      if (e.target === this) return
      // Sync our ARIA to match the new theme
      this._syncAria()
    }
    document.addEventListener('st-theme-switcher:change', handler)
    this._cleanups.push(() =>
      document.removeEventListener('st-theme-switcher:change', handler),
    )
  }

  // ---------- Theme management ---------------------------------------------

  private _setTheme(theme: Theme) {
    persistedState.set(STORAGE_KEY, theme)
    this._applyTheme(theme)
    this._syncAriaAllInstances()
    this._dispatchChange()
  }

  private _applyTheme(theme: Theme) {
    const resolved = theme === 'system' ? this._getSystemTheme() : theme
    const html = document.documentElement

    if (resolved === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  private _getSystemTheme(): 'light' | 'dark' {
    return this._mq?.matches ? 'dark' : 'light'
  }

  private _dispatchChange() {
    this.dispatchEvent(
      new CustomEvent('st-theme-switcher:change', {
        detail: {
          theme: this.theme,
          resolvedTheme: this.resolvedTheme,
        },
        bubbles: true,
      }),
    )
  }

  // ---------- ARIA sync ----------------------------------------------------

  private _syncAria() {
    const currentTheme = this.theme
    const buttons = this.querySelectorAll<HTMLElement>('[data-theme]')
    buttons.forEach((btn) => {
      const btnTheme = btn.getAttribute('data-theme')
      if (btnTheme === currentTheme) {
        btn.setAttribute('aria-current', 'true')
      } else {
        btn.removeAttribute('aria-current')
      }
    })
  }

  private _syncAriaAllInstances() {
    // Sync this instance first
    this._syncAria()
    // Other instances will sync via the event listener in _initCrossInstanceSync
  }
}

customElements.define('st-theme-switcher', StThemeSwitcher)

declare global {
  interface HTMLElementTagNameMap {
    'st-theme-switcher': StThemeSwitcher
  }
}
