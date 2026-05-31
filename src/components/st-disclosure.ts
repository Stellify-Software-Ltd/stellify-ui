import './st-disclosure.css'

/**
 * <st-disclosure>
 *
 * Inline show/hide of a content section, triggered by a button. Use for inline
 * forms, expandable details, edit-in-place patterns, and other "reveal more"
 * interactions. Unlike st-dialog, this is not modal — the rest of the page
 * stays interactive.
 */
export class StDisclosure extends HTMLElement {
  private _mounted = false
  private _trigger: HTMLElement | null = null
  private _content: HTMLElement | null = null
  private _cleanups: Array<() => void> = []

  connectedCallback() {
    if (this._mounted) return
    this._mounted = true

    this._trigger = this.querySelector<HTMLElement>('[data-disclosure-trigger]')
    if (!this._trigger) {
      console.warn('<st-disclosure>: No [data-disclosure-trigger] element found.')
      return
    }

    this._content = this.querySelector<HTMLElement>('[data-disclosure-content]')
    if (!this._content) {
      console.warn('<st-disclosure>: No [data-disclosure-content] element found.')
      return
    }

    this._initState()
    this._initAria()
    this._initEventListeners()
  }

  disconnectedCallback() {
    this._cleanups.forEach((fn) => fn())
    this._cleanups = []
    this._mounted = false
  }

  // ---------- Public API ---------------------------------------------------

  get isOpen(): boolean {
    return this._content ? !this._content.hidden : false
  }

  open(): void {
    if (!this._trigger || !this._content || this.isOpen) return

    this._content.hidden = false
    this._trigger.hidden = true
    this._trigger.setAttribute('aria-expanded', 'true')

    this._focusFirstFocusable()

    this.dispatchEvent(
      new CustomEvent('st-disclosure:open', { bubbles: true }),
    )
  }

  close(): void {
    if (!this._trigger || !this._content || !this.isOpen) return

    this._content.hidden = true
    this._trigger.hidden = false
    this._trigger.setAttribute('aria-expanded', 'false')
    this._trigger.focus()

    this.dispatchEvent(
      new CustomEvent('st-disclosure:close', { bubbles: true }),
    )
  }

  toggle(): void {
    if (this.isOpen) {
      this.close()
    } else {
      this.open()
    }
  }

  // ---------- Initialization -----------------------------------------------

  private _initState(): void {
    if (!this._trigger || !this._content) return

    // Check for data-open-by-default attribute on host
    const openByDefault = this.hasAttribute('data-open-by-default')

    if (openByDefault) {
      // Start open: content visible, trigger hidden
      this._content.hidden = false
      this._trigger.hidden = true
    } else {
      // Determine initial state from hidden attributes
      const contentHidden = this._content.hidden || this._content.hasAttribute('hidden')
      const triggerHidden = this._trigger.hidden || this._trigger.hasAttribute('hidden')

      if (triggerHidden && !contentHidden) {
        // Trigger is hidden, content is visible -> start open
        this._content.hidden = false
        this._trigger.hidden = true
      } else {
        // Default to closed (content hidden, trigger visible)
        this._content.hidden = true
        this._trigger.hidden = false
      }
    }
  }

  private _initAria(): void {
    if (!this._trigger || !this._content) return

    // Generate content id if not present
    if (!this._content.id) {
      this._content.id = `st-disclosure-content-${Math.random().toString(36).slice(2, 9)}`
    }

    // Set ARIA attributes on trigger
    this._trigger.setAttribute('aria-controls', this._content.id)
    this._trigger.setAttribute('aria-expanded', this.isOpen ? 'true' : 'false')
  }

  private _initEventListeners(): void {
    if (!this._trigger) return

    // Click handler on trigger to open
    const onTriggerClick = (e: Event) => {
      e.preventDefault()
      this.open()
    }
    this._trigger.addEventListener('click', onTriggerClick)
    this._cleanups.push(() => this._trigger?.removeEventListener('click', onTriggerClick))

    // Event delegation for close buttons inside content
    const onHostClick = (e: Event) => {
      const target = e.target as HTMLElement
      const closeButton = target.closest<HTMLElement>('[data-disclosure-close]')
      if (closeButton && this._content?.contains(closeButton)) {
        e.preventDefault()
        this.close()
      }
    }
    this.addEventListener('click', onHostClick)
    this._cleanups.push(() => this.removeEventListener('click', onHostClick))

    // Escape key to close
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault()
        this.close()
      }
    }
    this.addEventListener('keydown', onKeydown)
    this._cleanups.push(() => this.removeEventListener('keydown', onKeydown))
  }

  // ---------- Focus management ---------------------------------------------

  private _focusFirstFocusable(): void {
    if (!this._content) return

    // Priority: [autofocus] > input/select/textarea/button/a[href]/[tabindex]
    const selector =
      '[autofocus]:not(:disabled):not([hidden]), ' +
      'input:not(:disabled):not([hidden]):not([type="hidden"]), ' +
      'select:not(:disabled):not([hidden]), ' +
      'textarea:not(:disabled):not([hidden]), ' +
      'button:not(:disabled):not([hidden]), ' +
      'a[href]:not([hidden]), ' +
      '[tabindex]:not([tabindex="-1"]):not(:disabled):not([hidden])'

    const firstFocusable = this._content.querySelector<HTMLElement>(selector)

    if (firstFocusable) {
      firstFocusable.focus()
    } else {
      // Nothing focusable inside content, focus the content itself
      if (!this._content.hasAttribute('tabindex')) {
        this._content.setAttribute('tabindex', '-1')
      }
      this._content.focus()
    }
  }
}

customElements.define('st-disclosure', StDisclosure)

declare global {
  interface HTMLElementTagNameMap {
    'st-disclosure': StDisclosure
  }
}
