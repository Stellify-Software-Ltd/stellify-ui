/**
 * <sk-field>
 *
 * Wraps existing form-field markup (label + input + error container)
 * and adds desktop-grade input behaviour:
 *
 *   - Validates on blur (punish on commit), clears errors on input
 *     (reward as you correct)
 *   - Drives the existing [data-error] container; doesn't render
 *     its own error UI
 *   - Toggles aria-invalid on the inner input so existing
 *     Tailwind/shadcn aria-invalid: classes light up
 *   - Optional password-reveal button (any [data-reveal] inside)
 *
 * v0.1 ships with built-in validation rules (required / email /
 * minlength). v0.2 will accept a StellifyJS Form instance via
 * .bindTo(form) for full validation rule integration.
 */
export class SkField extends HTMLElement {
  private _mounted = false
  private _input: HTMLInputElement | null = null
  private _label: HTMLLabelElement | null = null
  private _errorBox: HTMLElement | null = null
  private _errorText: HTMLElement | null = null
  private _revealBtn: HTMLElement | null = null
  private _touched = false
  private _cleanups: Array<() => void> = []

  override connectedCallback() {
    if (this._mounted) return
    this._mounted = true

    this._discover()
    this._wire()
  }

  override disconnectedCallback() {
    this._cleanups.forEach((fn) => fn())
    this._cleanups = []
  }

  // ---------- Discover children -------------------------------------------

  private _discover() {
    this._input = this.querySelector('input, select, textarea') as HTMLInputElement | null
    this._label = this.querySelector('label')
    this._errorBox =
      this.querySelector<HTMLElement>('[data-error]') ??
      this.querySelector<HTMLElement>('div[style*="display: none"]')
    this._errorText = this._errorBox?.querySelector('p') ?? null
    this._revealBtn = this.querySelector('[data-reveal]')
  }

  // ---------- Wire events --------------------------------------------------

  private _wire() {
    if (!this._input) return

    const onInput = () => {
      if (this._touched && this._errorBox?.style.display !== 'none') {
        this._setError('')
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
    if (type === 'password' && value && value.length < 8 && minLength === 0) {
      this._setError('Password must be at least 8 characters.')
      return false
    }
    this._setError('')
    return true
  }

  private _setError(message: string) {
    if (!this._input) return
    if (message) {
      this._input.setAttribute('aria-invalid', 'true')
      if (this._errorBox) {
        this._errorBox.style.display = ''
        if (this._errorText) this._errorText.textContent = message
      }
    } else {
      this._input.removeAttribute('aria-invalid')
      if (this._errorBox) {
        this._errorBox.style.display = 'none'
        if (this._errorText) this._errorText.textContent = ''
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
