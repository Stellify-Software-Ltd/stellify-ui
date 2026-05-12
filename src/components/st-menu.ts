type Placement =
  | 'top'
  | 'bottom'
  | 'top-start'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-end'

const openMenus = new Set<StMenu>()

const supportsPopover = 'popover' in HTMLElement.prototype
const supportsAnchor = CSS.supports('anchor-name', '--test')

/**
 * <st-menu>
 *
 * Dropdown/popup menu primitive. Discovers trigger and content via
 * data-menu-trigger and data-menu-content attributes.
 * Uses native Popover API where available, with fallback for older browsers.
 */
export class StMenu extends HTMLElement {
  private _mounted = false
  private _cleanups: Array<() => void> = []
  private _trigger: HTMLElement | null = null
  private _content: HTMLElement | null = null
  private _isOpen = false

  connectedCallback() {
    if (this._mounted) return
    this._mounted = true

    this._discover()
    if (!this._trigger || !this._content) return

    this._initAria()
    this._initTrigger()
    this._initKeyboard()

    if (supportsPopover) {
      this._initPopover()
    }
  }

  disconnectedCallback() {
    this._cleanups.forEach((fn) => fn())
    this._cleanups = []
    openMenus.delete(this)
    this._mounted = false
  }

  // ---------- Public API ---------------------------------------------------

  get open(): boolean {
    return this._isOpen
  }

  get placement(): Placement {
    return (this.getAttribute('placement') as Placement) || 'bottom-start'
  }

  set placement(value: Placement) {
    this.setAttribute('placement', value)
  }

  show() {
    if (this._isOpen || !this._trigger || !this._content) return

    // Close other open menus
    openMenus.forEach((menu) => {
      if (menu !== this) menu.hide()
    })
    openMenus.add(this)

    this._isOpen = true
    this._trigger.setAttribute('aria-expanded', 'true')

    if (supportsPopover) {
      this._content.showPopover()
    } else {
      this._content.removeAttribute('hidden')
      this._positionFallback()
      this._addOutsideListeners()
    }

    if (!supportsAnchor) {
      this._positionFallback()
    }

    // Focus first menu item
    const firstItem = this._getItems()[0]
    firstItem?.focus()

    this.dispatchEvent(
      new CustomEvent('st-menu:open', { bubbles: true }),
    )
  }

  hide() {
    if (!this._isOpen || !this._trigger || !this._content) return

    this._isOpen = false
    openMenus.delete(this)
    this._trigger.setAttribute('aria-expanded', 'false')

    if (supportsPopover) {
      this._content.hidePopover()
    } else {
      this._content.setAttribute('hidden', '')
      this._removeOutsideListeners()
    }

    this.dispatchEvent(
      new CustomEvent('st-menu:close', { bubbles: true }),
    )
  }

  toggle() {
    if (this._isOpen) {
      this.hide()
    } else {
      this.show()
    }
  }

  // ---------- Discovery ----------------------------------------------------

  private _discover() {
    this._trigger = this.querySelector('[data-menu-trigger]')
    this._content = this.querySelector('[data-menu-content]')
  }

  // ---------- ARIA setup ---------------------------------------------------

  private _initAria() {
    if (!this._trigger || !this._content) return

    // Ensure content has an id for aria-controls
    if (!this._content.id) {
      this._content.id = `st-menu-${Math.random().toString(36).slice(2, 9)}`
    }

    this._trigger.setAttribute('aria-haspopup', 'menu')
    this._trigger.setAttribute('aria-expanded', 'false')
    this._trigger.setAttribute('aria-controls', this._content.id)

    // Ensure content has role="menu"
    if (!this._content.hasAttribute('role')) {
      this._content.setAttribute('role', 'menu')
    }
  }

  // ---------- Trigger handling ---------------------------------------------

  private _initTrigger() {
    if (!this._trigger) return

    const onClick = (e: Event) => {
      e.preventDefault()
      this.toggle()
    }

    this._trigger.addEventListener('click', onClick)
    this._cleanups.push(() => this._trigger?.removeEventListener('click', onClick))
  }

  // ---------- Popover API setup --------------------------------------------

  private _initPopover() {
    if (!this._content || !this._trigger) return

    // Remove hidden attribute - popover API controls visibility
    this._content.removeAttribute('hidden')
    this._content.setAttribute('popover', 'auto')

    // Set up CSS anchor positioning if supported
    if (supportsAnchor) {
      const anchorName = `--st-menu-anchor-${Math.random().toString(36).slice(2, 9)}`
      this._trigger.style.setProperty('anchor-name', anchorName)
      this._content.style.setProperty('position-anchor', anchorName)
    }

    // Handle popover toggle events (covers Escape and light dismiss)
    const onToggle = (e: Event) => {
      const event = e as ToggleEvent
      if (event.newState === 'closed' && this._isOpen) {
        this._isOpen = false
        openMenus.delete(this)
        this._trigger?.setAttribute('aria-expanded', 'false')
        this._trigger?.focus()
        this.dispatchEvent(
          new CustomEvent('st-menu:close', { bubbles: true }),
        )
      }
    }

    this._content.addEventListener('toggle', onToggle)
    this._cleanups.push(() => this._content?.removeEventListener('toggle', onToggle))
  }

  // ---------- Keyboard navigation ------------------------------------------

  private _initKeyboard() {
    if (!this._content) return

    const onKeydown = (e: KeyboardEvent) => {
      if (!this._isOpen) return

      const items = this._getItems()
      const currentIndex = items.indexOf(document.activeElement as HTMLElement)

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0
          items[next]?.focus()
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          const prev = currentIndex > 0 ? currentIndex - 1 : items.length - 1
          items[prev]?.focus()
          break
        }
        case 'Home': {
          e.preventDefault()
          items[0]?.focus()
          break
        }
        case 'End': {
          e.preventDefault()
          items[items.length - 1]?.focus()
          break
        }
        case 'Enter':
        case ' ': {
          if (document.activeElement?.matches('[role="menuitem"]')) {
            e.preventDefault()
            ;(document.activeElement as HTMLElement).click()
          }
          break
        }
        case 'Escape': {
          if (!supportsPopover) {
            e.preventDefault()
            this.hide()
            this._trigger?.focus()
          }
          // Popover API handles Escape automatically
          break
        }
        case 'Tab': {
          // Close menu and let focus continue naturally
          this.hide()
          break
        }
      }
    }

    this._content.addEventListener('keydown', onKeydown)
    this._cleanups.push(() => this._content?.removeEventListener('keydown', onKeydown))

    // Close menu when a menu item is clicked
    const onItemClick = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.closest('[role="menuitem"]')) {
        // Delay close to let click action complete (e.g., link navigation)
        setTimeout(() => this.hide(), 0)
      }
    }

    this._content.addEventListener('click', onItemClick)
    this._cleanups.push(() => this._content?.removeEventListener('click', onItemClick))
  }

  // ---------- Menu items ---------------------------------------------------

  private _getItems(): HTMLElement[] {
    if (!this._content) return []
    return [...this._content.querySelectorAll<HTMLElement>('[role="menuitem"]')].filter(
      (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-disabled') !== 'true',
    )
  }

  // ---------- Fallback positioning (no anchor or no popover) ---------------

  private _positionFallback() {
    if (!this._trigger || !this._content) return

    const triggerRect = this._trigger.getBoundingClientRect()
    const contentRect = this._content.getBoundingClientRect()
    const placement = this.placement

    // Ensure position styles
    this._content.style.position = 'absolute'
    this._content.style.margin = '0'

    // Calculate base position
    let top: number
    let left: number

    const isTop = placement.startsWith('top')
    const isEnd = placement.endsWith('end')

    // Horizontal position
    if (isEnd) {
      left = triggerRect.right - contentRect.width
    } else {
      left = triggerRect.left
    }

    // Vertical position
    if (isTop) {
      top = triggerRect.top - contentRect.height
    } else {
      top = triggerRect.bottom
    }

    // Flip vertical if not enough space
    const viewportHeight = window.innerHeight
    if (!isTop && top + contentRect.height > viewportHeight) {
      top = triggerRect.top - contentRect.height
    } else if (isTop && top < 0) {
      top = triggerRect.bottom
    }

    // Flip horizontal if not enough space
    const viewportWidth = window.innerWidth
    if (left + contentRect.width > viewportWidth) {
      left = triggerRect.right - contentRect.width
    } else if (left < 0) {
      left = triggerRect.left
    }

    this._content.style.top = `${top + window.scrollY}px`
    this._content.style.left = `${left + window.scrollX}px`
  }

  // ---------- Fallback outside click/escape handling -----------------------

  private _outsideClickHandler: ((e: Event) => void) | null = null
  private _outsideKeyHandler: ((e: KeyboardEvent) => void) | null = null

  private _addOutsideListeners() {
    this._outsideClickHandler = (e: Event) => {
      const target = e.target as Node
      if (!this.contains(target)) {
        this.hide()
        this._trigger?.focus()
      }
    }

    this._outsideKeyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        this.hide()
        this._trigger?.focus()
      }
    }

    // Use setTimeout to avoid immediately closing from the trigger click
    setTimeout(() => {
      document.addEventListener('click', this._outsideClickHandler!)
      document.addEventListener('keydown', this._outsideKeyHandler!)
    }, 0)
  }

  private _removeOutsideListeners() {
    if (this._outsideClickHandler) {
      document.removeEventListener('click', this._outsideClickHandler)
      this._outsideClickHandler = null
    }
    if (this._outsideKeyHandler) {
      document.removeEventListener('keydown', this._outsideKeyHandler)
      this._outsideKeyHandler = null
    }
  }
}

customElements.define('st-menu', StMenu)

declare global {
  interface HTMLElementTagNameMap {
    'st-menu': StMenu
  }
}
