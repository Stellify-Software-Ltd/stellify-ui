/**
 * <st-checkbox>
 *
 * An accessible checkbox primitive. The element itself is the
 * checkbox (button + role="checkbox" + aria-checked); a hidden
 * native <input type="checkbox"> is created so it submits with
 * the form normally.
 *
 * Attributes:
 *   - name        — form field name (required for submission)
 *   - checked     — initial checked state (boolean attribute)
 *   - disabled    — disabled state
 */
export class StCheckbox extends HTMLElement {
  private _mounted = false
  private _input: HTMLInputElement | null = null

  static get observedAttributes() {
    return ['checked', 'disabled']
  }

  connectedCallback() {
    if (this._mounted) return
    this._mounted = true

    this.setAttribute('role', 'checkbox')
    this.setAttribute('tabindex', this.hasAttribute('disabled') ? '-1' : '0')
    this.setAttribute(
      'aria-checked',
      this.hasAttribute('checked') ? 'true' : 'false',
    )

    // Hidden form-submitting input
    const name = this.getAttribute('name')
    if (name) {
      const input = document.createElement('input')
      input.type = 'checkbox'
      input.name = name
      input.value = this.getAttribute('value') ?? 'on'
      input.checked = this.hasAttribute('checked')
      input.tabIndex = -1
      input.style.cssText =
        'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;'
      this.appendChild(input)
      this._input = input
    }

    this.addEventListener('click', this._onClick)
    this.addEventListener('keydown', this._onKey)
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._onClick)
    this.removeEventListener('keydown', this._onKey)
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null) {
    if (name === 'checked') {
      const isChecked = value !== null
      this.setAttribute('aria-checked', isChecked ? 'true' : 'false')
      if (this._input) this._input.checked = isChecked
    }
    if (name === 'disabled') {
      this.setAttribute('tabindex', value !== null ? '-1' : '0')
      this.setAttribute('aria-disabled', value !== null ? 'true' : 'false')
    }
  }

  // ---------- Public API ---------------------------------------------------

  get checked() {
    return this.hasAttribute('checked')
  }
  set checked(value: boolean) {
    if (value) this.setAttribute('checked', '')
    else this.removeAttribute('checked')
  }

  get disabled() {
    return this.hasAttribute('disabled')
  }
  set disabled(value: boolean) {
    if (value) this.setAttribute('disabled', '')
    else this.removeAttribute('disabled')
  }

  // ---------- Internal ----------------------------------------------------

  private _onClick = (e: Event) => {
    if (this.disabled) {
      e.preventDefault()
      return
    }
    this._toggle()
  }

  private _onKey = (e: KeyboardEvent) => {
    if (this.disabled) return
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      this._toggle()
    }
  }

  private _toggle() {
    this.checked = !this.checked
    this.dispatchEvent(
      new CustomEvent('st-checkbox:change', {
        detail: { checked: this.checked },
        bubbles: true,
      }),
    )
  }
}

customElements.define('st-checkbox', StCheckbox)

declare global {
  interface HTMLElementTagNameMap {
    'st-checkbox': StCheckbox
  }
}
