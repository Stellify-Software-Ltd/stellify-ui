/**
 * <sk-field>
 *
 * Wraps existing form-field markup (label + input + error container)
 * and adds desktop-grade input behaviour:
 *
 *   - Validates on blur (punish on commit), clears errors on input
 *     (reward as you correct)
 *   - Reads existing [data-error] element from server-rendered DOM
 *   - Toggles aria-invalid on the inner input so existing
 *     Tailwind/shadcn aria-invalid: classes light up
 *   - Optional password-reveal button (any [data-reveal] inside)
 *   - If server rendered an error (aria-invalid or [data-error] present),
 *     treats the field as touched so client-side validation runs immediately
 *
 * v0.1 ships with built-in validation rules (required / email /
 * minlength). v0.2 will accept a StellifyJS Form instance via
 * .bindTo(form) for full validation rule integration.
 */
export class SkField extends HTMLElement {
  private _mounted = false
  private _input: HTMLInputElement | null = null
  private _label: HTMLLabelElement | null = null
  private _errorEl: HTMLElement | null = null
  private _revealBtn: HTMLElement | null = null
  private _touched = false
  private _cleanups: Array<() => void> = []

  connectedCallback() {
    if (this._mounted) return
    this._mounted = true

    this._discover()
    this._wire()
  }

  disconnectedCallback() {
    this._cleanups.forEach((fn) => fn())
    this._cleanups = []
  }

  // ---------- Discover children -------------------------------------------

  private _discover() {
    this._input = this.querySelector('input, select, textarea') as HTMLInputElement | null
    this._label = this.querySelector('label')
    this._errorEl = this.querySelector<HTMLElement>('[data-error]')
    this._revealBtn = this.querySelector('[data-reveal]')

    // If Blade (or any server) rendered a pre-existing error, mark the
    // field as touched so client-side validation runs immediately on
    // subsequent edits rather than waiting for a blur event.
    if (this._errorEl || this._input?.hasAttribute('aria-invalid')) {
      this._touched = true
    }
  }

  // ---------- Wire events --------------------------------------------------

  private _wire() {
    if (!this._input) return

    const onInput = () => {
      if (this._touched) {
        this._validateLocal()
      }
    }
    const onBlur = () => {
      this._touched = true
      this._validateLocal()
    }
    this._input.addEventListener('input', onInput)
    this._input.addEventListener('blur', onBlur)
    this._cleanups.push(() => {
      this._input?.removeEventListener('input', onInput)
      this._input?.removeEventListener('blur', onBlur)
    })

    if (this._revealBtn && this._input.type === 'password') {
      const onReveal = () => {
        if (!this._input) return
        const next = this._input.type === 'password' ? 'text' : 'password'
        this._input.type = next
        this._revealBtn?.setAttribute(
          'aria-label',
          next === 'text' ? 'Hide password' : 'Show password',
        )
      }
      this._revealBtn.addEventListener('click', onReveal)
      this._cleanups.push(() =>
        this._revealBtn?.removeEventListener('click', onReveal),
      )
    }
  }

  // ---------- Public API ---------------------------------------------------

  /** Run validation. Marks the field as touched and updates UI. */
  validate(): boolean {
    this._touched = true
    return this._validateLocal()
  }

  /** Set a server-side error (e.g. from a 422 response). */
  setServerError(message: string) {
    this._touched = true
    this._setError(message)
  }

  /** Focus the inner input. */
  override focus() {
    this._input?.focus()
  }

  get fieldName(): string {
    return this._input?.name ?? ''
  }

  get fieldValue(): string {
    return this._input?.value ?? ''
  }

  // ---------- Internal -----------------------------------------------------

  private _validateLocal(): boolean {
    if (!this._input) return true

    const value = this._input.value.trim()
    const type = this._input.type
    const required = this._input.required
    const minLength = this._input.minLength
    const labelText = this._label?.textContent?.trim() || 'This field'

    if (required && !value) {
      this._setError(`${labelText} is required.`)
      return false
    }
    if (
      type === 'email' &&
      value &&
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)
    ) {
      this._setError('Enter a valid email address.')
      return false
    }
    if (minLength > 0 && value && value.length < minLength) {
      this._setError(`Must be at least ${minLength} characters.`)
      return false
    }
    this._setError('')
    return true
  }

  private _setError(message: string) {
    if (!this._input) return

    if (message) {
      this._input.setAttribute('aria-invalid', 'true')

      if (this._errorEl) {
        // Update existing error element and ensure it's visible
        this._errorEl.textContent = message
        this._errorEl.removeAttribute('hidden')
      } else {
        // Create error element matching server-rendered shape
        const errorEl = document.createElement('p')
        errorEl.setAttribute('data-error', '')
        errorEl.className = 'text-sm text-destructive'
        errorEl.textContent = message
        this.appendChild(errorEl)
        this._errorEl = errorEl
      }
    } else {
      this._input.removeAttribute('aria-invalid')

      if (this._errorEl) {
        // Hide rather than remove, preserving server-rendered element
        this._errorEl.setAttribute('hidden', '')
      }
    }
  }
}

customElements.define('sk-field', SkField)

declare global {
  interface HTMLElementTagNameMap {
    'sk-field': SkField
  }
}
